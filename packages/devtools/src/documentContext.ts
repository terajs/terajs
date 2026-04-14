const MAX_TITLE_LENGTH = 160;
const MAX_META_VALUE_LENGTH = 240;
const MAX_META_TAGS = 24;
const MAX_LINK_TAGS = 12;
const MAX_QUERY_KEYS = 12;

const ALLOWED_META_KEYS = new Set([
  "application-name",
  "author",
  "charset",
  "color-scheme",
  "content-language",
  "content-security-policy",
  "content-security-policy-report-only",
  "default-style",
  "description",
  "generator",
  "keywords",
  "referrer",
  "robots",
  "theme-color",
  "viewport",
  "x-ua-compatible",
  "apple-mobile-web-app-capable",
  "apple-mobile-web-app-title",
  "msapplication-config",
  "msapplication-tilecolor",
]);

const ALLOWED_META_PREFIXES = ["og:", "twitter:", "article:", "terajs:", "ai:"];
const ALLOWED_LINK_RELS = new Set(["canonical", "alternate", "manifest", "icon", "apple-touch-icon"]);
const SENSITIVE_KEY_PATTERN = /pass(word)?|secret|token|credential|api(key)?|auth|private|nonce|csrf|verify|session/i;

export interface SafeDocumentMetaTag {
  key: string;
  source: "charset" | "name" | "property" | "http-equiv";
  value: string;
}

export interface SafeDocumentLinkTag {
  rel: string;
  href: string;
  sameOrigin: boolean;
  queryKeys: string[];
}

export interface SafeDocumentContext {
  title: string;
  lang: string | null;
  dir: "ltr" | "rtl" | null;
  path: string;
  hash: string | null;
  queryKeys: string[];
  metaTags: SafeDocumentMetaTag[];
  linkTags: SafeDocumentLinkTag[];
}

export interface SafeDocumentContextSummary {
  title: string;
  lang: string | null;
  dir: "ltr" | "rtl" | null;
  path: string;
  hash: string | null;
  queryKeys: string[];
  metaTagCount: number;
  linkTagCount: number;
}

export interface SafeDocumentDiagnostic {
  id: string;
  severity: "info" | "warn";
  message: string;
  detail?: string;
}

