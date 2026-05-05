import {
  collectSignalRegistrySnapshot,
  isSignalLikeUpdate,
  summarizeLog,
  type DevtoolsEventLike,
} from "../inspector/dataCollectors.js";
import { readString, readUnknown, safeString, shortJson } from "../inspector/shared.js";

export type SignalWorkbenchViewMode = "active" | "recent";

export interface SignalWorkbenchEntry {
  key: string;
  title: string;
  summary: string;
  meta: string;
  group: "updates" | "registry";
  value: unknown;
  type: string | null;
  scope: string | null;
  linkedRegistryKey: string | null;
}

export interface SignalWorkbenchModel {
  entries: SignalWorkbenchEntry[];
  allEntries: SignalWorkbenchEntry[];
  selected: SignalWorkbenchEntry | null;
  selectedVisible: boolean;
  viewMode: SignalWorkbenchViewMode;
  updateCount: number;
  registryCount: number;
  visibleUpdateCount: number;
  visibleRegistryCount: number;
  effectRuns: number;
}

export interface LogWorkbenchEntry {
  key: string;
  title: string;
  summary: string;
  eventType: string;
  level?: "info" | "warn" | "error";
  payload?: Record<string, unknown>;
  timestamp: number;
  family: Exclude<LogFilter, "all"> | "runtime";
  group: string;
}

export interface LogWorkbenchModel {
  entries: LogWorkbenchEntry[];
  selected: LogWorkbenchEntry | null;
  filteredCount: number;
  totalCount: number;
  filterCounts: Record<LogFilter, number>;
  errorCount: number;
  warnCount: number;
}

type LogFilter = "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";

export function buildSignalWorkbenchModel(
  events: DevtoolsEventLike[],
  selectedKey: string | null,
  searchQuery = "",
  viewMode: SignalWorkbenchViewMode = "active",
): SignalWorkbenchModel {
  const registry = collectSignalRegistrySnapshot();
  const registryById = new Map(registry.map((entry) => [entry.id, entry]));
  const registryByKey = new Map(
    registry
      .filter((entry) => Boolean(entry.key))
      .map((entry) => [entry.key as string, entry])
  );
  const updateEntries: SignalWorkbenchEntry[] = [];
  const seenUpdateKeys = new Set<string>();

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!isSignalLikeUpdate(event.type)) {
      continue;
    }

    const payload = event.payload ?? {};
    const rid = readString(payload, "rid");
    const rawKey = rid
      ? readString(payload, "key") ?? rid
      : readString(payload, "key") ?? event.type;
    const registryMatch = (rid ? registryById.get(rid) : null) ?? registryById.get(rawKey) ?? registryByKey.get(rawKey);
    const label = registryMatch?.label ?? rawKey;
    const updateKey = `update:${rid ?? rawKey}`;
    if (seenUpdateKeys.has(updateKey)) {
      continue;
    }

    const nextValue =
      readUnknown(payload, "next") ??
      readUnknown(payload, "value") ??
      readUnknown(payload, "newValue") ??
      readUnknown(payload, "prev") ??
      readUnknown(payload, "initialValue");
    const resolvedType = registryMatch?.type ?? readString(payload, "type") ?? null;
    const scope = registryMatch?.scope ?? readString(payload, "scope") ?? null;
    const linkedRegistryKey = registryMatch ? `registry:${registryMatch.id}` : rid ? `registry:${rid}` : null;

    seenUpdateKeys.add(updateKey);
    updateEntries.push({
      key: updateKey,
      title: label,
      summary: summarizeSignalPreview(nextValue),
      meta: buildSignalMeta(scope, resolvedType),
      group: "updates",
      value: nextValue,
      type: resolvedType,
      scope,
      linkedRegistryKey,
    });
  }

  const registryEntries: SignalWorkbenchEntry[] = registry.map((entry) => ({
    key: `registry:${entry.id}`,
    title: entry.label,
    summary: summarizeSignalPreview(entry.value),
    meta: buildSignalMeta(entry.scope, entry.type),
    group: "registry",
    value: entry.value,
    type: entry.type,
    scope: entry.scope,
    linkedRegistryKey: `registry:${entry.id}`,
  }));

  const filteredUpdateEntries = updateEntries
    .filter((entry) => matchesQuery([entry.title, entry.summary, entry.meta, entry.type, entry.scope], searchQuery));
  const filteredRegistryEntries = registryEntries
    .filter((entry) => matchesQuery([entry.title, entry.summary, entry.meta, entry.type, entry.scope], searchQuery));
  const entries = viewMode === "recent" ? filteredUpdateEntries : filteredRegistryEntries;
  const allEntries = [...updateEntries, ...registryEntries];
  const selectedVisibleEntry = selectedKey
    ? entries.find((entry) => entry.key === selectedKey) ?? null
    : null;
  const selectedSearchPreservedEntry = selectedKey && searchQuery.trim().length > 0
    ? allEntries.find((entry) => entry.key === selectedKey && entry.group === (viewMode === "recent" ? "updates" : "registry")) ?? null
    : null;
  const selected = selectedVisibleEntry ?? selectedSearchPreservedEntry ?? null;
  const visibleUpdateCount = filteredUpdateEntries.length;
  const visibleRegistryCount = filteredRegistryEntries.length;

  return {
    entries,
    allEntries,
    selected,
    selectedVisible: selected ? entries.some((entry) => entry.key === selected.key) : false,
    viewMode,
    updateCount: updateEntries.length,
    registryCount: registryEntries.length,
    visibleUpdateCount,
    visibleRegistryCount,
    effectRuns: events.filter((event) => event.type === "effect:run").length,
  };
}

