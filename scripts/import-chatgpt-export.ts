/**
 * Import script: ChatGPT data export → PCS Source records (type "conversation")
 *
 * Leest de `conversations-*.json`-bestanden rechtstreeks uit de export-zip via
 * het systeem-`unzip` (geen nieuwe dependency, geen binaire attachments gelezen).
 * Elk gesprek wordt een ruwe Source (privacyLevel=private) zonder curatie.
 *
 * Idempotent: een Source met dezelfde metadata.conversationId wordt overgeslagen.
 *
 * Eigen PrismaClient i.p.v. getPrismaClient() uit src/infrastructure/database/client.ts:
 * dat bestand importeert "server-only", wat buiten Next's RSC-bundling altijd throwt.
 */

import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";

import { parseChatGptConversation, type ChatGptExportConversation } from "../src/domain/chatgpt-export";
import { metadataToSearchText, sourceMetadataSchema } from "../src/domain/context";
import { PrismaClient } from "../src/generated/prisma/client";

const ZIP_PATH = process.env.CHATGPT_EXPORT_ZIP ?? "docs/chatgptexport099726.zip";
const ENTRY_NAMES = [
  "conversations-000.json",
  "conversations-001.json",
  "conversations-002.json",
  "conversations-003.json",
  "conversations-004.json"
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function readZipJsonEntry(entryName: string): unknown[] {
  const raw = execFileSync("unzip", ["-p", ZIP_PATH, entryName], { maxBuffer: 256 * 1024 * 1024 });
  const parsed = JSON.parse(raw.toString("utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array of conversations in ${entryName}`);
  }
  return parsed;
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const entryName of ENTRY_NAMES) {
    console.log(`\nLezen ${entryName}...`);
    const conversations = readZipJsonEntry(entryName) as ChatGptExportConversation[];

    for (const raw of conversations) {
      const parsed = parseChatGptConversation(raw);

      if (!parsed.conversationId) {
        console.warn(`\nSkip gesprek zonder conversationId: "${parsed.title}"`);
        skipped++;
        continue;
      }

      const existing = await prisma.source.findFirst({
        where: { metadata: { path: ["conversationId"], equals: parsed.conversationId } },
        select: { id: true }
      });

      if (existing) {
        skipped++;
        process.stdout.write(".");
        continue;
      }

      const metadata = sourceMetadataSchema.parse({
        type: "conversation",
        provider: "chatgpt",
        conversationId: parsed.conversationId,
        model: parsed.model,
        createdAt: parsed.createdAt,
        updatedAt: parsed.updatedAt,
        messageCount: parsed.messageCount,
        messages: parsed.messages
      });

      await prisma.source.create({
        data: {
          type: "conversation",
          title: parsed.title,
          body: parsed.body,
          status: "active",
          privacyLevel: "private",
          metadata: metadata as never,
          searchText: metadataToSearchText(metadata) || null
        }
      });

      created++;
      process.stdout.write("+");
    }
  }

  console.log(`\n\nKlaar. ${created} conversation-sources aangemaakt, ${skipped} overgeslagen.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
