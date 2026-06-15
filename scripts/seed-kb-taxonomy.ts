/**
 * Seed script: KB taxonomy → PCS Themes + Relationships
 *
 * Leest Deities, Traditions, Topics, Tags uit de KB database.
 * Maakt PCS Theme records aan met metadata.category.
 * Zet parent-child relaties via setThemeParent (cycle guard).
 * Maakt Relationship records aan voor DeityTradition koppelingen.
 *
 * Veilig om meerdere keren te draaien (idempotent via upsert op slug).
 */

import "dotenv/config";

import pg from "pg";

import { slugifyName } from "../src/domain/context";
import { getPrismaClient } from "../src/infrastructure/database/client";
import { PrismaContextRepository } from "../src/infrastructure/database/prisma-context-repository";

const KB_DATABASE_URL = "postgresql://gerald:dev_kb_2026@localhost:5433/sanatana_kb";

interface KbDeity {
  id: string;
  name: string;
  otherNames: string[];
  description: string | null;
  parentId: string | null;
}

interface KbTradition {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

interface KbTopic {
  id: string;
  name: string;
  description: string | null;
}

interface KbTag {
  id: string;
  name: string;
  slug: string;
}

const pool = new pg.Pool({ connectionString: KB_DATABASE_URL });

async function queryKb<T>(sql: string): Promise<T[]> {
  const result = await pool.query(sql);
  return result.rows as T[];
}

const prisma = getPrismaClient();
const repo = new PrismaContextRepository(prisma);

async function upsertTheme(slug: string, name: string, description: string | null, metadata: Record<string, unknown>) {
  return prisma.theme.upsert({
    where: { slug },
    update: { name, description, metadata: metadata as never },
    create: { slug, name, description, metadata: metadata as never }
  });
}

async function main() {
  console.log("Ophalen KB taxonomy...");

  const [deities, traditions, topics, tags] = await Promise.all([
    queryKb<KbDeity>('SELECT id, name, "otherNames", description, "parentId" FROM "Deity" ORDER BY name'),
    queryKb<KbTradition>('SELECT id, name, description, "parentId" FROM "Tradition" ORDER BY name'),
    queryKb<KbTopic>("SELECT id, name, description FROM \"Topic\" ORDER BY name"),
    queryKb<KbTag>("SELECT id, name, slug FROM \"Tag\" ORDER BY name")
  ]);

  console.log(`  ${deities.length} deities, ${traditions.length} tradities, ${topics.length} onderwerpen, ${tags.length} tags`);

  // KB id → PCS Theme id mapping
  const deityThemeId = new Map<string, string>();
  const traditionThemeId = new Map<string, string>();

  // --- Deities ---
  console.log("\nDeities aanmaken...");
  for (const deity of deities) {
    const slug = `deity-${slugifyName(deity.name)}`;
    const theme = await upsertTheme(slug, deity.name, deity.description, {
      category: "deity",
      aliases: deity.otherNames ?? []
    });
    deityThemeId.set(deity.id, theme.id);
    process.stdout.write(".");
  }
  console.log();

  // Deity parent-child
  console.log("Deity hiërarchie instellen...");
  for (const deity of deities.filter((d) => d.parentId)) {
    const themeId = deityThemeId.get(deity.id)!;
    const parentThemeId = deityThemeId.get(deity.parentId!)!;
    if (parentThemeId) {
      await repo.setThemeParent(themeId, parentThemeId);
    }
  }

  // --- Traditions ---
  console.log("Tradities aanmaken...");
  for (const tradition of traditions) {
    const slug = `tradition-${slugifyName(tradition.name)}`;
    const theme = await upsertTheme(slug, tradition.name, tradition.description, { category: "tradition" });
    traditionThemeId.set(tradition.id, theme.id);
    process.stdout.write(".");
  }
  console.log();

  // Tradition parent-child
  console.log("Traditie hiërarchie instellen...");
  for (const tradition of traditions.filter((t) => t.parentId)) {
    const themeId = traditionThemeId.get(tradition.id)!;
    const parentThemeId = traditionThemeId.get(tradition.parentId!)!;
    if (parentThemeId) {
      await repo.setThemeParent(themeId, parentThemeId);
    }
  }

  // --- Topics ---
  console.log("Onderwerpen aanmaken...");
  for (const topic of topics) {
    const slug = `topic-${slugifyName(topic.name)}`;
    await upsertTheme(slug, topic.name, topic.description, { category: "topic" });
    process.stdout.write(".");
  }
  console.log();

  // --- Tags ---
  console.log("Tags aanmaken...");
  for (const tag of tags) {
    const slug = `tag-${tag.slug || slugifyName(tag.name)}`;
    await upsertTheme(slug, tag.name, null, { category: "tag" });
    process.stdout.write(".");
  }
  console.log();

  console.log(`\nKlaar. ${deities.length} deities, ${traditions.length} tradities, ${topics.length} onderwerpen, ${tags.length} tags aangemaakt.`);
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