export function buildLogWorkbenchModel(
  events: DevtoolsEventLike[],
  logFilter: LogFilter,
  selectedKey: string | null,
  searchQuery = "",
): LogWorkbenchModel {
  const retainedEvents = events.slice(-120);
  const filterCounts: Record<LogFilter, number> = {
    all: retainedEvents.length,
    component: 0,
    signal: 0,
    effect: 0,
    error: 0,
    hub: 0,
    route: 0,
  };
  let errorCount = 0;
  let warnCount = 0;

  for (const event of retainedEvents) {
    for (const filter of ["component", "signal", "effect", "error", "hub", "route"] as const) {
      if (matchesLogFilter(event, filter)) {
        filterCounts[filter] += 1;
      }
    }

    if (isErrorLikeLogEvent(event)) {
      errorCount += 1;
    }

    if (isWarnLikeLogEvent(event)) {
      warnCount += 1;
    }
  }

  const filtered = retainedEvents
    .map((event, retainedIndex) => ({ event, retainedIndex }))
    .filter(({ event }) => matchesLogFilter(event, logFilter));

  const entries = filtered
    .slice()
    .reverse()
    .map(({ event, retainedIndex }) => {
      const family = resolvePrimaryLogFamily(event);
      return {
        key: `${event.timestamp}:${event.type}:${retainedIndex}`,
      title: formatLogTitle(event.type),
      summary: summarizeLog(event),
      eventType: event.type,
      level: event.level,
      payload: event.payload,
      timestamp: event.timestamp,
        family,
        group: resolveLogGroup(family),
      };
    })
    .filter((entry) => matchesQuery([
      entry.title,
      entry.summary,
      entry.eventType,
      entry.level,
      serializeLogPayload(entry.payload),
    ], searchQuery));

  return {
    entries,
    selected: selectedKey ? entries.find((entry) => entry.key === selectedKey) ?? null : null,
    filteredCount: entries.length,
    totalCount: retainedEvents.length,
    filterCounts,
    errorCount,
    warnCount,
  };
}

function buildSignalMeta(scope: string | null, type: string | null): string {
  return [scope, type].filter((value): value is string => Boolean(value && value.length > 0)).join(" · ");
}

