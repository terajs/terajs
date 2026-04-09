import { describe, it, expect } from "vitest";
import { updateHead } from "./clientMeta";

describe("updateHead", () => {
  it("updates document head when route changes", () => {
    document.head.innerHTML = "";
    document.title = "Old Title";

    const meta = { title: "New Page" };
    const ai = { intent: "purchase" };

    updateHead(meta, ai);

    expect(document.title).toBe("New Page");

    const aiHint = document.querySelector('meta[name="terajs-ai-hint"]');
    expect(aiHint).toBeInstanceOf(HTMLMetaElement);
    expect(aiHint?.getAttribute("content")).toContain("purchase");
  });
});