function sanitizeText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1))}\u2026`;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function isAllowedMetaKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (isSensitiveKey(normalized)) {
    return false;
  }

  if (ALLOWED_META_KEYS.has(normalized)) {
    return true;
  }

  return ALLOWED_META_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function collectSafeQueryKeys(searchParams: URLSearchParams): string[] {
  const keys: string[] = [];

  for (const key of searchParams.keys()) {
    const normalized = sanitizeText(key, 60);
    if (!normalized || isSensitiveKey(normalized) || keys.includes(normalized)) {
      continue;
    }

    keys.push(normalized);
    if (keys.length >= MAX_QUERY_KEYS) {
      break;
    }
  }

  return keys;
}

function summarizeHref(
  rawHref: string,
  baseUrl: URL
): Omit<SafeDocumentLinkTag, "rel"> | null {
  try {
    const resolved = new URL(rawHref, baseUrl);
    return {
      href: resolved.origin === baseUrl.origin
        ? resolved.pathname || "/"
        : `${resolved.origin}${resolved.pathname || "/"}`,
      sameOrigin: resolved.origin === baseUrl.origin,
      queryKeys: collectSafeQueryKeys(resolved.searchParams)
    } as SafeDocumentLinkTag;
  } catch {
    return null;
  }
}

/**
 * Captures a safe document/head summary for debugging and AI tooling.
 *
 * This is intentionally allowlisted and read-only: it avoids body scraping,
 * skips token-like meta/query keys, and limits output to common head metadata.
 */
export function captureSafeDocumentContext(doc: Document = document): SafeDocumentContext | null {
  if (typeof document === "undefined") {
    return null;
  }

  const view = doc.defaultView;
  if (!view) {
    return null;
  }

  const locationUrl = new URL(view.location.href);
  const metaTags: SafeDocumentMetaTag[] = [];
  const seenMetaKeys = new Set<string>();

  for (const metaEl of Array.from(doc.head?.querySelectorAll("meta") ?? [])) {
    const charset = metaEl.getAttribute("charset");
    const name = metaEl.getAttribute("name");
    const property = metaEl.getAttribute("property");
    const httpEquiv = metaEl.getAttribute("http-equiv");

    let key: string | null = null;
    let source: SafeDocumentMetaTag["source"] | null = null;
    let value = "";

    if (charset) {
      key = "charset";
      source = "charset";
      value = charset;
    } else if (name) {
      key = name;
      source = "name";
      value = metaEl.getAttribute("content") ?? "";
    } else if (property) {
      key = property;
      source = "property";
      value = metaEl.getAttribute("content") ?? "";
    } else if (httpEquiv) {
      key = httpEquiv;
      source = "http-equiv";
      value = metaEl.getAttribute("content") ?? "";
    }

    if (!key || !source || !isAllowedMetaKey(key)) {
      continue;
    }

    const normalizedKey = sanitizeText(key.toLowerCase(), 80);
    const normalizedValue = sanitizeText(value, MAX_META_VALUE_LENGTH);
    if (!normalizedKey || !normalizedValue) {
      continue;
    }

    const dedupeKey = `${source}:${normalizedKey}:${normalizedValue}`;
    if (seenMetaKeys.has(dedupeKey)) {
      continue;
    }

    seenMetaKeys.add(dedupeKey);
    metaTags.push({
      key: normalizedKey,
      source,
      value: normalizedValue
    });

    if (metaTags.length >= MAX_META_TAGS) {
      break;
    }
  }

  const linkTags: SafeDocumentLinkTag[] = [];
  const seenLinks = new Set<string>();
  for (const linkEl of Array.from(doc.head?.querySelectorAll("link[rel][href]") ?? [])) {
    const relTokens = (linkEl.getAttribute("rel") ?? "")
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length > 0);
    const rel = relTokens.find((token) => ALLOWED_LINK_RELS.has(token));
    if (!rel) {
      continue;
    }

    const href = linkEl.getAttribute("href");
    if (!href) {
      continue;
    }

    const summarizedHref = summarizeHref(href, locationUrl);
    if (!summarizedHref) {
      continue;
    }

    const dedupeKey = `${rel}:${summarizedHref.href}`;
    if (seenLinks.has(dedupeKey)) {
      continue;
    }

    seenLinks.add(dedupeKey);
    linkTags.push({
      rel,
      ...summarizedHref
    });

    if (linkTags.length >= MAX_LINK_TAGS) {
      break;
    }
  }

  return {
    title: sanitizeText(doc.title ?? "", MAX_TITLE_LENGTH),
    lang: doc.documentElement.lang.trim() || null,
    dir: doc.documentElement.dir === "ltr" || doc.documentElement.dir === "rtl"
      ? doc.documentElement.dir
      : null,
    path: locationUrl.pathname || "/",
    hash: locationUrl.hash || null,
    queryKeys: collectSafeQueryKeys(locationUrl.searchParams),
    metaTags,
    linkTags
  };
}

export function summarizeSafeDocumentContext(
  context: SafeDocumentContext | null
): SafeDocumentContextSummary | null {
  if (!context) {
    return null;
  }

  return {
    title: context.title,
    lang: context.lang,
    dir: context.dir,
    path: context.path,
    hash: context.hash,
    queryKeys: context.queryKeys,
    metaTagCount: context.metaTags.length,
    linkTagCount: context.linkTags.length
  };
}

function findMetaTags(context: SafeDocumentContext, key: string): SafeDocumentMetaTag[] {
  return context.metaTags.filter((tag) => tag.key === key);
}

function findLinkTags(context: SafeDocumentContext, rel: string): SafeDocumentLinkTag[] {
  return context.linkTags.filter((tag) => tag.rel === rel);
}

/**
 * Derives actionable document-head diagnostics from the safe context summary.
 */
export function analyzeSafeDocumentContext(context: SafeDocumentContext | null): SafeDocumentDiagnostic[] {
  if (!context) {
    return [{
      id: "missing-document-context",
      severity: "warn",
      message: "Document head context is unavailable.",
      detail: "DevTools could not capture the current title, route path, or allowlisted head tags."
    }];
  }

  const diagnostics: SafeDocumentDiagnostic[] = [];
  const descriptionTags = findMetaTags(context, "description");
  const canonicalLinks = findLinkTags(context, "canonical");
  const robotsTags = findMetaTags(context, "robots");
  const ogTitleTags = findMetaTags(context, "og:title");
  const ogDescriptionTags = findMetaTags(context, "og:description");
  const ogTypeTags = findMetaTags(context, "og:type");

  if (!context.title) {
    diagnostics.push({
      id: "missing-title",
      severity: "warn",
      message: "Document title is missing.",
      detail: "The current page has no readable title, which weakens debugging context and page metadata quality."
    });
  }

  if (!context.lang) {
    diagnostics.push({
      id: "missing-lang",
      severity: "info",
      message: "Document language is not set.",
      detail: "Set the html lang attribute so tooling and accessibility checks can infer the primary language."
    });
  }

  if (descriptionTags.length === 0) {
    diagnostics.push({
      id: "missing-description",
      severity: "warn",
      message: "Description meta tag is missing.",
      detail: "Add a concise description so AI triage and SEO tooling can identify the current page intent faster."
    });
  } else if (descriptionTags.length > 1) {
    diagnostics.push({
      id: "multiple-descriptions",
      severity: "warn",
      message: "Multiple description meta tags were captured.",
      detail: `Found ${descriptionTags.length} description tags. Keep one canonical description to avoid conflicting page summaries.`
    });
  }

  if (canonicalLinks.length === 0) {
    diagnostics.push({
      id: "missing-canonical",
      severity: "warn",
      message: "Canonical link tag is missing.",
      detail: "Add a canonical link if this page should resolve to one preferred public URL."
    });
  } else if (canonicalLinks.length > 1) {
    diagnostics.push({
      id: "multiple-canonical",
      severity: "warn",
      message: "Multiple canonical link tags were captured.",
      detail: `Found ${canonicalLinks.length} canonical links. Keep one canonical target to avoid ambiguous indexing.`
    });
  } else if (canonicalLinks[0]?.queryKeys.length) {
    diagnostics.push({
      id: "canonical-has-query",
      severity: "info",
      message: "Canonical link includes query keys.",
      detail: `Canonical query keys: ${canonicalLinks[0].queryKeys.join(", ")}. Confirm those keys are intentionally canonical.`
    });
  }

  if (robotsTags.length === 0) {
    diagnostics.push({
      id: "missing-robots",
      severity: "info",
      message: "Robots meta tag is not present.",
      detail: "That can be fine, but add one if you need explicit indexing or preview controls."
    });
  } else if (robotsTags.some((tag) => /noindex|nofollow/i.test(tag.value))) {
    diagnostics.push({
      id: "restrictive-robots",
      severity: "info",
      message: "Robots metadata restricts indexing or link following.",
      detail: robotsTags.map((tag) => tag.value).join(" | ")
    });
  }

  const missingOgKeys = [
    ogTitleTags.length === 0 ? "og:title" : null,
    ogDescriptionTags.length === 0 ? "og:description" : null,
    ogTypeTags.length === 0 ? "og:type" : null
  ].filter((key): key is string => key !== null);

  if (missingOgKeys.length === 3) {
    diagnostics.push({
      id: "missing-og-core",
      severity: "warn",
      message: "Open Graph core tags are missing.",
      detail: "Expected og:title, og:description, and og:type for richer social previews and page summaries."
    });
  } else if (missingOgKeys.length > 0) {
    diagnostics.push({
      id: "incomplete-og-core",
      severity: "warn",
      message: "Open Graph coverage is incomplete.",
      detail: `Missing ${missingOgKeys.join(", ")}.`
    });
  }

  return diagnostics;
}