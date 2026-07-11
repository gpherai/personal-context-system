import { createHash } from "node:crypto";

import {
  findForbiddenMetadataKeys,
  privacyLevels,
  type BundleManifest,
  type BundleSelection,
  type EntryStatus,
  type EntryType,
  type PrivacyLevel
} from "@/domain/context";
import type {
  ContextMirrorSnapshot,
  EntryRecord,
  JsonObject,
  NamedRecord,
  QuestionRecord,
  SourceRecord,
  ThreadRecord
} from "@/repositories/context-repository";

export interface MirrorBuildContext {
  snapshot: ContextMirrorSnapshot;
  entries: EntryRecord[];
  themes: NamedRecord[];
  projects: NamedRecord[];
  sources: SourceRecord[];
  generatedAtIso: string;
}

export type MirrorExtension = (ctx: MirrorBuildContext) => ContextMirrorFile[];

interface EntryMirrorDto {
  id: string;
  type: EntryType;
  status: EntryStatus;
  privacyLevel: PrivacyLevel;
  title: string;
  summary: string | undefined;
  body: string;
  source: string | undefined;
  confidence: number | undefined;
  occurredAt: string | undefined;
  capturedAt: string;
  updatedAt: string;
  metadata: JsonObject;
  themes: Array<{ id: string; slug: string; name: string }>;
  projects: Array<{ id: string; slug: string; name: string }>;
  questions: Array<{ id: string; prompt: string }>;
  sources: Array<{ id: string; type: string; title: string }>;
}

function toEntryMirrorDto(entry: EntryRecord): EntryMirrorDto {
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    privacyLevel: entry.privacyLevel,
    title: entry.title,
    summary: entry.summary,
    body: entry.body,
    source: entry.source,
    confidence: entry.confidence,
    occurredAt: entry.occurredAt?.toISOString(),
    capturedAt: entry.capturedAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    metadata: entry.metadata,
    themes: entry.themes.map(({ id, slug, name }) => ({ id, slug, name })),
    projects: entry.projects.map(({ id, slug, name }) => ({ id, slug, name })),
    questions: entry.questions.map(({ id, prompt }) => ({ id, prompt })),
    sources: entry.sources.map(({ id, type, title }) => ({ id, type, title }))
  };
}

export interface ContextMirrorFile {
  path: string;
  contents: string;
}

export interface ContextMirrorBuild {
  generatedAt: string;
  files: ContextMirrorFile[];
}

function formatDate(value?: Date): string {
  return value ? value.toISOString().slice(0, 10) : "unknown";
}

// Collapse newlines to spaces so user content cannot inject headings or list items
// into Markdown structure (headings end at first newline; list items break on newline).
export function sanitizeInline(s: string): string {
  return s.replace(/\r?\n|\r/g, " ").trim();
}

// Wrap multi-line user-authored content with explicit delimiters so AI consumers
// can distinguish generated document structure from user-written prose.
function wrapUserContent(s: string): string {
  return `<!-- user-content-start -->\n${s}\n<!-- user-content-end -->`;
}

function excerpt(entry: EntryRecord): string {
  return (entry.summary || entry.body).replace(/\s+/g, " ").trim().slice(0, 220);
}

function metadataBlock(entry: EntryRecord): string {
  const themes = entry.themes.map((theme) => sanitizeInline(theme.name)).join(", ") || "none";
  const projects = entry.projects.map((project) => sanitizeInline(project.name)).join(", ") || "none";
  const sources = entry.sources.map((s) => `${sanitizeInline(s.title)} (${s.id})`).join(", ") || "none";

  return [
    `- id: ${entry.id}`,
    `- type: ${entry.type}`,
    `- status: ${entry.status}`,
    `- privacy: ${entry.privacyLevel}`,
    `- captured: ${entry.capturedAt.toISOString()}`,
    `- occurred: ${entry.occurredAt ? entry.occurredAt.toISOString() : "unknown"}`,
    `- themes: ${themes}`,
    `- projects: ${projects}`,
    `- sources: ${sources}`
  ].join("\n");
}

function entryMarkdown(entry: EntryRecord): string {
  return [
    `# ${sanitizeInline(entry.title)}`,
    "",
    metadataBlock(entry),
    "",
    "## Summary",
    "",
    wrapUserContent(entry.summary || excerpt(entry) || "No summary."),
    "",
    "## Body",
    "",
    wrapUserContent(entry.body),
    ""
  ].join("\n");
}

