import { describe, expect, it } from "vitest";

import type { SourceRecord } from "@/repositories/context-repository";

import { applyBundleSelection, buildContextMirror, generateBundle, ShareableBundleSecretLeakError } from "./context-mirror";

describe("context mirror", () => {
  it("builds deterministic core files with source ids", () => {
    const generatedAt = new Date("2026-04-29T10:00:00.000Z");
    const build = buildContextMirror(
      {
        entries: [
          {
            id: "entry_1",
            type: "observation",
            status: "active",
            title: "Architecture direction",
            body: "Keep PostgreSQL canonical.",
            privacyLevel: "private",
            capturedAt: generatedAt,
            createdAt: generatedAt,
            updatedAt: generatedAt,
            metadata: {},
            themes: [],
            projects: [],
            questions: [],
            threads: [],
            references: [],
            attachments: [],
            sources: [],
            excerpts: []
          }
        ],
        openQuestions: [],
        themes: [],
        projects: [],
        threads: [],
        sources: []
      },
      generatedAt
    );

    expect(build.files.map((file) => file.path)).toContain("manifest.json");
    expect(build.files.map((file) => file.path)).toContain("entries/entry_1.md");
    expect(build.files.find((file) => file.path === "entries/entry_1.md")?.contents).toContain("entry_1");
  });
});

describe("generateBundle", () => {
  const generatedAt = new Date("2026-04-29T10:00:00.000Z");
  const baseEntry = {
    id: "entry_1",
    type: "observation" as const,
    status: "active" as const,
    title: "Architecture direction",
    body: "Keep PostgreSQL canonical.",
    capturedAt: generatedAt,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    metadata: {},
    themes: [],
    projects: [],
    questions: [],
    threads: [],
    references: [],
    attachments: [],
    sources: [],
    excerpts: []
  };

  function snapshotWith(privacyLevel: "private" | "sensitive" | "shareable", metadata: Record<string, string> = {}) {
    return {
      entries: [{ ...baseEntry, privacyLevel, metadata }],
      openQuestions: [],
      themes: [],
      projects: [],
      threads: [],
      sources: []
    };
  }

  it("is deterministic: same snapshot produces the same contentHash", () => {
    const snapshot = snapshotWith("shareable");
    const a = generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "shareable", generatedAt });
    const b = generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "shareable", generatedAt });

    expect(a.manifest.contentHash).toBe(b.manifest.contentHash);
    expect(a.manifest.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("excludes entries below the privacy floor", () => {
    const snapshot = snapshotWith("private");
    const bundle = generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "shareable", generatedAt });

    expect(bundle.contents).not.toContain("entry_1");
  });

  it("throws when a shareable-floor bundle would leak credential/secret metadata", () => {
    const snapshot = snapshotWith("shareable", { apiCredential: "leak-me" });

    expect(() =>
      generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "shareable", generatedAt })
    ).toThrow(ShareableBundleSecretLeakError);
  });

  it("does not enforce the secret check for non-shareable floors", () => {
    const snapshot = snapshotWith("sensitive", { apiCredential: "ok-here" });

    expect(() =>
      generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "sensitive", generatedAt })
    ).not.toThrow();
  });

  function baseSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
    return {
      id: "source_1",
      type: "post",
      title: "A raw source",
      status: "active",
      privacyLevel: "private",
      metadata: { type: "post" },
      themes: [],
      references: [],
      entries: [],
      messages: [],
      excerpts: [],
      createdAt: generatedAt,
      updatedAt: generatedAt,
      ...overrides
    };
  }

  it("excludes sources below the privacy floor", () => {
    const snapshot = { ...snapshotWith("shareable"), sources: [baseSource({ privacyLevel: "private" })] };
    const bundle = generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "shareable", generatedAt });

    expect(bundle.contents).not.toContain("source_1");
  });

  it("throws when a shareable-floor bundle would leak credential/secret metadata via a source", () => {
    const snapshot = {
      ...snapshotWith("shareable"),
      sources: [baseSource({ privacyLevel: "shareable", metadata: { type: "post", secretKey: "leak-me" } as never })]
    };

    expect(() =>
      generateBundle(snapshot, { scope: "test", purpose: "verify", privacyFloor: "shareable", generatedAt })
    ).toThrow(ShareableBundleSecretLeakError);
  });
});

describe("applyBundleSelection", () => {
  const generatedAt = new Date("2026-04-29T10:00:00.000Z");
  const baseEntry = {
    id: "entry_1",
    type: "observation" as const,
    status: "active" as const,
    title: "Entry",
    body: "Body",
    privacyLevel: "shareable" as const,
    capturedAt: generatedAt,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    metadata: {},
    themes: [{ id: "t1", slug: "theme-a", name: "Theme A" }],
    projects: [],
    questions: [],
    threads: [],
    references: [],
    attachments: [],
    sources: [],
    excerpts: []
  };

  const baseSource: SourceRecord = {
    id: "source_1",
    type: "video",
    title: "Video",
    status: "active",
    privacyLevel: "shareable",
    metadata: { type: "video" },
    themes: [{ id: "t1", slug: "theme-a", name: "Theme A" }],
    references: [],
    entries: [],
    messages: [],
    excerpts: [],
    createdAt: generatedAt,
    updatedAt: generatedAt
  };

  it("combines recordTypes, sourceTypes, themeSlugs, date range and ids as AND filters", () => {
    const entries = [
      { ...baseEntry, id: "entry_1", themes: [{ id: "t1", slug: "theme-a", name: "Theme A" }] },
      { ...baseEntry, id: "entry_2", themes: [{ id: "t2", slug: "theme-b", name: "Theme B" }] }
    ];
    const sources = [
      { ...baseSource, id: "source_1", type: "video" as const },
      {
        ...baseSource,
        id: "source_2",
        type: "conversation" as const,
        metadata: {
          type: "conversation" as const,
          provider: "chatgpt" as const,
          conversationId: "c1",
          models: [],
          createdAt: generatedAt.toISOString(),
          updatedAt: generatedAt.toISOString(),
          messageCount: 0,
          charCount: 0,
          isArchived: false,
          isStarred: false,
          isStudyMode: false
        }
      }
    ];

    const result = applyBundleSelection(entries, sources, {
      privacyFloor: "shareable",
      recordTypes: ["entry", "source"],
      sourceTypes: ["video"],
      themeSlugs: ["theme-a"],
      ids: ["entry_1", "source_1"]
    });

    expect(result.entries.map((e) => e.id)).toEqual(["entry_1"]);
    expect(result.sources.map((s) => s.id)).toEqual(["source_1"]);
  });

  it("excludes conversation sources by default when no selection is given", () => {
    const result = applyBundleSelection([baseEntry], [baseSource], undefined);

    expect(result.entries).toHaveLength(1);
    expect(result.sources).toHaveLength(1);
  });

  it("excludes a record type entirely when recordTypes omits it", () => {
    const result = applyBundleSelection([baseEntry], [baseSource], {
      privacyFloor: "private",
      recordTypes: ["entry"],
      sourceTypes: ["video"],
      themeSlugs: [],
      ids: []
    });

    expect(result.entries).toHaveLength(1);
    expect(result.sources).toHaveLength(0);
  });
});