function summarizeSignalPreview(value: unknown, allowStructuredStringParse = true): string {
  if (Array.isArray(value)) {
    return value.length === 0
      ? "Array · empty"
      : `Array · ${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) {
      return "Object · empty";
    }

    const visibleKeys = keys.slice(0, 3).join(", ");
    return keys.length > 3
      ? `Object · ${visibleKeys} +${keys.length - 3}`
      : `Object · ${visibleKeys}`;
  }

  if (typeof value === "string") {
    if (allowStructuredStringParse) {
      const parsed = tryParseStructuredSignalString(value);
      if (parsed !== null) {
        return summarizeSignalPreview(parsed, false);
      }
    }

    const compactValue = value.replace(/\s+/g, " ").trim();
    if (compactValue.length === 0) {
      return "Text · empty";
    }

    if (value.includes("\n") || compactValue.length > 28) {
      return `Text · ${value.length} chars`;
    }

    return `Text · ${compactValue}`;
  }

  if (typeof value === "number") {
    return `Number · ${String(value)}`;
  }

  if (typeof value === "boolean") {
    return `Boolean · ${value ? "true" : "false"}`;
  }

  if (value === null) {
    return "Null";
  }

  if (value === undefined) {
    return "Undefined";
  }

  const preview = shortJson(value);
  return preview.length > 0 ? preview : safeString(value);
}

function tryParseStructuredSignalString(value: string): unknown | null {
  const trimmed = value.trim();
  if (!(trimmed.startsWith("[") || trimmed.startsWith("{"))) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function isComponentLogEvent(type: string): boolean {
  return type.startsWith("component:")
    || type.startsWith("template:")
    || type.startsWith("dom:")
    || type.startsWith("ir:");
}

function isErrorLikeLogEvent(event: DevtoolsEventLike): boolean {
  return event.level === "error" || event.type.startsWith("error:");
}

function isWarnLikeLogEvent(event: DevtoolsEventLike): boolean {
  return event.level === "warn" || event.type.includes("warn") || event.type.includes("hydration");
}

function matchesLogFilter(event: DevtoolsEventLike, filter: LogFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "component":
      return isComponentLogEvent(event.type);
    case "signal":
      return isSignalLikeUpdate(event.type);
    case "effect":
      return event.type.startsWith("effect:");
    case "error":
      return isErrorLikeLogEvent(event) || isWarnLikeLogEvent(event);
    case "hub":
      return event.type.startsWith("hub:");
    case "route":
      return event.type.startsWith("route:") || event.type === "error:router";
  }
}

function resolvePrimaryLogFamily(event: DevtoolsEventLike): Exclude<LogFilter, "all"> | "runtime" {
  if (event.type.startsWith("route:") || event.type === "error:router") {
    return "route";
  }

  if (event.type.startsWith("hub:")) {
    return "hub";
  }

  if (isSignalLikeUpdate(event.type)) {
    return "signal";
  }

  if (event.type.startsWith("effect:")) {
    return "effect";
  }

  if (isComponentLogEvent(event.type)) {
    return "component";
  }

  if (isErrorLikeLogEvent(event) || isWarnLikeLogEvent(event)) {
    return "error";
  }

  return "runtime";
}

function resolveLogGroup(family: Exclude<LogFilter, "all"> | "runtime"): string {
  switch (family) {
    case "component":
      return "Component activity";
    case "signal":
      return "Reactive updates";
    case "effect":
      return "Effect activity";
    case "error":
      return "Warnings and errors";
    case "hub":
      return "Hub traffic";
    case "route":
      return "Router activity";
    default:
      return "Runtime";
  }
}

function serializeLogPayload(payload: Record<string, unknown> | undefined): string {
  if (!payload) {
    return "";
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return safeString(payload);
  }
}

function matchesQuery(values: Array<string | null | undefined>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function formatLogTitle(type: string): string {
  return type
    .split(":")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      if (segment === "ai") return "AI";
      if (segment === "hub") return "Hub";
      if (segment === "dom") return "DOM";
      return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
    })
    .join(" ");
}