function buildEntrySlugMap(entries: EntryRecord[], kind: "themes" | "projects"): Map<string, EntryRecord[]> {
  const map = new Map<string, EntryRecord[]>();
  for (const entry of entries) {
    for (const named of entry[kind]) {
      const bucket = map.get(named.slug);
      if (bucket) {
        bucket.push(entry);
      } else {
        map.set(named.slug, [entry]);
      }
    }
  }
  return map;
}

function namedList(title: string, records: NamedRecord[]): string {
  const lines = records.length
    ? records.map((record) => `- ${sanitizeInline(record.name)} (${record.slug})${record.entryCount !== undefined ? ` - ${record.entryCount} entries` : ""}`)
    : ["- None"];

  return [`## ${title}`, "", ...lines].join("\n");
}

function threadList(threads: Omit<ThreadRecord, "entries">[]): string {
  if (!threads.length) {
    return "- None";
  }

  return threads.map((thread) => `- [${thread.status}] ${sanitizeInline(thread.title)} (${thread.slug})`).join("\n");
}

function threadMarkdown(thread: ThreadRecord, generatedAtIso: string): string {
  return [
    `# ${sanitizeInline(thread.title)}`,
    "",
    `Generated: ${generatedAtIso}`,
    "",
    `- id: ${thread.id}`,
    `- slug: ${thread.slug}`,
    `- status: ${thread.status}`,
    `- updated: ${thread.updatedAt.toISOString()}`,
    "",
    "## Description",
    "",
    wrapUserContent(thread.description || "No description."),
    "",
    "## Entries",
    "",
    entryList(thread.entries),
    ""
  ].join("\n");
}

function questionList(questions: QuestionRecord[]): string {
  if (!questions.length) {
    return "- None";
  }

  return questions.map((question) => `- [${question.status}] ${sanitizeInline(question.prompt)} (${question.id})`).join("\n");
}

function recentList(entries: EntryRecord[]): string {
  if (!entries.length) {
    return "- None";
  }

  return entries
    .slice(0, 30)
    .map(
      (entry) =>
        `- ${formatDate(entry.occurredAt ?? entry.capturedAt)} [${entry.type}/${entry.status}/${entry.privacyLevel}] ${sanitizeInline(entry.title)} (${entry.id})`
    )
    .join("\n");
}

function entryList(entries: EntryRecord[]): string {
  if (!entries.length) {
    return "- None";
  }

  return entries
    .map(
      (entry) =>
        `- ${formatDate(entry.occurredAt ?? entry.capturedAt)} [${entry.type}/${entry.status}/${entry.privacyLevel}] ${sanitizeInline(entry.title)} (${entry.id})\n  - ${sanitizeInline(excerpt(entry))}`
    )
    .join("\n");
}

function timelineList(entries: EntryRecord[]): string {
  if (!entries.length) {
    return "- None";
  }

  return entries
    .map((entry) => {
      const timelineDate = entry.occurredAt ?? entry.capturedAt;
      return [
        `## ${formatDate(timelineDate)} - ${sanitizeInline(entry.title)}`,
        "",
        `- id: ${entry.id}`,
        `- type: ${entry.type}`,
        `- status: ${entry.status}`,
        `- privacy: ${entry.privacyLevel}`,
        `- captured: ${entry.capturedAt.toISOString()}`,
        `- occurred: ${entry.occurredAt ? entry.occurredAt.toISOString() : "unknown"}`,
        "",
        sanitizeInline(excerpt(entry)),
        ""
      ].join("\n");
    })
    .join("\n");
}

function bundleMarkdown({
  title,
  generatedAtIso,
  scope,
  entries,
  questions = [],
  sources = [],
  localOnly = false
}: {
  title: string;
  generatedAtIso: string;
  scope: string;
  entries: EntryRecord[];
  questions?: QuestionRecord[];
  sources?: SourceRecord[];
  localOnly?: boolean;
}): string {
  const lines = [
    `# ${title}`,
    "",
    `Generated: ${generatedAtIso}`,
    `Scope: ${scope}`,
    localOnly ? "WARNING: LOCAL ONLY — contains private/sensitive entries. Do not share." : "Source of truth: PostgreSQL.",
    "",
    "## Counts",
    "",
    `- entries: ${entries.length}`,
    `- questions: ${questions.length}`,
    ...(sources.length ? [`- sources: ${sources.length}`] : []),
    "",
    "## Questions",
    "",
    questionList(questions),
    "",
    "## Entries",
    "",
    entryList(entries),
    ""
  ];

  if (sources.length) {
    lines.push("## Sources", "", sourceList(sources), "");
  }

  return lines.join("\n");
}

