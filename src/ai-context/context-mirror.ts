import type {
  ContextMirrorSnapshot,
  EntryRecord,
  NamedRecord,
  QuestionRecord
} from "@/repositories/context-repository";

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

function excerpt(entry: EntryRecord): string {
  return (entry.summary || entry.body).replace(/\s+/g, " ").trim().slice(0, 220);
}

function metadataBlock(entry: EntryRecord): string {
  const themes = entry.themes.map((theme) => theme.name).join(", ") || "none";
  const projects = entry.projects.map((project) => project.name).join(", ") || "none";

  return [
    `- id: ${entry.id}`,
    `- type: ${entry.type}`,
    `- status: ${entry.status}`,
    `- privacy: ${entry.privacyLevel}`,
    `- captured: ${entry.capturedAt.toISOString()}`,
    `- occurred: ${entry.occurredAt ? entry.occurredAt.toISOString() : "unknown"}`,
    `- themes: ${themes}`,
    `- projects: ${projects}`
  ].join("\n");
}

function entryMarkdown(entry: EntryRecord): string {
  return [
    `# ${entry.title}`,
    "",
    metadataBlock(entry),
    "",
    "## Summary",
    "",
    entry.summary || excerpt(entry) || "No summary.",
    "",
    "## Body",
    "",
    entry.body,
    ""
  ].join("\n");
}

function namedList(title: string, records: NamedRecord[]): string {
  const lines = records.length
    ? records.map((record) => `- ${record.name} (${record.slug})${record.count !== undefined ? ` - ${record.count} entries` : ""}`)
    : ["- None"];

  return [`## ${title}`, "", ...lines].join("\n");
}

function questionList(questions: QuestionRecord[]): string {
  if (!questions.length) {
    return "- None";
  }

  return questions.map((question) => `- [${question.status}] ${question.prompt} (${question.id})`).join("\n");
}

function recentList(entries: EntryRecord[]): string {
  if (!entries.length) {
    return "- None";
  }

  return entries
    .slice(0, 30)
    .map(
      (entry) =>
        `- ${formatDate(entry.occurredAt ?? entry.capturedAt)} [${entry.type}/${entry.status}] ${entry.title} (${entry.id})`
    )
    .join("\n");
}

function entryJson(entry: EntryRecord): string {
  return JSON.stringify(
    {
      id: entry.id,
      type: entry.type,
      status: entry.status,
      title: entry.title,
      summary: entry.summary,
      body: entry.body,
      source: entry.source,
      confidence: entry.confidence,
      privacyLevel: entry.privacyLevel,
      occurredAt: entry.occurredAt?.toISOString(),
      capturedAt: entry.capturedAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      metadata: entry.metadata,
      themes: entry.themes,
      projects: entry.projects,
      questions: entry.questions
    },
    null,
    2
  );
}

export function buildContextMirror(snapshot: ContextMirrorSnapshot, generatedAt = new Date()): ContextMirrorBuild {
  const generatedAtIso = generatedAt.toISOString();
  const files: ContextMirrorFile[] = [];

  const manifest = {
    generatedAt: generatedAtIso,
    counts: {
      entries: snapshot.entries.length,
      openQuestions: snapshot.openQuestions.length,
      themes: snapshot.themes.length,
      projects: snapshot.projects.length
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
      `- entries: ${snapshot.entries.length}`,
      `- open questions: ${snapshot.openQuestions.length}`,
      `- themes: ${snapshot.themes.length}`,
      `- projects: ${snapshot.projects.length}`,
      "",
      "## Recent Entries",
      "",
      recentList(snapshot.entries),
      "",
      "## Open Questions",
      "",
      questionList(snapshot.openQuestions),
      ""
    ].join("\n")
  });

  files.push({
    path: "recent.md",
    contents: ["# Recent Entries", "", `Generated: ${generatedAtIso}`, "", recentList(snapshot.entries), ""].join("\n")
  });

  files.push({
    path: "open-questions.md",
    contents: ["# Open Questions", "", `Generated: ${generatedAtIso}`, "", questionList(snapshot.openQuestions), ""].join("\n")
  });

  files.push({
    path: "themes/index.md",
    contents: ["# Themes", "", `Generated: ${generatedAtIso}`, "", namedList("Themes", snapshot.themes), ""].join("\n")
  });

  files.push({
    path: "projects/index.md",
    contents: ["# Projects", "", `Generated: ${generatedAtIso}`, "", namedList("Projects", snapshot.projects), ""].join("\n")
  });

  files.push({
    path: "entries/index.json",
    contents: JSON.stringify(
      snapshot.entries.map((entry) => ({
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

  for (const entry of snapshot.entries) {
    files.push({ path: `entries/${entry.id}.md`, contents: entryMarkdown(entry) });
    files.push({ path: `entries/${entry.id}.json`, contents: entryJson(entry) });
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
