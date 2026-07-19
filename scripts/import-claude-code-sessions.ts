/**
 * Import script: raw Claude Code session transcripts → PCS Source records (type "conversation")
 *
 * Leest `docs/claude-code-sessions/<project-dir>/<session-id>.jsonl` (zie
 * src/domain/claude-code-export.ts voor de parse-/filterlogica: alleen
 * mens-getypte prompts en assistant-tekstantwoorden worden bewaard, tool
 * calls/edits/hook-instructies/thinking vallen weg en surfacen alleen als
 * geaggregeerde `toolNames`/`skillsUsed` op de Source zelf).
 *
 * Elke projectmap wordt een Theme (upsert op slug = basename van de map), en
 * elke sessie wordt automatisch aan die Theme gekoppeld — in tegenstelling tot
 * de Claude.ai-import kennen we hier de working directory per sessie
 * betrouwbaar, dus is auto-linken hier wel zinvol.
 *
 * Idempotent: upsert op metadata.conversationId (= session-uuid uit de
 * bestandsnaam), dus een 2e run werkt bestaande records bij i.p.v. te
 * dupliceren. Sessies zonder overgebleven berichten na filtering worden
 * overgeslagen (en verwijderd als ze al eerder waren geïmporteerd maar nu
 * leeg blijken).
 *
 * Eigen PrismaClient i.p.v. getPrismaClient() uit src/infrastructure/database/client.ts:
 * dat bestand importeert "server-only", wat buiten Next's RSC-bundling altijd throwt.
 *
 * Gebruik: npm run import:claude-code -- [pad-naar-sessions-map]
 * (of CLAUDE_CODE_SESSIONS_DIR env var; default docs/claude-code-sessions)
 */

import "dotenv/config";

import * as fs from "node:fs";
import * as path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { parseClaudeCodeSession } from "../src/domain/claude-code-export";
import { metadataToSearchText, slugifyName, sourceMetadataSchema } from "../src/domain/context";
import { PrismaClient } from "../src/generated/prisma/client";

const SESSIONS_DIR = process.argv[2] ?? process.env.CLAUDE_CODE_SESSIONS_DIR ?? "docs/claude-code-sessions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function listSessionFiles(root: string): { projectDir: string; filePath: string; sessionId: string }[] {
  if (!fs.existsSync(root)) return [];

  const files: { projectDir: string; filePath: string; sessionId: string }[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const projectDir = entry.name;
    const dirPath = path.join(root, projectDir);
    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith(".jsonl")) continue;
      files.push({ projectDir, filePath: path.join(dirPath, file), sessionId: file.slice(0, -".jsonl".length) });
    }
  }
  return files;
}

function readJsonlEvents(filePath: string): unknown[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const events: unknown[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // Skip malformed lines (e.g. a truncated final line from an interrupted write).
    }
  }
  return events;
}

const themeIdByDir = new Map<string, string>();

async function themeIdForProjectDir(projectDir: string): Promise<string> {
  const cached = themeIdByDir.get(projectDir);
  if (cached) return cached;

  const slug = slugifyName(projectDir);
  const existing = await prisma.theme.findUnique({ where: { slug }, select: { id: true } });

  const id = existing
    ? existing.id
    : (
        await prisma.theme.create({
          data: {
            slug,
            name: projectDir,
            metadata: { source: "claude-code-project", projectDir },
            status: "active"
          },
          select: { id: true }
        })
      ).id;

  themeIdByDir.set(projectDir, id);
  return id;
}

async function importSessions(): Promise<{ created: number; updated: number; skipped: number; deleted: number }> {
  const files = listSessionFiles(SESSIONS_DIR);
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let deleted = 0;

  for (const file of files) {
    const events = readJsonlEvents(file.filePath);
    const parsed = parseClaudeCodeSession(file.sessionId, events);

    const existing = await prisma.source.findFirst({
      where: { metadata: { path: ["conversationId"], equals: parsed.sessionId } },
      select: { id: true }
    });

    if (parsed.messages.length === 0) {
      if (existing) {
        await prisma.source.delete({ where: { id: existing.id } });
        deleted++;
        process.stdout.write("x");
      } else {
        skipped++;
      }
      continue;
    }

    const metadata = sourceMetadataSchema.parse({
      type: "conversation",
      provider: "claude-code",
      conversationId: parsed.sessionId,
      model: parsed.model,
      models: parsed.models,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
      messageCount: parsed.messageCount,
      charCount: parsed.charCount,
      toolUseCount: parsed.toolUseCount,
      toolNames: parsed.toolNames,
      skillsUsed: parsed.skillsUsed,
      hasThinking: parsed.hasThinking
    });

    const sourceData = {
      type: "conversation" as const,
      title: parsed.title,
      body: parsed.body,
      status: "active" as const,
      metadata: metadata as never,
      searchText: metadataToSearchText(metadata) || null,
      // Preserve the real conversation dates instead of letting Prisma's
      // @default(now())/@updatedAt stamp the import run time — otherwise
      // "sort by newest" reflects import order, not when the session happened.
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt)
    };

    const themeId = await themeIdForProjectDir(parsed.projectDir ?? file.projectDir);

    await prisma.$transaction(async (tx) => {
      const source = existing
        ? await tx.source.update({ where: { id: existing.id }, data: sourceData, select: { id: true } })
        : await tx.source.create({ data: { ...sourceData, privacyLevel: "private" }, select: { id: true } });

      await tx.sourceMessage.deleteMany({ where: { sourceId: source.id } });
      await tx.sourceMessage.createMany({
        data: parsed.messages.map((message, position) => ({
          sourceId: source.id,
          externalId: message.id,
          position,
          role: message.role,
          text: message.text,
          model: message.model,
          occurredAt: new Date(message.timestamp)
        }))
      });

      await tx.sourceTheme.deleteMany({ where: { sourceId: source.id } });
      await tx.sourceTheme.create({ data: { sourceId: source.id, themeId } });
    });

    if (existing) {
      updated++;
      process.stdout.write(".");
    } else {
      created++;
      process.stdout.write("+");
    }
  }

  return { created, updated, skipped, deleted };
}

async function main() {
  console.log(`Claude Code sessions importeren uit ${SESSIONS_DIR}...`);
  const result = await importSessions();
  console.log(
    `\n\nKlaar. ${result.created} conversation-sources aangemaakt, ${result.updated} bijgewerkt, ` +
      `${result.skipped} lege sessies overgeslagen, ${result.deleted} eerder-geïmporteerde-nu-lege sessies verwijderd.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
