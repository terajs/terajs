import { afterEach, describe, expect, it } from "vitest";
import { analyzeSafeDocumentContext, captureSafeDocumentContext } from "./documentContext.js";

describe("safe document context", () => {
  const originalTitle = document.title;
  const originalLang = document.documentElement.lang;
  const originalDir = document.documentElement.dir;

  afterEach(() => {
    document.title = originalTitle;
    document.documentElement.lang = originalLang;
    document.documentElement.dir = originalDir;
    document.head.querySelectorAll('[data-devtools-doc-test="true"]').forEach((node) => node.remove());
    window.history.replaceState({}, "", "/");
  });

  it("captures allowlisted head metadata while redacting sensitive keys", () => {
    document.title = "Terajs Docs";
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    window.history.replaceState({}, "", "/docs?preview=true&token=secret#intro");

    const description = document.createElement("meta");
    description.setAttribute("name", "description");
    description.setAttribute("content", "Read the Terajs docs.");
    description.setAttribute("data-devtools-doc-test", "true");
    document.head.appendChild(description);

    const ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    ogTitle.setAttribute("content", "Terajs Docs");
    ogTitle.setAttribute("data-devtools-doc-test", "true");
    document.head.appendChild(ogTitle);

    const csrf = document.createElement("meta");
    csrf.setAttribute("name", "csrf-token");
    csrf.setAttribute("content", "very-secret");
    csrf.setAttribute("data-devtools-doc-test", "true");
    document.head.appendChild(csrf);

    const canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", "/docs?preview=true");
    canonical.setAttribute("data-devtools-doc-test", "true");
    document.head.appendChild(canonical);

    const context = captureSafeDocumentContext();
    expect(context?.title).toBe("Terajs Docs");
    expect(context?.lang).toBe("en");
    expect(context?.dir).toBe("ltr");
    expect(context?.path).toBe("/docs");
    expect(context?.hash).toBe("#intro");
    expect(context?.queryKeys).toEqual(["preview"]);
    expect(context?.metaTags).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "description", value: "Read the Terajs docs." }),
      expect.objectContaining({ key: "og:title", value: "Terajs Docs" })
    ]));
    expect(context?.metaTags.some((tag) => tag.key.includes("csrf"))).toBe(false);
    expect(context?.linkTags).toEqual(expect.arrayContaining([
      expect.objectContaining({ rel: "canonical", href: "/docs", queryKeys: ["preview"], sameOrigin: true })
    ]));
  });

  it("derives actionable metadata diagnostics from the safe context", () => {
    document.title = "Docs";
    window.history.replaceState({}, "", "/docs?preview=true");

    const description = document.createElement("meta");
    description.setAttribute("name", "description");
    description.setAttribute("content", "Read the docs.");
    description.setAttribute("data-devtools-doc-test", "true");
    document.head.appendChild(description);

    const canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", "/docs?preview=true");
    canonical.setAttribute("data-devtools-doc-test", "true");
    document.head.appendChild(canonical);

    const context = captureSafeDocumentContext();
    const diagnostics = analyzeSafeDocumentContext(context);

    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "missing-robots" }),
      expect.objectContaining({ id: "canonical-has-query" }),
      expect.objectContaining({ id: "missing-og-core" })
    ]));
    expect(diagnostics.some((entry) => entry.id === "missing-description")).toBe(false);
  });
});