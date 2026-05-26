import { describe, expect, it } from "vitest";

import { createEntryCommandSchema, parseNameList, slugifyName } from "./context";

describe("context domain validation", () => {
  it("normalizes slugs for named objects", () => {
    expect(slugifyName(" Personal Context System! ")).toBe("personal-context-system");
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
});
