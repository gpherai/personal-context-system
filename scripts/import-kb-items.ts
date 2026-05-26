/**
 * Import script: KB Items → PCS Source records
 *
 * Leest alle Items uit de KB database inclusief hun taxonomy koppelingen.
 * Maakt PCS Source records aan met type-specifieke metadata.
 * Koppelt Sources aan de PCS Themes die door seed-kb-taxonomy.ts zijn aangemaakt.
 *
 * Voer eerst seed-kb-taxonomy.ts uit zodat de Themes beschikbaar zijn.
 * Veilig om meerdere keren te draaien: bestaande Sources worden overgeslagen.
 */

import "dotenv/config";

import pg from "pg";

import { slugifyName, sourceMetadataSchema, type SourceMetadata } from "../src/domain/context";
import { getPrismaClient } from "../src/infrastructure/database/client";

const KB_DATABASE_URL = "postgresql://gerald:dev_kb_2026@localhost:5433/sanatana_kb";

interface KbItem {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  url: string | null;
  metadata: Record<string, unknown>;
}

interface KbItemTaxonomy {
  itemId: string;
  name: string;
  category: "deity" | "tradition" | "topic" | "tag";
  slug: string | null;
}

const pool = new pg.Pool({ connectionString: KB_DATABASE_URL });

async function query<T>(sql: string): Promise<T[]> {
  const result = await pool.query(sql);
  return result.rows as T[];
}

function contentTypeToSourceType(contentType: string): string {
  const map: Record<string, string> = {
    VIDEO: "video",
    BOOK: "book",
    POST: "post",
    IMAGE: "image",
    SADHANA: "sadhana",
    UPADESHA: "upadesha",
    STOTRA: "stotra",
    DEITY_CONCEPT: "deity_concept"
  };
  return map[contentType] ?? "post";
}

function buildMetadata(type: string, item: KbItem): SourceMetadata {
  const url = item.url ?? undefined;
  const meta = item.metadata as Record<string, unknown>;

  const raw = (() => {
    switch (type) {
      case "video":
        return { type, url, channel: meta.channel as string | undefined, language: meta.language as string | undefined };
      case "book":
        return {
          type,
          authors: Array.isArray(meta.authors) ? (meta.authors as string[]) : [],
          isbn: meta.isbn as string | undefined,
          year: typeof meta.year === "number" ? meta.year : undefined,
          publisher: meta.publisher as string | undefined,
          language: meta.language as string | undefined
        };
      case "post":
        return { type, url, author: meta.author as string | undefined, publishedAt: meta.publishedAt as string | undefined };
      case "image":
        return { type, url, alt: meta.alt as string | undefined, photographer: meta.photographer as string | undefined };
      case "sadhana":
        return {
          type,
          tradition: meta.tradition as string | undefined,
          deity: meta.deity as string | undefined,
          language: meta.language as string | undefined,
          format: (meta.format as "text" | "audio" | "video") ?? undefined
        };
      case "upadesha":
        return {
          type,
          teacher: meta.teacher as string | undefined,
          tradition: meta.tradition as string | undefined,
          language: meta.language as string | undefined,
          format: (meta.format as "text" | "audio" | "video") ?? undefined
        };
      case "stotra":
        return {
          type,
          deity: meta.deity as string | undefined,
          tradition: meta.tradition as string | undefined,
          language: meta.language as string | undefined,
          script: meta.script as string | undefined
        };
      case "deity_concept":
        return {
          type,
          tradition: meta.tradition as string | undefined,
          language: meta.language as string | undefined,
          aliases: Array.isArray(meta.aliases) ? (meta.aliases as string[]) : []
        };
      default:
        return { type: "post" as const };
    }
  })();

  return sourceMetadataSchema.parse(raw);
}

const prisma = getPrismaClient();

async function main() {
  console.log("Ophalen KB items...");

  const items = await query<KbItem>(
    `SELECT id, title, description, "contentType", url, metadata FROM "Item" ORDER BY "createdAt"`
  );

  const taxonomyRows = await query<{ itemId: string; name: string; category: string; slug: string | null }>(`
    SELECT id."itemId", d.name, 'deity' as category, NULL as slug
    FROM "ItemDeity" id JOIN "Deity" d ON id."deityId" = d.id
    UNION ALL
    SELECT it."itemId", t.name, 'tradition', NULL
    FROM "ItemTradition" it JOIN "Tradition" t ON it."traditionId" = t.id
    UNION ALL
    SELECT itp."itemId", tp.name, 'topic', NULL
    FROM "ItemTopic" itp JOIN "Topic" tp ON itp."topicId" = tp.id
    UNION ALL
    SELECT itg."itemId", tg.name, 'tag', tg.slug
    FROM "ItemTag" itg JOIN "Tag" tg ON itg."tagId" = tg.id
  `);

  const taxonomyByItem = new Map<string, KbItemTaxonomy[]>();
  for (const row of taxonomyRows) {
    const list = taxonomyByItem.get(row.itemId) ?? [];
    list.push(row as KbItemTaxonomy);
    taxonomyByItem.set(row.itemId, list);
  }

  console.log(`  ${items.length} items ophalen, ${taxonomyRows.length} taxonomy koppelingen`);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const type = contentTypeToSourceType(item.contentType);

    // Idempotentie: skip als Source met zelfde KB id al bestaat (opgeslagen in metadata.kbId)
    const existing = await prisma.source.findFirst({
      where: { metadata: { path: ["kbId"], equals: item.id } },
      select: { id: true }
    });

    if (existing) {
      skipped++;
      process.stdout.write(".");
      continue;
    }

    let metadata: SourceMetadata;
    try {
      metadata = buildMetadata(type, item);
    } catch {
      console.warn(`\nSkip item ${item.id} (${item.title}): metadata parse mislukt`);
      skipped++;
      continue;
    }

    // Zoek PCS Theme ids voor deze item's taxonomy
    const itemTaxonomy = taxonomyByItem.get(item.id) ?? [];
    const themeIds: string[] = [];

    for (const tax of itemTaxonomy) {
      let slug: string;
      if (tax.category === "deity") slug = `deity-${slugifyName(tax.name)}`;
      else if (tax.category === "tradition") slug = `tradition-${slugifyName(tax.name)}`;
      else if (tax.category === "topic") slug = `topic-${slugifyName(tax.name)}`;
      else slug = `tag-${tax.slug || slugifyName(tax.name)}`;

      const theme = await prisma.theme.findUnique({ where: { slug }, select: { id: true } });
      if (theme) themeIds.push(theme.id);
    }

    // Sla KB id op in metadata voor idempotentie
    const fullMetadata = { ...metadata, kbId: item.id };

    const source = await prisma.source.create({
      data: {
        type: type as never,
        title: item.title,
        description: item.description ?? null,
        status: "active",
        metadata: fullMetadata as never
      }
    });

    // Koppel themes
    for (const themeId of themeIds) {
      await prisma.sourceTheme.create({ data: { sourceId: source.id, themeId } });
    }

    created++;
    process.stdout.write("+");
  }

  console.log(`\n\nKlaar. ${created} sources aangemaakt, ${skipped} overgeslagen.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
