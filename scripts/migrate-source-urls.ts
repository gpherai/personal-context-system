/**
 * Migrates URL fields from Source metadata (video, post, image types)
 * to first-class Reference entities linked via SourceReference.
 *
 * Run: npx tsx scripts/migrate-source-urls.ts
 * Dry run: npx tsx scripts/migrate-source-urls.ts --dry
 */

import "dotenv/config";

import { getPrismaClient } from "../src/infrastructure/database/client.js";

const dry = process.argv.includes("--dry");
const prisma = getPrismaClient();

async function main() {
  const prefix = dry ? "[DRY RUN] " : "";
  console.log(prefix + "Starting source URL migration…");

  const sources = await prisma.source.findMany({
    where: { type: { in: ["video", "post", "image"] } },
    include: {
      references: { include: { reference: { select: { url: true } } } }
    }
  });

  console.log(`Found ${sources.length} sources of type video/post/image.`);

  let migrated = 0;
  let skipped = 0;

  for (const source of sources) {
    const meta = source.metadata as Record<string, unknown>;
    const url = typeof meta.url === "string" ? meta.url.trim() : null;

    if (!url) {
      skipped++;
      continue;
    }

    const alreadyLinked = source.references.some((sr) => sr.reference.url === url);
    if (alreadyLinked) {
      console.log(`  SKIP [${source.id}] ${source.title} — URL already linked`);
      skipped++;
      continue;
    }

    console.log(`  MIGRATE [${source.id}] ${source.title}`);
    console.log(`    url: ${url}`);

    if (!dry) {
      let hostname = url;
      try { hostname = new URL(url).hostname; } catch { /* keep */ }

      const reference = await prisma.reference.create({
        data: { kind: "url", title: hostname, url }
      });

      await prisma.sourceReference.create({
        data: { sourceId: source.id, referenceId: reference.id }
      });

      const newMeta: Record<string, unknown> = { ...meta };
      delete newMeta.url;
      await prisma.source.update({
        where: { id: source.id },
        data: { metadata: newMeta as Parameters<typeof prisma.source.update>[0]["data"]["metadata"] }
      });
    }

    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);

  if (dry) {
    console.log("\n[DRY RUN] No changes written. Remove --dry to apply.");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); });
