import { describe, expect, it } from "vitest";

import { buildContextMirror, generateBundle, ShareableBundleSecretLeakError } from "./context-mirror";

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
            sources: []
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
    sources: []
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
});
