import type { MetaConfig } from "@terajs/shared";

function setMetaTag(name: string, content: string, attrName: "name" | "property" = "name"): void {
  const selector = `meta[${attrName}="${name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, name);
    document.head.appendChild(el);
  }

  el.setAttribute("content", content);
}

function normalizeContent(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  return String(value);
}

export function updateHead(meta: MetaConfig, ai?: Record<string, any>): void {
  if (typeof document === "undefined") return;
  if (!meta || typeof meta !== "object") return;

  if (meta.title) {
    document.title = String(meta.title);
  }

  for (const [key, value] of Object.entries(meta)) {
    if (value == null || key === "title") {
      continue;
    }

    const content = normalizeContent(value);
    if (!content) {
      continue;
    }

    if (key.startsWith("og:")) {
      setMetaTag(key, content, "property");
      continue;
    }

    if (key.startsWith("twitter:")) {
      setMetaTag(key, content, "name");
      continue;
    }

    setMetaTag(key, content, "name");
  }

  if (ai && typeof ai === "object" && Object.keys(ai).length > 0) {
    const selector = "meta[name=\"terajs-ai-hint\"]";
    let el = document.head.querySelector<HTMLMetaElement>(selector);

    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "terajs-ai-hint");
      document.head.appendChild(el);
    }

    el.setAttribute("content", JSON.stringify(ai));
  }
}
