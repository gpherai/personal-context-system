/**
 * Import script: Claude.ai data export → PCS Source records (type "conversation")
 *
 * Leest `conversations.json` en `projects/*.json` rechtstreeks uit de export-zip via
 * het systeem-`unzip` (geen nieuwe dependency, geen binaire attachments/afbeeldingen gelezen —
 * die zitten niet eens in deze export).
 *
 * Twee stappen:
 * 1. Elk Claude Project (`projects/*.json`) wordt een Theme (upsert op slug). Sources worden
 *    NIET automatisch aan een Theme gekoppeld — Claude's export bevat geen project-verwijzing
 *    per gesprek (in tegenstelling tot ChatGPT's conversation_template_id). Koppeling van
 *    gesprekken aan een Theme is een handmatige vervolgstap via de source-edit UI.
 * 2. Elk gesprek in `conversations.json` wordt een Source (privacyLevel=private) + een
 *    SourceMessage-rij per bericht MET tekst (tool-only turns worden overgeslagen, zie
 *    src/domain/claude-export.ts). Branches (geregenereerde/bewerkte antwoorden) worden allemaal
 *    bewaard met een `isActivePath`-vlag in SourceMessage.metadata.
 *
 * Idempotent: upsert op metadata.conversationId (Source) en slug (Theme), dus een 2e run werkt
 * bestaande records bij i.p.v. te dupliceren.
 *
 * Eigen PrismaClient i.p.v. getPrismaClient() uit src/infrastructure/database/client.ts:
 * dat bestand importeert "server-only", wat buiten Next's RSC-bundling altijd throwt.
 *
 * Gebruik: npm run import:claude -- [pad-naar-export.zip]
 * (of CLAUDE_EXPORT_ZIP env var; default docs/claudeexport110726.zip)
 */

import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";

import { parseClaudeConversation, type ClaudeExportConversation } from "../src/domain/claude-export";
import { metadataToSearchText, slugifyName, sourceMetadataSchema } from "../src/domain/context";
import { PrismaClient } from "../src/generated/prisma/client";

const ZIP_PATH = process.argv[2] ?? process.env.CLAUDE_EXPORT_ZIP ?? "docs/claudeexport110726.zip";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface ClaudeExportProject {
  uuid?: unknown;
  name?: unknown;
  description?: unknown;
  prompt_template?: unknown;
  docs?: unknown;
}

function listZipEntries(pattern: RegExp): string[] {
  const raw = execFileSync("unzip", ["-Z1", ZIP_PATH]);
  return raw
    .toString("utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((name) => pattern.test(name))
    .sort();
}

function readZipJsonEntry(entryName: string): unknown {
  const raw = execFileSync("unzip", ["-p", ZIP_PATH, entryName], { maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.toString("utf8"));
}

async function seedThemesFromProjects(): Promise<{ created: number; updated: number }> {
  const entryNames = listZipEntries(/^projects\/.*\.json$/);
  let created = 0;
  let updated = 0;

  for (const entryName of entryNames) {
    const project = readZipJsonEntry(entryName) as ClaudeExportProject;
    const name = typeof project.name === "string" && project.name.trim() ? project.name.trim() : undefined;
    if (!name) continue;

    const slug = slugifyName(name);
    const docs = Array.isArray(project.docs) ? project.docs : [];
    const docFilenames = docs
      .map((d) => (d && typeof d === "object" && "filename" in d ? (d as { filename?: unknown }).filename : undefined))
      .filter((f): f is string => typeof f === "string");

    const metadata = {
      source: "claude-project",
      claudeProjectUuid: typeof project.uuid === "string" ? project.uuid : undefined,
      promptTemplate: typeof project.prompt_template === "string" ? project.prompt_template : undefined,
      docFilenames
    };

    const description = typeof project.description === "string" && project.description.trim() ? project.description.trim() : null;

    const existing = await prisma.theme.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      await prisma.theme.update({ where: { id: existing.id }, data: { name, description, metadata } });
      updated++;
    } else {
      await prisma.theme.create({ data: { slug, name, description, metadata, status: "active" } });
      created++;
    }
  }

  return { created, updated };
}

async function importConversations(): Promise<{ created: number; updated: number }> {
  const conversations = readZipJsonEntry("conversations.json") as ClaudeExportConversation[];
  if (!Array.isArray(conversations)) {
    throw new Error("Expected an array of conversations in conversations.json");
  }

  let created = 0;
  let updated = 0;

  for (const raw of conversations) {
    const parsed = parseClaudeConversation(raw);

    if (!parsed.conversationId) {
      console.warn(`\nSkip gesprek zonder conversationId: "${parsed.title}"`);
      continue;
    }

    const metadata = sourceMetadataSchema.parse({
      type: "conversation",
      provider: "claude",
      conversationId: parsed.conversationId,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
      messageCount: parsed.messageCount,
      charCount: parsed.charCount,
      hasBranching: parsed.hasBranching,
      toolUseCount: parsed.toolUseCount,
      toolNames: parsed.toolNames,
      hasThinking: parsed.hasThinking
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
            occurredAt: new Date(message.timestamp),
            metadata: {
              parentMessageUuid: message.parentMessageUuid,
              isActivePath: message.isActivePath,
              toolsUsed: message.toolsUsed,
              hasThinking: message.hasThinking,
              attachments: message.attachments,
              files: message.files
            }
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

  return { created, updated };
}

async function main() {
  console.log("Themes seeden vanuit Claude Projects...");
  const themeResult = await seedThemesFromProjects();
  console.log(`Klaar. ${themeResult.created} themes aangemaakt, ${themeResult.updated} bijgewerkt.`);

  console.log("\nGesprekken importeren uit conversations.json...");
  const convoResult = await importConversations();
  console.log(`\n\nKlaar. ${convoResult.created} conversation-sources aangemaakt, ${convoResult.updated} bijgewerkt.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
