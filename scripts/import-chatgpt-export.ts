/**
 * Import script: ChatGPT data export → PCS Source records (type "conversation")
 *
 * Leest de `conversations-*.json`-bestanden rechtstreeks uit de export-zip via
 * het systeem-`unzip` (geen nieuwe dependency, geen binaire attachments gelezen).
 * Elk gesprek wordt een Source (privacyLevel=private) + een SourceMessage-rij per
 * bericht op het actieve gesprekspad.
 *
 * Idempotent en herbruikbaar: upsert op metadata.conversationId, dus een 2e run met
 * een gegroeid/bijgewerkt gesprek werkt de bestaande Source + berichten bij i.p.v.
 * te skippen.
 *
 * Eigen PrismaClient i.p.v. getPrismaClient() uit src/infrastructure/database/client.ts:
 * dat bestand importeert "server-only", wat buiten Next's RSC-bundling altijd throwt.
 *
 * Gebruik: npm run import:chatgpt -- [pad-naar-export.zip]
 * (of CHATGPT_EXPORT_ZIP env var; default docs/chatgptexport099726.zip)
 */

import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";

import { parseChatGptConversation, type ChatGptExportConversation } from "../src/domain/chatgpt-export";
import { metadataToSearchText, sourceMetadataSchema } from "../src/domain/context";
import { PrismaClient } from "../src/generated/prisma/client";

const ZIP_PATH = process.argv[2] ?? process.env.CHATGPT_EXPORT_ZIP ?? "docs/chatgptexport099726.zip";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function listConversationEntries(): string[] {
  const raw = execFileSync("unzip", ["-Z1", ZIP_PATH]);
  return raw
    .toString("utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((name) => /^conversations-\d+\.json$/.test(name))
    .sort();
}

function readZipJsonEntry(entryName: string): unknown[] {
  const raw = execFileSync("unzip", ["-p", ZIP_PATH, entryName], { maxBuffer: 256 * 1024 * 1024 });
  const parsed = JSON.parse(raw.toString("utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array of conversations in ${entryName}`);
  }
  return parsed;
}

async function main() {
  const entryNames = listConversationEntries();
  if (entryNames.length === 0) {
    throw new Error(`No conversations-*.json entries found in ${ZIP_PATH}`);
  }

  let created = 0;
  let updated = 0;

  for (const entryName of entryNames) {
    console.log(`\nLezen ${entryName}...`);
    const conversations = readZipJsonEntry(entryName) as ChatGptExportConversation[];

    for (const raw of conversations) {
      const parsed = parseChatGptConversation(raw);

      if (!parsed.conversationId) {
        console.warn(`\nSkip gesprek zonder conversationId: "${parsed.title}"`);
        continue;
      }

      const metadata = sourceMetadataSchema.parse({
        type: "conversation",
        provider: "chatgpt",
        conversationId: parsed.conversationId,
        model: parsed.model,
        models: parsed.models,
        createdAt: parsed.createdAt,
        updatedAt: parsed.updatedAt,
        messageCount: parsed.messageCount,
        charCount: parsed.charCount,
        isArchived: parsed.isArchived,
        isStarred: parsed.isStarred,
        isStudyMode: parsed.isStudyMode,
        pinnedTime: parsed.pinnedTime,
        projectId: parsed.projectId
      });

      const sourceData = {
        type: "conversation" as const,
        title: parsed.title,
        body: parsed.body,
        status: "active" as const,
        metadata: metadata as never,
        searchText: metadataToSearchText(metadata) || null
      };

      const existing = await prisma.source.findFirst({
        where: { metadata: { path: ["conversationId"], equals: parsed.conversationId } },
        select: { id: true }
      });

      await prisma.$transaction(async (tx) => {
        const source = existing
          ? await tx.source.update({ where: { id: existing.id }, data: sourceData, select: { id: true } })
          : await tx.source.create({ data: { ...sourceData, privacyLevel: "private" }, select: { id: true } });

        await tx.sourceMessage.deleteMany({ where: { sourceId: source.id } });
        if (parsed.messages.length > 0) {
          await tx.sourceMessage.createMany({
            data: parsed.messages.map((message, position) => ({
              sourceId: source.id,
              externalId: message.id,
              position,
              role: message.role,
              text: message.text,
              model: message.model,
              occurredAt: new Date(message.timestamp),
              metadata: message.urls.length > 0 ? { urls: message.urls } : {}
            }))
          });
        }

      });

      if (existing) {
        updated++;
        process.stdout.write(".");
      } else {
        created++;
        process.stdout.write("+");
      }
    }
  }

  console.log(`\n\nKlaar. ${created} conversation-sources aangemaakt, ${updated} bijgewerkt.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
