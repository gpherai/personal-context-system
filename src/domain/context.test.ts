import { describe, expect, it } from "vitest";

import {
  createEntryCommandSchema,
  createReferenceCommandSchema,
  createSourceCommandSchema,
  parseNameList,
  parseOptionalDate,
  slugifyName,
  updateEntryCommandSchema
} from "./context";

describe("context domain validation", () => {
  it("normalizes slugs for named objects", () => {
    expect(slugifyName(" Personal Context System! ")).toBe("personal-context-system");
  });

  it("strips trailing hyphen after 120-char slice", () => {
    const input = "x".repeat(119) + " " + "y".repeat(10);
    const slug = slugifyName(input);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(120);
  });

  it("parses comma separated names", () => {
    expect(parseNameList("AI, Architecture, , Daily use, ai")).toEqual(["AI", "Architecture", "Daily use"]);
  });

  it("requires a title and body for captured entries", () => {
    const result = createEntryCommandSchema.safeParse({
      type: "observation",
      title: "",
      body: "",
      privacyLevel: "private"
    });

    expect(result.success).toBe(false);
  });

  describe("updateEntryCommandSchema", () => {
    it("strips type field — entry type is immutable", () => {
      const result = updateEntryCommandSchema.safeParse({
        id: "abc",
        type: "insight",
        status: "active",
        title: "Title",
        body: "Body",
        privacyLevel: "private"
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // type should not be present on UpdateEntryCommand
        expect("type" in result.data).toBe(false);
      }
    });
  });

  describe("parseOptionalDate", () => {
    it("parses valid YYYY-MM-DD", () => {
      const date = parseOptionalDate("2026-03-15");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getUTCFullYear()).toBe(2026);
      expect(date?.getUTCMonth()).toBe(2);
      expect(date?.getUTCDate()).toBe(15);
    });

    it("rejects calendar overflow (2026-02-31 → would roll to March)", () => {
      expect(parseOptionalDate("2026-02-31")).toBeUndefined();
    });

    it("rejects invalid format", () => {
      expect(parseOptionalDate("not-a-date")).toBeUndefined();
    });

    it("returns undefined for empty input", () => {
      expect(parseOptionalDate(null)).toBeUndefined();
      expect(parseOptionalDate("")).toBeUndefined();
    });
  });

  describe("createSourceCommandSchema", () => {
    const validVideoSource = {
      type: "video" as const,
      title: "Test Video",
      metadata: { type: "video" as const, url: "https://example.com" }
    };

    it("accepts matching root type and metadata type", () => {
      expect(createSourceCommandSchema.safeParse(validVideoSource).success).toBe(true);
    });

    it("rejects mismatched root type and metadata type", () => {
      const result = createSourceCommandSchema.safeParse({
        type: "video",
        title: "Test",
        metadata: { type: "book", authors: [] }
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createReferenceCommandSchema", () => {
    it("accepts valid URL when kind is url", () => {
      const result = createReferenceCommandSchema.safeParse({
        entryId: "abc",
        kind: "url",
        title: "Link",
        url: "https://example.com"
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL when kind is url", () => {
      const result = createReferenceCommandSchema.safeParse({
        entryId: "abc",
        kind: "url",
        title: "Link",
        url: "not-a-url"
      });
      expect(result.success).toBe(false);
    });

    it("accepts non-url string when kind is not url", () => {
      const result = createReferenceCommandSchema.safeParse({
        entryId: "abc",
        kind: "book",
        title: "A Book",
        url: "ISBN: 978-0-00-000000-0"
      });
      expect(result.success).toBe(true);
    });
  });

});