function entryJson(entry: EntryRecord): string {
  return JSON.stringify(toEntryMirrorDto(entry), null, 2);
}

function sourceList(sources: SourceRecord[]): string {
  if (!sources.length) return "- None";
  return sources
    .map((s) => `- [${s.type}] ${sanitizeInline(s.title)} (${s.id})${s.themes.length ? " — " + s.themes.map((t) => sanitizeInline(t.name)).join(", ") : ""}`)
    .join("\n");
}

function sourceMarkdown(source: SourceRecord, generatedAtIso: string): string {
  const metaEntries = Object.entries(source.metadata)
    .filter(([k]) => k !== "type")
    .map(([k, v]) => {
      if (v === null || v === undefined) return `- ${k}: `;
      if (Array.isArray(v)) return `- ${k}: ${(v as unknown[]).map((item) => (typeof item === "object" ? JSON.stringify(item) : sanitizeInline(String(item)))).join(", ")}`;
      if (typeof v === "object") return `- ${k}: ${JSON.stringify(v)}`;
      return `- ${k}: ${sanitizeInline(String(v))}`;
    });

  const referencesLines = source.references.length
    ? source.references.map((r) => `- ${sanitizeInline(r.title)}${r.url ? ": " + r.url : ""}`)
    : [];

  return [
    `# ${sanitizeInline(source.title)}`,
    "",
    `Generated: ${generatedAtIso}`,
    "",
    `- id: ${source.id}`,
    `- type: ${source.type}`,
    `- status: ${source.status}`,
    `- themes: ${source.themes.map((t) => sanitizeInline(t.name)).join(", ") || "none"}`,
    "",
    ...(metaEntries.length ? ["## Metadata", "", ...metaEntries, ""] : []),
    ...(source.description ? ["## Description", "", wrapUserContent(source.description), ""] : []),
    ...(referencesLines.length ? ["## References", "", ...referencesLines, ""] : []),
    ...(source.body ? ["## Body", "", wrapUserContent(source.body), ""] : [])
  ].join("\n");
}

function sortedEntries(entries: EntryRecord[]): EntryRecord[] {
  return [...entries].sort(
    (a, b) => (b.occurredAt ?? b.capturedAt).getTime() - (a.occurredAt ?? a.capturedAt).getTime()
  );
}

