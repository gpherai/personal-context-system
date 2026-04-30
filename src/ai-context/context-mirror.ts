import { slugifyName } from "@/domain/context";
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

function threadMarkdown(thread: ThreadRecord, generatedAtIso: string): string {
  return [
    `# ${thread.title}`,
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
    thread.description || "No description.",
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

function entryList(entries: EntryRecord[]): string {
  if (!entries.length) {
    return "- None";
  }

  return entries
    .map(
      (entry) =>
        `- ${formatDate(entry.occurredAt ?? entry.capturedAt)} [${entry.type}/${entry.status}/${entry.privacyLevel}] ${entry.title} (${entry.id})\n  - ${excerpt(entry)}`
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
        `## ${formatDate(timelineDate)} - ${entry.title}`,
        "",
        `- id: ${entry.id}`,
        `- type: ${entry.type}`,
        `- status: ${entry.status}`,
        `- privacy: ${entry.privacyLevel}`,
        `- captured: ${entry.capturedAt.toISOString()}`,
        `- occurred: ${entry.occurredAt ? entry.occurredAt.toISOString() : "unknown"}`,
        "",
        excerpt(entry),
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
  questions = []
}: {
  title: string;
  generatedAtIso: string;
  scope: string;
  entries: EntryRecord[];
  questions?: QuestionRecord[];
}): string {
  return [
    `# ${title}`,
    "",
    `Generated: ${generatedAtIso}`,
    `Scope: ${scope}`,
    "Source of truth: PostgreSQL.",
    "",
    "## Counts",
    "",
    `- entries: ${entries.length}`,
    `- questions: ${questions.length}`,
    "",
    "## Questions",
    "",
    questionList(questions),
    "",
    "## Entries",
    "",
    entryList(entries),
    ""
  ].join("\n");
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

  const shareableEntries = snapshot.entries.filter((entry) => entry.privacyLevel === "shareable");

  files.push({
    path: "bundles/local-full.md",
    contents: bundleMarkdown({
      title: "Local Full Context Bundle",
      generatedAtIso,
      scope: "local-full",
      entries: snapshot.entries,
      questions: snapshot.openQuestions
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
        entryList(entries),
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
    const projectQuestions = snapshot.openQuestions.filter((question) =>
      entries.some((entry) => entry.questions.some((entryQuestion) => entryQuestion.id === question.id))
    );

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
        entryList(entries),
        ""
      ].join("\n")
    });

    files.push({
      path: `bundles/projects/${project.slug}.md`,
      contents: bundleMarkdown({
        title: `${project.name} Project Context Bundle`,
        generatedAtIso,
        scope: `project:${project.slug}`,
        entries,
        questions: projectQuestions
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

  const timelineEntries = [...snapshot.entries].sort(
    (a, b) => (b.occurredAt ?? b.capturedAt).getTime() - (a.occurredAt ?? a.capturedAt).getTime()
  );

  files.push({
    path: "timeline/entries.md",
    contents: [
      "# Entry Timeline",
      "",
      `Generated: ${generatedAtIso}`,
      "",
      timelineList(timelineEntries),
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
      timelineList(timelineEntries.filter((entry) => entry.privacyLevel === "shareable")),
      ""
    ].join("\n")
  });

  for (const question of snapshot.openQuestions) {
    const entries = snapshot.entries.filter((entry) =>
      entry.questions.some((entryQuestion) => entryQuestion.id === question.id)
    );
    const questionSlug = `${slugifyName(question.prompt).slice(0, 48)}-${question.id.slice(0, 8)}`;

    files.push({
      path: `bundles/questions/${questionSlug}.md`,
      contents: bundleMarkdown({
        title: "Question Context Bundle",
        generatedAtIso,
        scope: `question:${question.id}`,
        entries,
        questions: [question]
      })
    });
  }

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
