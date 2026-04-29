import { describe, expect, it } from "vitest";

import { createEntryCommandSchema, parseNameList, slugifyName } from "./context";

describe("context domain validation", () => {
  it("normalizes slugs for named objects", () => {
    expect(slugifyName(" Personal Context System! ")).toBe("personal-context-system");
  });

  it("parses comma separated names", () => {
    const form = new FormData();
    form.set("themes", "AI, Architecture, , Daily use, ai");

    expect(parseNameList(form.get("themes"))).toEqual(["AI", "Architecture", "Daily use"]);
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