function sortedNamed<T extends { name: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildContextMirror(
  snapshot: ContextMirrorSnapshot,
  generatedAt = new Date(),
  extensions: MirrorExtension[] = []
): ContextMirrorBuild {
  const generatedAtIso = generatedAt.toISOString();
  const files: ContextMirrorFile[] = [];

  const entries = sortedEntries(snapshot.entries);
  const themes = sortedNamed(snapshot.themes);
  const projects = sortedNamed(snapshot.projects);
  const sources = [...snapshot.sources].sort((a, b) => a.title.localeCompare(b.title));

  const entriesByTheme = buildEntrySlugMap(entries, "themes");
  const entriesByProject = buildEntrySlugMap(entries, "projects");

  const manifest = {
    generatedAt: generatedAtIso,
    counts: {
      entries: entries.length,
      openQuestions: snapshot.openQuestions.length,
      themes: themes.length,
      projects: projects.length,
      threads: snapshot.threads.length,
      sources: sources.length
    },
    files: [] as string[]
  };

  files.push({
    path: "ai-index.md",
    contents: [
      "# Personal Context System - AI Index",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      "This is a generated local context mirror. Source of truth: PostgreSQL.",
      "",
      "## Current Counts",
      "",
      `- entries: ${entries.length}`,
      `- question queue: ${snapshot.openQuestions.length}`,
      `- themes: ${themes.length}`,
      `- projects: ${projects.length}`,
      `- threads: ${snapshot.threads.length}`,
      `- sources: ${sources.length}`,
      "",
      "## Recent Entries",
      "",
      recentList(entries),
      "",
      "## Question Queue",
      "",
      questionList(snapshot.openQuestions),
      ""
    ].join("\n")
  });

  files.push({
    path: "recent.md",
    contents: ["# Recent Entries", "", `Generated: ${generatedAtIso}`, "", recentList(entries), ""].join("\n")
  });

  files.push({
    path: "today.md",
    contents: [
      "# Today",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      "## Recent Entries",
      "",
      recentList(entries.slice(0, 12)),
      "",
      "## Question Queue",
      "",
      questionList(snapshot.openQuestions),
      ""
    ].join("\n")
  });

  files.push({
    path: "question-queue.md",
    contents: ["# Question Queue", "", `Generated: ${generatedAtIso}`, "", questionList(snapshot.openQuestions), ""].join("\n")
  });

  files.push({
    path: "ai-bundle.md",
    contents: [
      "# Compact AI Context Bundle",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      "Use this as a short starting context. Source of truth remains PostgreSQL.",
      "",
      "## Current Counts",
      "",
      `- entries: ${entries.length}`,
      `- question queue: ${snapshot.openQuestions.length}`,
      `- themes: ${themes.length}`,
      `- projects: ${projects.length}`,
      `- threads: ${snapshot.threads.length}`,
      "",
      "## Question Queue",
      "",
      questionList(snapshot.openQuestions.slice(0, 12)),
      "",
      "## Recent Entries",
      "",
      recentList(entries.slice(0, 12)),
      ""
    ].join("\n")
  });

  const shareableEntries = entries.filter((entry) => entry.privacyLevel === "shareable");

  files.push({
    path: "bundles/local-full.md",
    contents: bundleMarkdown({
      title: "Local Full Context Bundle",
      generatedAtIso,
      scope: "local-full",
      entries,
      questions: snapshot.openQuestions,
      localOnly: true
    })
  });

  files.push({
    path: "bundles/shareable-only.md",
    contents: bundleMarkdown({
      title: "Shareable Context Bundle",
      generatedAtIso,
      scope: "shareable-only",
      entries: shareableEntries
    })
  });

  files.push({
    path: "themes/index.md",
    contents: ["# Themes", "", `Generated: ${generatedAtIso}`, "", namedList("Themes", themes), ""].join("\n")
  });

  for (const theme of themes) {
    const themeEntries = entriesByTheme.get(theme.slug) ?? [];
    files.push({
      path: `themes/${theme.slug}.md`,
      contents: [
        `# ${sanitizeInline(theme.name)}`,
        "",
        `Generated: ${generatedAtIso}`,
        "",
        theme.description ? wrapUserContent(theme.description) : "",
        "",
        "## Entries",
        "",
        entryList(themeEntries),
        ""
      ].join("\n")
    });
  }

  files.push({
    path: "projects/index.md",
    contents: ["# Projects", "", `Generated: ${generatedAtIso}`, "", namedList("Projects", projects), ""].join("\n")
  });

  for (const project of projects) {
    const projectEntries = entriesByProject.get(project.slug) ?? [];
    const projectQuestions = snapshot.openQuestions.filter((question) =>
      projectEntries.some((entry) => entry.questions.some((entryQuestion) => entryQuestion.id === question.id))
    );

    files.push({
      path: `projects/${project.slug}.md`,
      contents: [
        `# ${sanitizeInline(project.name)}`,
        "",
        `Generated: ${generatedAtIso}`,
        "",
        project.description ? wrapUserContent(project.description) : "",
        "",
        "## Entries",
        "",
        entryList(projectEntries),
        ""
      ].join("\n")
    });

    files.push({
      path: `bundles/projects/${project.slug}.md`,
      contents: bundleMarkdown({
        title: `${project.name} Project Context Bundle`,
        generatedAtIso,
        scope: `project:${project.slug}`,
        entries: projectEntries,
        questions: projectQuestions,
        localOnly: true
      })
    });
  }

  files.push({
    path: "threads/index.md",
    contents: ["# Threads", "", `Generated: ${generatedAtIso}`, "", threadList(snapshot.threads), ""].join("\n")
  });

  for (const thread of snapshot.threads) {
    files.push({
      path: `threads/${thread.slug}.md`,
      contents: threadMarkdown(thread, generatedAtIso)
    });
  }

  // Sources
  const sourcesByType = sources.reduce<Record<string, SourceRecord[]>>((acc, s) => {
    (acc[s.type] ??= []).push(s);
    return acc;
  }, {});

  files.push({
    path: "sources/index.md",
    contents: ["# Sources", "", `Generated: ${generatedAtIso}`, "", `Total: ${sources.length}`, "", sourceList(sources), ""].join("\n")
  });

  files.push({
    path: "sources/index.json",
    contents: JSON.stringify(
      sources.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        status: s.status,
        themes: s.themes.map((t) => t.name)
      })),
      null,
      2
    )
  });

  for (const [type, typeSources] of Object.entries(sourcesByType)) {
    files.push({
      path: `sources/by-type/${type}.md`,
      contents: [`# Sources: ${type}`, "", `Generated: ${generatedAtIso}`, "", sourceList(typeSources), ""].join("\n")
    });
  }

  for (const source of sources) {
    files.push({
      path: `sources/${source.id}.md`,
      contents: sourceMarkdown(source, generatedAtIso)
    });
  }

  const extensionCtx: MirrorBuildContext = { snapshot, entries, themes, projects, sources, generatedAtIso };
  for (const extension of extensions) {
    files.push(...extension(extensionCtx));
  }

  files.push({
    path: "timeline/entries.md",
    contents: [
      "# Entry Timeline",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      timelineList(entries),
      ""
    ].join("\n")
  });

  files.push({
    path: "timeline/shareable.md",
    contents: [
      "# Shareable Entry Timeline",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      timelineList(entries.filter((entry) => entry.privacyLevel === "shareable")),
      ""
    ].join("\n")
  });

  for (const question of snapshot.openQuestions) {
    const questionEntries = entries.filter((entry) =>
      entry.questions.some((entryQuestion) => entryQuestion.id === question.id)
    );
    files.push({
      path: `bundles/questions/${question.id}.md`,
      contents: bundleMarkdown({
        title: "Question Context Bundle",
        generatedAtIso,
        scope: `question:${question.id}`,
        entries: questionEntries,
        questions: [question],
        localOnly: true
      })
    });
  }

  files.push({
    path: "entries/index.json",
    contents: JSON.stringify(
      entries.map((entry) => ({
        id: entry.id,
        path: `entries/${entry.id}.md`,
        type: entry.type,
        status: entry.status,
        title: entry.title,
        privacyLevel: entry.privacyLevel,
        capturedAt: entry.capturedAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
      })),
      null,
      2
    )
  });

  for (const entry of entries) {
    files.push({ path: `entries/${entry.id}.md`, contents: entryMarkdown(entry) });
    files.push({ path: `entries/${entry.id}.json`, contents: entryJson(entry) });
  }

  const seenPaths = new Set<string>();
  for (const file of files) {
    if (seenPaths.has(file.path)) {
      throw new Error(`Duplicate mirror file path: ${file.path}`);
    }
    seenPaths.add(file.path);
  }

  manifest.files = files.map((file) => file.path).sort();
  files.unshift({
    path: "manifest.json",
    contents: JSON.stringify(manifest, null, 2)
  });

  return {
    generatedAt: generatedAtIso,
    files
  };
}

