import type {
  ContextMirrorSnapshot,
  EntryRecord,
  NamedRecord,
  QuestionRecord,
  ThreadRecord
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

function slugSectionEntries(entries: EntryRecord[], kind: "project" | "theme", slug: string): EntryRecord[] {
  return entries.filter((entry) =>
    kind === "project"
      ? entry.projects.some((project) => project.slug === slug)
      : entry.themes.some((theme) => theme.slug === slug)
  );
}

function namedList(title: string, records: NamedRecord[]): string {
  const lines = records.length
    ? records.map((record) => `- ${record.name} (${record.slug})${record.count !== undefined ? ` - ${record.count} entries` : ""}`)
    : ["- None"];

  return [`## ${title}`, "", ...lines].join("\n");
}

function threadList(threads: Omit<ThreadRecord, "entries">[]): string {
  if (!threads.length) {
    return "- None";
  }

  return threads.map((thread) => `- [${thread.status}] ${thread.title} (${thread.slug})`).join("\n");
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
      projects: snapshot.projects.length,
      threads: snapshot.threads.length
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
      `- question queue: ${snapshot.openQuestions.length}`,
      `- themes: ${snapshot.themes.length}`,
      `- projects: ${snapshot.projects.length}`,
      `- threads: ${snapshot.threads.length}`,
      "",
      "## Recent Entries",
      "",
      recentList(snapshot.entries),
      "",
      "## Question Queue",
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
    path: "today.md",
    contents: [
      "# Today",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      "## Recent Entries",
      "",
      recentList(snapshot.entries.slice(0, 12)),
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
      `- entries: ${snapshot.entries.length}`,
      `- question queue: ${snapshot.openQuestions.length}`,
      `- themes: ${snapshot.themes.length}`,
      `- projects: ${snapshot.projects.length}`,
      `- threads: ${snapshot.threads.length}`,
      "",
      "## Question Queue",
      "",
      questionList(snapshot.openQuestions.slice(0, 12)),
      "",
      "## Recent Entries",
      "",
      recentList(snapshot.entries.slice(0, 12)),
      ""
    ].join("\n")
  });

  files.push({
    path: "themes/index.md",
    contents: ["# Themes", "", `Generated: ${generatedAtIso}`, "", namedList("Themes", snapshot.themes), ""].join("\n")
  });

  for (const theme of snapshot.themes) {
    const entries = slugSectionEntries(snapshot.entries, "theme", theme.slug);
    files.push({
      path: `themes/${theme.slug}.md`,
      contents: [
        `# ${theme.name}`,
        "",
        `Generated: ${generatedAtIso}`,
        "",
        theme.description ?? "",
        "",
        "## Entries",
        "",
        recentList(entries),
        ""
      ].join("\n")
    });
  }

  files.push({
    path: "projects/index.md",
    contents: ["# Projects", "", `Generated: ${generatedAtIso}`, "", namedList("Projects", snapshot.projects), ""].join("\n")
  });

  for (const project of snapshot.projects) {
    const entries = slugSectionEntries(snapshot.entries, "project", project.slug);
    files.push({
      path: `projects/${project.slug}.md`,
      contents: [
        `# ${project.name}`,
        "",
        `Generated: ${generatedAtIso}`,
        "",
        project.description ?? "",
        "",
        "## Entries",
        "",
        recentList(entries),
        ""
      ].join("\n")
    });
  }

  files.push({
    path: "threads/index.md",
    contents: ["# Threads", "", `Generated: ${generatedAtIso}`, "", threadList(snapshot.threads), ""].join("\n")
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
