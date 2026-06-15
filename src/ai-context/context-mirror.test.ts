import { describe, expect, it } from "vitest";

import { buildContextMirror } from "./context-mirror";

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