function privacyFloorRank(level: PrivacyLevel): number {
  return privacyLevels.indexOf(level);
}

function atOrAbovePrivacyFloor<T extends { privacyLevel: PrivacyLevel }>(records: T[], floor: PrivacyLevel): T[] {
  const floorRank = privacyFloorRank(floor);
  return records.filter((record) => privacyFloorRank(record.privacyLevel) >= floorRank);
}

function inDateRange(date: Date, selection: BundleSelection): boolean {
  if (selection.occurredFrom && date.getTime() < selection.occurredFrom.getTime()) return false;
  if (selection.occurredTo && date.getTime() > selection.occurredTo.getTime()) return false;
  return true;
}

function matchesThemeSlugs(themes: { slug: string }[], themeSlugs: string[]): boolean {
  return !themeSlugs.length || themes.some((theme) => themeSlugs.includes(theme.slug));
}

function matchesIds(id: string, ids: string[]): boolean {
  return !ids.length || ids.includes(id);
}

// Conversation sources carry their original conversation date in metadata; every
// other source type is dated by its own (import) createdAt.
function sourceDate(source: SourceRecord): Date {
  if (source.metadata.type === "conversation") {
    const parsed = new Date(source.metadata.createdAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return source.createdAt;
}

// Pure AND-combined filter over the already privacy-floored entries/sources:
// recordTypes, sourceTypes, themeSlugs, date range, and explicit ids all narrow the result together.
export function applyBundleSelection(
  entries: EntryRecord[],
  sources: SourceRecord[],
  selection?: BundleSelection
): { entries: EntryRecord[]; sources: SourceRecord[] } {
  if (!selection) {
    return { entries, sources };
  }

  const includeEntries = selection.recordTypes.includes("entry");
  const includeSources = selection.recordTypes.includes("source");

  const filteredEntries = includeEntries
    ? entries.filter(
        (entry) =>
          matchesThemeSlugs(entry.themes, selection.themeSlugs) &&
          inDateRange(entry.occurredAt ?? entry.capturedAt, selection) &&
          matchesIds(entry.id, selection.ids)
      )
    : [];

  const filteredSources = includeSources
    ? sources.filter(
        (source) =>
          selection.sourceTypes.includes(source.type) &&
          matchesThemeSlugs(source.themes, selection.themeSlugs) &&
          inDateRange(sourceDate(source), selection) &&
          matchesIds(source.id, selection.ids)
      )
    : [];

  return { entries: filteredEntries, sources: filteredSources };
}

// Stable key ordering so the same logical content always hashes identically.
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${canonicalJson(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export class ShareableBundleSecretLeakError extends Error {
  constructor(entryId: string, keys: string[]) {
    super(`Entry ${entryId} has forbidden credential/secret metadata keys for a shareable bundle: ${keys.join(", ")}`);
    this.name = "ShareableBundleSecretLeakError";
  }
}

function assertNoShareableSecretLeak(entries: EntryRecord[], sources: SourceRecord[], privacyFloor: PrivacyLevel): void {
  if (privacyFloor !== "shareable") {
    return;
  }

  for (const entry of entries) {
    const forbiddenKeys = findForbiddenMetadataKeys(entry.metadata);
    if (forbiddenKeys.length > 0) {
      throw new ShareableBundleSecretLeakError(entry.id, forbiddenKeys);
    }
  }

  for (const source of sources) {
    const forbiddenKeys = findForbiddenMetadataKeys(source.metadata as unknown as Record<string, unknown>);
    if (forbiddenKeys.length > 0) {
      throw new ShareableBundleSecretLeakError(source.id, forbiddenKeys);
    }
  }
}

export interface GenerateBundleOptions {
  scope: string;
  purpose: string;
  privacyFloor: PrivacyLevel;
  selection?: BundleSelection;
  generatedAt?: Date;
}

export interface GeneratedBundle {
  manifest: BundleManifest;
  contents: string;
}

// Deterministic traversal (sorted entries/sources) + canonical JSON + SHA-256 content hash,
// so the same logical snapshot always produces an identical, verifiable bundle.
export function generateBundle(snapshot: ContextMirrorSnapshot, options: GenerateBundleOptions): GeneratedBundle {
  const generatedAtIso = (options.generatedAt ?? new Date()).toISOString();

  const entriesAtFloor = atOrAbovePrivacyFloor(sortedEntries(snapshot.entries), options.privacyFloor);
  const sourcesAtFloor = atOrAbovePrivacyFloor(
    [...snapshot.sources].sort((a, b) => a.title.localeCompare(b.title)),
    options.privacyFloor
  );

  const { entries, sources } = applyBundleSelection(entriesAtFloor, sourcesAtFloor, options.selection);

  assertNoShareableSecretLeak(entries, sources, options.privacyFloor);

  const body = bundleMarkdown({
    title: `${options.scope} Context Bundle`,
    generatedAtIso,
    scope: options.scope,
    entries,
    sources,
    questions: snapshot.openQuestions,
    localOnly: options.privacyFloor !== "shareable"
  });

  const contentHash = sha256Hex(
    canonicalJson({ scope: options.scope, entries: entries.map((e) => e.id), sources: sources.map((s) => s.id), body })
  );

  const manifest: BundleManifest = {
    scope: options.scope,
    purpose: options.purpose,
    privacyFloor: options.privacyFloor,
    generatedAt: generatedAtIso,
    contentHash,
    fileCount: 1
  };

  return { manifest, contents: body };
}
