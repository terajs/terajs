import type { MetaConfig } from "@terajs/shared";

function normalizeCanonicalPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

function normalizeMetaString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const lower = trimmed.toLowerCase();
  if (lower === "undefined" || lower === "null") {
    return "";
  }

  return trimmed;
}

function normalizeContent(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return normalizeMetaString(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeMetaString(item) || String(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.toLowerCase() !== "undefined" && item.toLowerCase() !== "null")
      .join(", ");
  }

  const normalized = normalizeMetaString(value);
  if (normalized) {
    return normalized;
  }

  return String(value);
}

function syncMetaTag(name: string, content: string | undefined, attrName: "name" | "property" = "name"): void {
  if (typeof document === "undefined") {
    return;
  }

  const selector = `meta[${attrName}="${name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    el?.remove();
    return;
  }

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, name);
    document.head.appendChild(el);
  }

  el.setAttribute("content", content);
}

function resolveCanonicalHref(value: unknown, pathname?: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  if (value === "auto") {
    return `${document.location.origin}${normalizeCanonicalPathname(pathname ?? document.location.pathname)}`;
  }

  const normalized = normalizeMetaString(value);
  if (!normalized) {
    return undefined;
  }

  try {
    const url = new URL(normalized, document.baseURI);
    url.hash = "";
    return url.toString();
  } catch {
    return normalized;
  }
}

function syncCanonicalLink(href: string | undefined): void {
  if (typeof document === "undefined") {
    return;
  }

  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!href) {
    el?.remove();
    return;
  }

  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }

  el.setAttribute("href", href);
}

/**
 * Applies resolved route metadata and optional AI hints to the document head.
 *
 * Standard metadata keys are written as `name` meta tags, while Open Graph
 * keys use the `property` attribute. Empty values remove existing tags.
 *
 * @param meta - The resolved metadata to apply to the current document.
 * @param ai - Optional structured AI hint payload serialized into a meta tag.
 * @param pathname - Optional active route pathname used to resolve automatic canonicals.
 */
export function updateHead(meta: MetaConfig, ai?: Record<string, unknown>, pathname?: string): void {
  if (typeof document === "undefined") return;
  if (!meta || typeof meta !== "object") return;

  const title = normalizeMetaString(meta.title);
  syncCanonicalLink(resolveCanonicalHref(meta.canonical, pathname));

  if (title) {
    document.title = title;
  }

  for (const [key, value] of Object.entries(meta)) {
    if (key === "title" || key === "canonical") {
      continue;
    }

    const content = normalizeContent(value);
    if (key.startsWith("og:")) {
      syncMetaTag(key, content || undefined, "property");
      continue;
    }

    syncMetaTag(key, content || undefined, "name");
  }

  const aiContent = ai && typeof ai === "object" && Object.keys(ai).length > 0
    ? JSON.stringify(ai)
    : undefined;
  syncMetaTag("terajs-ai-hint", aiContent, "name");
}