import { describe, it, expect } from "vitest";
import { parseSFC } from "@nebula/sfc/index.js";

describe("meta block extraction", () => {
  it("returns empty object for empty meta block", () => {
    const sfc = parseSFC("<meta></meta>", "/pages/x.nbl");
    expect(sfc.meta).toEqual({});
  });

  it("parses simple meta keys", () => {
    const sfc = parseSFC("<meta>title: Hello</meta>", "/pages/x.nbl");
    expect(sfc.meta.title).toBe("Hello");
  });
});
