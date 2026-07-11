import { describe, expect, it, vi } from "vitest";

import type {
  DecisionRepository,
  EntryRepository,
  QuestionRepository,
  TaxonomyRepository,
  ThreadRepository
} from "@/repositories/context-repository";

import {
  captureEntry,
  mergeThemesFromForm,
  moveEntryInThread,
  updateDecisionStatusFromForm,
  updateQuestionFromForm,
  validateQuestionClosing
} from "./context-service";

function fd(entries: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

describe("validateQuestionClosing", () => {
  it("blocks closing a question with no decisions", async () => {
    const repo = { listDecisionsForQuestion: vi.fn().mockResolvedValue([]) } as unknown as DecisionRepository;
    const error = await validateQuestionClosing("q1", "answered", repo);
    expect(error).toMatch(/cannot be closed/i);
  });

  it("allows closing when a decision exists", async () => {
    const repo = {
      listDecisionsForQuestion: vi.fn().mockResolvedValue([{ id: "d1" }])
    } as unknown as DecisionRepository;
    expect(await validateQuestionClosing("q1", "answered", repo)).toBeNull();
  });

  it("does not query for non-closing statuses", async () => {
    const listDecisionsForQuestion = vi.fn();
    const repo = { listDecisionsForQuestion } as unknown as DecisionRepository;
    expect(await validateQuestionClosing("q1", "open", repo)).toBeNull();
    expect(listDecisionsForQuestion).not.toHaveBeenCalled();
  });
});

describe("updateQuestionFromForm", () => {
  it("refuses to close a question without a decision", async () => {
    const repo = {
      listDecisionsForQuestion: vi.fn().mockResolvedValue([]),
      updateQuestion: vi.fn()
    } as unknown as QuestionRepository & DecisionRepository;

    const result = await updateQuestionFromForm("q1", fd({ status: "answered", privacyLevel: "private" }), repo);

    expect(result.ok).toBe(false);
    expect(repo.updateQuestion).not.toHaveBeenCalled();
  });

  it("updates when the transition is allowed", async () => {
    const repo = {
      listDecisionsForQuestion: vi.fn().mockResolvedValue([{ id: "d1" }]),
      updateQuestion: vi.fn().mockResolvedValue({ id: "q1", status: "answered" })
    } as unknown as QuestionRepository & DecisionRepository;

    const result = await updateQuestionFromForm("q1", fd({ status: "answered", privacyLevel: "private" }), repo);

    expect(result.ok).toBe(true);
    expect(repo.updateQuestion).toHaveBeenCalledOnce();
  });
});

describe("updateDecisionStatusFromForm", () => {
  it("rejects an invalid status transition", async () => {
    const updateDecisionStatus = vi.fn();
    const repo = { updateDecisionStatus } as unknown as DecisionRepository;

    const result = await updateDecisionStatusFromForm("d1", "proposed", fd({ status: "closed" }), repo);

    expect(result.ok).toBe(false);
    expect(updateDecisionStatus).not.toHaveBeenCalled();
  });

  it("accepts a valid transition", async () => {
    const repo = {
      updateDecisionStatus: vi.fn().mockResolvedValue({ id: "d1", status: "accepted" })
    } as unknown as DecisionRepository;

    const result = await updateDecisionStatusFromForm("d1", "proposed", fd({ status: "accepted" }), repo);

    expect(result.ok).toBe(true);
    expect(repo.updateDecisionStatus).toHaveBeenCalledOnce();
  });
});

describe("captureEntry", () => {
  it("returns field errors when the body is empty", async () => {
    const createEntry = vi.fn();
    const repo = { createEntry } as unknown as EntryRepository;

    const result = await captureEntry(fd({ body: "" }), repo);

    expect(result.ok).toBe(false);
    if (!result.ok && "fieldErrors" in result.state) {
      expect(result.state.fieldErrors?.body).toBeTruthy();
    }
    expect(createEntry).not.toHaveBeenCalled();
  });

  it("creates an entry for valid input", async () => {
    const repo = {
      createEntry: vi.fn().mockResolvedValue({ id: "e1", title: "Hello" }),
      createReference: vi.fn()
    } as unknown as EntryRepository;

    const result = await captureEntry(fd({ body: "Hello world" }), repo);

    expect(result.ok).toBe(true);
    expect(repo.createEntry).toHaveBeenCalledOnce();
  });
});

describe("moveEntryInThread", () => {
  it("rejects an invalid direction", async () => {
    const moveFn = vi.fn();
    const repo = { moveEntryInThread: moveFn } as unknown as ThreadRepository;

    const result = await moveEntryInThread("t1", "e1", "sideways", repo);

    expect(result.ok).toBe(false);
    expect(moveFn).not.toHaveBeenCalled();
  });

  it("moves for a valid direction", async () => {
    const repo = { moveEntryInThread: vi.fn().mockResolvedValue(undefined) } as unknown as ThreadRepository;
    const result = await moveEntryInThread("t1", "e1", "up", repo);
    expect(result.ok).toBe(true);
    expect(repo.moveEntryInThread).toHaveBeenCalledOnce();
  });
});

describe("mergeThemesFromForm", () => {
  it("rejects merging a theme into itself", async () => {
    const mergeThemes = vi.fn();
    const repo = { mergeThemes } as unknown as TaxonomyRepository;

    const result = await mergeThemesFromForm("same-id", fd({ targetThemeId: "same-id" }), repo);

    expect(result.ok).toBe(false);
    expect(mergeThemes).not.toHaveBeenCalled();
  });

  it("merges into a different target", async () => {
    const repo = {
      mergeThemes: vi.fn().mockResolvedValue({ id: "target", slug: "target", name: "Target" })
    } as unknown as TaxonomyRepository;

    const result = await mergeThemesFromForm("source", fd({ targetThemeId: "target" }), repo);

    expect(result.ok).toBe(true);
    expect(repo.mergeThemes).toHaveBeenCalledOnce();
  });
});
