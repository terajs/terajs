import type { SafeDocumentContext } from "../documentContext.js";
import type { DevtoolsIconName } from "../devtoolsIcons.js";

interface MetaSourceEntry {
  key: string;
  scope: string;
  instance: number;
  meta: unknown;
  ai: unknown;
  route: unknown;
}

export interface MetaPanelItem {
  key: string;
  sourceKey: string;
  title: string;
  summary: string;
  detailSubtitle: string;
  sectionTitle: string;
  iconName: DevtoolsIconName;
  groupLabel: string;
  value: unknown;
}

const DOCUMENT_CONTEXT_KEY = "document:head";

export function buildMetaPanelItems(entries: readonly MetaSourceEntry[], documentContext: SafeDocumentContext | null): MetaPanelItem[] {
  const items: MetaPanelItem[] = [];

  if (documentContext) {
    const querySummary = documentContext.queryKeys.length > 0
      ? ` | ${documentContext.queryKeys.length} query keys`
      : "";

    items.push({
      key: DOCUMENT_CONTEXT_KEY,
      sourceKey: DOCUMENT_CONTEXT_KEY,
      title: "Document head",
      summary: `${documentContext.metaTags.length} meta tags | ${documentContext.linkTags.length} links`,
      detailSubtitle: `${documentContext.path}${documentContext.hash ?? ""}${querySummary}`,
      sectionTitle: "Safe document head snapshot",
      iconName: "meta",
      groupLabel: "Document",
      value: documentContext
    });
  }

  for (const entry of entries) {
    pushSurfaceItem(items, entry, "meta", "Meta snapshot", "meta", entry.meta);
    pushSurfaceItem(items, entry, "ai", "AI snapshot", "ai", entry.ai);
    pushSurfaceItem(items, entry, "route", "Route snapshot", "router", entry.route);
  }

  return items;
}

export function findSelectedMetaPanelItem(items: readonly MetaPanelItem[], selectedKey: string | null): MetaPanelItem | null {
  if (items.length === 0) {
    return null;
  }

  if (!selectedKey) {
    return null;
  }

  return items.find((item) => item.key === selectedKey)
    ?? items.find((item) => item.sourceKey === selectedKey)
    ?? items.find((item) => item.key.startsWith(`${selectedKey}:`))
    ?? null;
}

function pushSurfaceItem(
  items: MetaPanelItem[],
  entry: MetaSourceEntry,
  suffix: string,
  summary: string,
  iconName: DevtoolsIconName,
  value: unknown,
): void {
  if (value === undefined) {
    return;
  }

  const detailSource = entry.key.startsWith("route:")
    ? `Captured from ${entry.scope}`
    : `Instance ${entry.instance}`;

  items.push({
    key: `${entry.key}:${suffix}`,
    sourceKey: entry.key,
    title: entry.scope,
    summary: summarizeSurface(value, summary),
    detailSubtitle: `${summary} | ${detailSource}`,
    sectionTitle: summary,
    iconName,
    groupLabel: resolveGroupLabel(entry, suffix),
    value,
  });
}

function resolveGroupLabel(entry: MetaSourceEntry, suffix: string): string {
  if (entry.key === DOCUMENT_CONTEXT_KEY) {
    return "Document";
  }

  if (entry.key.startsWith("route:")) {
    return "Routes";
  }

  if (suffix === "ai") {
    return "AI";
  }

  if (suffix === "route") {
    return "Routes";
  }

  return "Metadata";
}

function summarizeSurface(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const lead = readSummaryField(record, ["path", "title", "name", "to"]);

  if (lead) {
    return `${lead}${keys.length > 1 ? ` | ${keys.length} fields` : ""}`;
  }

  return `${keys.length} fields`;
}

function readSummaryField(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}