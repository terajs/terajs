import { afterEach, describe, expect, it } from "vitest";
import { updateHead } from "./clientMeta.js";

describe("updateHead", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  it("updates document head when route changes", () => {
    document.head.innerHTML = "";
    document.title = "Old Title";

    const meta = { title: "New Page", canonical: "auto" };
    const ai = { intent: "purchase" };

    window.history.replaceState({}, "", "/docs/");
    updateHead(meta, ai);

    expect(document.title).toBe("New Page");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://localhost:3000/docs");

    const aiHint = document.querySelector('meta[name="terajs-ai-hint"]');
    expect(aiHint).toBeInstanceOf(HTMLMetaElement);
    expect(aiHint?.getAttribute("content")).toContain("purchase");
  });

  it("ignores invalid placeholder meta strings", () => {
    document.head.innerHTML = "";
    document.title = "Baseline";

    const meta = {
      title: "undefined",
      description: "null",
      keywords: ["", "undefined", "terajs"]
    };

    updateHead(meta, undefined);

    expect(document.title).toBe("Baseline");
    expect(document.querySelector('meta[name="description"]')).toBeNull();
    expect(document.querySelector('meta[name="keywords"]')?.getAttribute("content")).toBe("terajs");
  });

  it("removes stale AI hints when later routes omit AI metadata", () => {
    updateHead({ title: "AI page", canonical: "https://terajs.com/ai" }, { intent: "purchase" });
    expect(document.querySelector('meta[name="terajs-ai-hint"]')).not.toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://terajs.com/ai");

    updateHead({ title: "Plain page" }, undefined);

    expect(document.title).toBe("Plain page");
    expect(document.querySelector('meta[name="terajs-ai-hint"]')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("resolves relative canonical URLs against the current origin", () => {
    updateHead({ title: "Docs", canonical: "/docs/meta-tags" }, undefined);

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://localhost:3000/docs/meta-tags");
  });

  it("prefers the active route pathname when auto canonical is requested", () => {
    window.history.replaceState({}, "", "/");

    updateHead({ title: "Docs", canonical: "auto" }, undefined, "/docs");

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://localhost:3000/docs");
  });
});