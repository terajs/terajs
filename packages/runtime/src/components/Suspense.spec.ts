import { describe, it, expect } from "vitest";
import { Suspense } from "./Suspense";

describe("Suspense primitive", () => {
  it("returns the children content by default", () => {
    const output = Suspense({ children: "content" });
    expect(output).toBe("content");
  });

  it("accepts a fallback prop without rendering it directly", () => {
    const output = Suspense({ children: "content", fallback: "loading" });
    expect(output).toBe("content");
  });
});
