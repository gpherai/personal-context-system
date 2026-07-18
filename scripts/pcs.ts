/**
 * pcs — werkbank-CLI om geïmporteerde ChatGPT-gesprekken (Source type=conversation)
 * te doorzoeken en er Entries + citaten uit te distilleren.
 *
 * Winst zit in selectie op berichtniveau, niet in transport: een gesprek van
 * 100k tokens uitprinten kost evenveel als het bestand lezen. Dit is dus een
 * zoek- en schrijfgereedschap, geen viewer.
 *
 * Eigen PrismaClient i.p.v. getPrismaClient() uit src/infrastructure/database/client.ts:
 * dat bestand importeert "server-only", wat buiten Next's RSC-bundling altijd throwt.
 * Om diezelfde reden herimplementeert dit script de kleine stukjes entry/theme-sync
 * logica uit PrismaContextRepository i.p.v. die klasse te importeren.
 *
 * Gebruik:
 *   npm run pcs -- conv list [--starred] [--from 2025-01] [--min-messages 10] [--unmined] [--limit 20]
 *   npm run pcs -- conv search "<query>" [--limit 20]
 *   npm run pcs -- conv show <sourceId> [--from 0] [--to 20]
 *   npm run pcs -- excerpt add <sourceId> --message <position> --text "..." [--note "..."]
 *   npm run pcs -- entry add --title "..." --body "..." [--type insight] [--excerpt <excerptId>]
 *                             [--source <sourceId>] [--theme <name>] [--privacy private]
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { excerptTextIsQuoted, slugifyName } from "../src/domain/context";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface Flags {
  [key: string]: string | boolean | string[];
}

function parseArgs(argv: string[]): { positionals: string[]; flags: Flags } {
  const positionals: string[] = [];
  const flags: Flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      const value = next !== undefined && !next.startsWith("--") ? (i++, next) : true;
      if (key in flags) {
        flags[key] = ([] as string[]).concat(flags[key] as never, value as never);
      } else {
        flags[key] = value;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, flags };
}

function flagString(flags: Flags, key: string): string | undefined {
  const v = flags[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function flagStrings(flags: Flags, key: string): string[] {
  const v = flags[key];
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

function flagBool(flags: Flags, key: string): boolean {
  return flags[key] === true;
}

function flagNumber(flags: Flags, key: string): number | undefined {
  const v = flagString(flags, key);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

interface ConversationMetadata {
  type: "conversation";
  conversationId: string;
  createdAt?: string;
  messageCount?: number;
  isStarred?: boolean;
  isArchived?: boolean;
}

function asConversationMetadata(value: unknown): ConversationMetadata | null {
  if (value && typeof value === "object" && (value as { type?: unknown }).type === "conversation") {
    return value as ConversationMetadata;
  }
  return null;
}

async function cmdConvList(flags: Flags) {
  const starredOnly = flagBool(flags, "starred");
  const from = flagString(flags, "from"); // "YYYY-MM"
  const minMessages = flagNumber(flags, "min-messages");
  const unminedOnly = flagBool(flags, "unmined");
  const limit = flagNumber(flags, "limit") ?? 20;

  const sources = await prisma.source.findMany({
    where: { type: "conversation" },
    select: {
      id: true,
      title: true,
      metadata: true,
      entries: { select: { entryId: true }, take: 1 },
      excerpts: { select: { entries: { select: { entryId: true }, take: 1 } }, take: 5 }
    }
  });

  const rows = sources
    .map((s) => ({ ...s, meta: asConversationMetadata(s.metadata) }))
    .filter((s): s is typeof s & { meta: ConversationMetadata } => s.meta !== null)
    .filter((s) => !starredOnly || s.meta.isStarred === true)
    .filter((s) => !from || (s.meta.createdAt ?? "") >= from)
    .filter((s) => minMessages === undefined || (s.meta.messageCount ?? 0) >= minMessages)
    .filter((s) => {
      if (!unminedOnly) return true;
      const hasDirectLink = s.entries.length > 0;
      const hasExcerptLink = s.excerpts.some((e) => e.entries.length > 0);
      return !hasDirectLink && !hasExcerptLink;
    })
    .sort((a, b) => (b.meta.createdAt ?? "").localeCompare(a.meta.createdAt ?? ""))
    .slice(0, limit);

  if (rows.length === 0) {
    console.log("Geen gesprekken gevonden voor deze filters.");
    return;
  }

  for (const row of rows) {
    const date = row.meta.createdAt?.slice(0, 10) ?? "unknown";
    const star = row.meta.isStarred ? "*" : " ";
    console.log(`${star} ${row.id}  ${date}  [${row.meta.messageCount ?? 0} msg]  ${row.title}`);
  }
  console.log(`\n${rows.length} gesprek(ken) getoond.`);
}

async function cmdConvSearch(query: string, flags: Flags) {
  if (!query) {
    throw new Error('Gebruik: pcs conv search "<query>" [--limit 20]');
  }
  const limit = flagNumber(flags, "limit") ?? 20;

  const matches = await prisma.sourceMessage.findMany({
    where: { text: { contains: query, mode: "insensitive" } },
    select: { id: true, sourceId: true, position: true, role: true, text: true, source: { select: { title: true } } },
    take: limit,
    orderBy: { createdAt: "desc" }
  });

  if (matches.length === 0) {
    console.log("Geen treffers.");
    return;
  }

  for (const m of matches) {
    const idx = m.text.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, idx - 60);
    const end = Math.min(m.text.length, idx + query.length + 60);
    const snippet = `${start > 0 ? "…" : ""}${m.text.slice(start, end).replace(/\s+/g, " ")}${end < m.text.length ? "…" : ""}`;
    console.log(`${m.sourceId}#${m.position} [${m.role}] ${m.source.title}`);
    console.log(`  ${snippet}`);
  }
  console.log(`\n${matches.length} treffer(s) getoond.`);
}

async function cmdConvShow(sourceId: string, flags: Flags) {
  if (!sourceId) {
    throw new Error("Gebruik: pcs conv show <sourceId> [--from 0] [--to 20]");
  }
  const from = flagNumber(flags, "from") ?? 0;
  const to = flagNumber(flags, "to") ?? from + 20;

  const source = await prisma.source.findUnique({ where: { id: sourceId }, select: { title: true } });
  if (!source) {
    throw new Error(`Source "${sourceId}" niet gevonden.`);
  }

  const messages = await prisma.sourceMessage.findMany({
    where: { sourceId, position: { gte: from, lte: to } },
    orderBy: { position: "asc" }
  });

  console.log(`# ${source.title} (${sourceId})\n`);
  for (const m of messages) {
    console.log(`--- #${m.position} [${m.role}]${m.model ? ` (${m.model})` : ""} ---`);
    console.log(m.text);
    console.log();
  }
  console.log(`Berichten ${from}-${to} van deze reeks getoond (gebruik --from/--to voor een ander bereik).`);
}

async function cmdExcerptAdd(sourceId: string, flags: Flags) {
  const position = flagNumber(flags, "message");
  const text = flagString(flags, "text");
  const note = flagString(flags, "note");

  if (!sourceId || position === undefined || !text) {
    throw new Error('Gebruik: pcs excerpt add <sourceId> --message <position> --text "..." [--note "..."]');
  }

  const message = await prisma.sourceMessage.findUnique({
    where: { sourceId_position: { sourceId, position } },
    select: { id: true, text: true }
  });
  if (!message) {
    throw new Error(`Bericht #${position} niet gevonden op source "${sourceId}".`);
  }

  if (!excerptTextIsQuoted(text, message.text)) {
    throw new Error("Excerpt-tekst is geen letterlijk citaat uit het bericht — geen verzonnen citaten toegestaan.");
  }

  const excerpt = await prisma.sourceExcerpt.create({
    data: { sourceId, messageId: message.id, text, note: note ?? null }
  });

  console.log(`Excerpt aangemaakt: ${excerpt.id}`);
}

async function syncThemeNames(entryId: string, themeNames: string[]) {
  const seen = new Set<string>();
  for (const name of themeNames) {
    const slug = slugifyName(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const theme = await prisma.theme.upsert({ where: { slug }, update: { name }, create: { slug, name } });
    await prisma.entryTheme.upsert({
      where: { entryId_themeId: { entryId, themeId: theme.id } },
      update: {},
      create: { entryId, themeId: theme.id }
    });
  }
}

async function cmdEntryAdd(flags: Flags) {
  const title = flagString(flags, "title");
  const body = flagString(flags, "body");
  const type = flagString(flags, "type") ?? "observation";
  const privacyLevel = flagString(flags, "privacy") ?? "private";
  const excerptIds = flagStrings(flags, "excerpt");
  const sourceIds = flagStrings(flags, "source");
  const themeNames = flagStrings(flags, "theme");

  if (!title || !body) {
    throw new Error('Gebruik: pcs entry add --title "..." --body "..." [--type insight] [--excerpt <id>] [--source <id>] [--theme <name>] [--privacy private]');
  }

  const entry = await prisma.entry.create({
    data: {
      type: type as never,
      status: "active",
      title,
      body,
      privacyLevel: privacyLevel as never
    }
  });

  if (sourceIds.length > 0) {
    await prisma.entrySource.createMany({ data: sourceIds.map((sourceId) => ({ entryId: entry.id, sourceId })) });
  }
  if (excerptIds.length > 0) {
    await prisma.entryExcerpt.createMany({ data: excerptIds.map((excerptId) => ({ entryId: entry.id, excerptId })) });
  }
  await syncThemeNames(entry.id, themeNames);

  console.log(`Entry aangemaakt: ${entry.id}`);
}

async function main() {
  const [, , ...argv] = process.argv;
  const [group, subcommand, ...rest] = argv;
  const { positionals, flags } = parseArgs(rest);

  if (group === "conv" && subcommand === "list") {
    return cmdConvList(flags);
  }
  if (group === "conv" && subcommand === "search") {
    return cmdConvSearch(positionals[0], flags);
  }
  if (group === "conv" && subcommand === "show") {
    return cmdConvShow(positionals[0], flags);
  }
  if (group === "excerpt" && subcommand === "add") {
    return cmdExcerptAdd(positionals[0], flags);
  }
  if (group === "entry" && subcommand === "add") {
    return cmdEntryAdd(flags);
  }

  console.log(
    [
      "Onbekend commando. Beschikbaar:",
      "  pcs conv list [--starred] [--from 2025-01] [--min-messages 10] [--unmined] [--limit 20]",
      '  pcs conv search "<query>" [--limit 20]',
      "  pcs conv show <sourceId> [--from 0] [--to 20]",
      '  pcs excerpt add <sourceId> --message <position> --text "..." [--note "..."]',
      '  pcs entry add --title "..." --body "..." [--type insight] [--excerpt <id>] [--source <id>] [--theme <name>] [--privacy private]'
    ].join("\n")
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
