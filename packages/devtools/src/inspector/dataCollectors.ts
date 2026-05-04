import { captureStateSnapshot } from "@terajs/adapter-ai";
import { getAllReactives, getReactiveByRid, type ReactiveInstanceInfo } from "@terajs/shared";
import {
  readComponentIdentity,
  readNumber,
  readString,
  readUnknown,
  safeString,
  shortJson
} from "./shared.js";

export interface DevtoolsEventLike {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

export interface LiveReactiveEntry {
  rid: string;
  label: string;
  type: string;
  currentValue: unknown;
}

function formatReactiveLabel(entry: Pick<ReactiveInstanceInfo, "meta">, fallback: string): string {
  const group = typeof entry.meta.group === "string" && entry.meta.group.trim().length > 0
    ? entry.meta.group.trim()
    : null;
  const key = typeof entry.meta.key === "string" && entry.meta.key.trim().length > 0
    ? entry.meta.key.trim()
    : null;

  if (group && key && group !== key) {
    return `${group}.${key}`;
  }

  return key ?? group ?? fallback;
}

function resolveReactiveLabel(rid: string, fallback?: string): string {
  const reactive = getReactiveByRid(rid);
  return reactive ? formatReactiveLabel(reactive, fallback ?? rid) : (fallback ?? rid);
}

function resolveComposableBucketName(entry: Pick<ReactiveInstanceInfo, "meta">): string {
  const composable = typeof entry.meta.composable === "string" && entry.meta.composable.trim().length > 0
    ? entry.meta.composable.trim()
    : null;

  return composable ?? "script";
}

export function isSignalLikeUpdate(type: string): boolean {
  return (
    type === "signal:update" ||
    type === "state:update" ||
    type === "reactive:updated" ||
    type === "reactive:update" ||
    type === "ref:set" ||
    type === "computed:update"
  );
}

export function collectSignalUpdates(events: DevtoolsEventLike[]) {
  const signalMap = new Map<string, { key: string; preview: string; value: unknown }>();

  for (const event of events) {
    if (!isSignalLikeUpdate(event.type)) continue;
    const rid = readString(event.payload, "rid");
    const key = rid
      ? resolveReactiveLabel(rid, readString(event.payload, "key") ?? rid)
      : readString(event.payload, "key") ?? event.type;
    const previewValue =
      readUnknown(event.payload, "next") ??
      readUnknown(event.payload, "value") ??
      readUnknown(event.payload, "newValue") ??
      readUnknown(event.payload, "prev") ??
      readUnknown(event.payload, "initialValue");

    signalMap.set(key, {
      key,
      preview: safeString(previewValue).slice(0, 60),
      value: previewValue
    });
  }

  return Array.from(signalMap.values());
}

export function collectSignalRegistrySnapshot() {
  const snapshot = captureStateSnapshot();

  return snapshot.signals
    .map((entry) => ({
      id: entry.id,
      key: entry.key,
      type: entry.type,
      scope: entry.scope,
      label: entry.key ?? `${entry.scope} (${entry.type})`,
      valuePreview: shortJson(entry.value),
      value: entry.value
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function collectOwnedReactiveEntries(scope: string, instance: number): LiveReactiveEntry[] {
  const deduped = new Map<string, LiveReactiveEntry>();

  for (const entry of getAllReactives()) {
    if (entry.owner?.scope !== scope || entry.owner.instance !== instance) {
      continue;
    }

    const label = formatReactiveLabel(entry, entry.meta.rid);
    const dedupeKey = `${scope}#${instance}:${label}`;
    const current = deduped.get(dedupeKey);
    const nextEntry: LiveReactiveEntry = {
      rid: entry.meta.rid,
      label,
      type: entry.meta.type,
      currentValue: entry.currentValue
    };

    if (!current || current.currentValue === undefined) {
      deduped.set(dedupeKey, nextEntry);
    }
  }

  return Array.from(deduped.values()).sort((left, right) => left.label.localeCompare(right.label));
}

export function collectMetaEntries(events: DevtoolsEventLike[]) {
  const metaMap = new Map<string, {
    key: string;
    scope: string;
    instance: number;
    meta: unknown;
    ai: unknown;
    route: unknown;
  }>();

  for (const event of events) {
    if (isComponentMountEvent(event.type)) {
      const identity = readComponentIdentity(event);
      if (!identity) continue;

      const scope = identity.scope;
      const instance = identity.instance;
      const meta = readUnknown(event.payload, "meta");
      const ai = readUnknown(event.payload, "ai");
      const route = readUnknown(event.payload, "route");
      if (meta === undefined && ai === undefined && route === undefined) continue;
      const key = `${scope}#${instance}`;
      metaMap.set(key, { key, scope, instance, meta, ai, route });
      continue;
    }

    if (event.type === "route:meta:resolved") {
      const target = readString(event.payload, "to") ?? "current-route";
      const meta = readUnknown(event.payload, "meta");
      const ai = readUnknown(event.payload, "ai");
      const route = readUnknown(event.payload, "route");
      const key = `route:${target}`;
      metaMap.set(key, {
        key,
        scope: `Route ${target}`,
        instance: event.timestamp,
        meta,
        ai,
        route
      });
    }
  }

  return Array.from(metaMap.values());
}


export function collectComponentComposables(scope: string, instance: number) {
  const composables = new Map<string, { name: string; state: Record<string, unknown> }>();

  for (const entry of getAllReactives()) {
    if (entry.owner?.scope !== scope || entry.owner.instance !== instance) {
      continue;
    }

    const name = resolveComposableBucketName(entry);

    const existing = composables.get(name);
    if (!existing) {
      composables.set(name, { name, state: {} });
    }

    const target = composables.get(name)!;

    const key = formatReactiveLabel(entry, entry.meta.rid ?? entry.meta.type);

    target.state[key] = entry.currentValue;
  }

  return Array.from(composables.values());
}

export function collectRouteSnapshot(events: DevtoolsEventLike[]) {
  let currentRoute: string | null = null;
  let from: string | null = null;
  let to: string | null = null;
  let source: string | null = null;
  let params: unknown = undefined;
  let query: unknown = undefined;
  let guardContext: string | null = null;
  let phase: string | null = null;
  let lastEventType: string | null = null;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!(event.type.startsWith("route:") || event.type === "error:router")) {
      continue;
    }

    const payload = event.payload ?? {};

    if (!lastEventType) {
      lastEventType = event.type;
    }

    if (!to) {
      to = readString(payload, "to") ?? readString(payload, "route") ?? null;
    }

    if (!from) {
      from = readString(payload, "from") ?? null;
    }

    if (!source) {
      source = readString(payload, "source") ?? null;
    }

    if (params === undefined) {
      params = readUnknown(payload, "params");
    }

    if (query === undefined) {
      query = readUnknown(payload, "query");
    }

    if (!phase) {
      phase = readString(payload, "phase") ?? null;
    }

    if (!guardContext) {
      const guardName = readString(payload, "guardName");
      if (guardName) {
        guardContext = guardName;
      } else {
        const middleware = readUnknown(payload, "middleware");
        if (Array.isArray(middleware)) {
          guardContext = middleware.map((value) => safeString(value)).join(", ");
        }
      }
    }

    if (!currentRoute && event.type === "route:changed") {
      currentRoute = readString(payload, "to") ?? null;
    }
  }

  return {
    currentRoute,
    from,
    to,
    source,
    params,
    query,
    guardContext,
    phase,
    lastEventType
  };
}

export function collectRouteIssues(events: DevtoolsEventLike[]) {
  return events
    .filter((event) => event.type === "error:router" || event.type === "route:warn" || event.type === "route:blocked")
    .map((event) => ({
      type: event.type,
      summary: routeEventSummary(event)
    }));
}

export function collectRouteTimeline(events: DevtoolsEventLike[]) {
  return events
    .filter((event) => event.type.startsWith("route:") || event.type === "error:router")
    .map((event) => ({
      type: event.type,
      summary: routeEventSummary(event)
    }));
}

export function summarizeLog(event: DevtoolsEventLike): string {
  const payload = event.payload ?? {};

  if (event.type.startsWith("route:") || event.type === "error:router") {
    return routeEventSummary(event);
  }

  if (event.type.startsWith("hub:")) {
    const transport = readString(payload, "transport");
    const message = readString(payload, "message");
    const reason = readString(payload, "reason");
    const type = readString(payload, "type");
    const keys = readUnknown(payload, "keys");
    const keySummary = Array.isArray(keys) && keys.length > 0
      ? `keys=${keys.map((key) => safeString(key)).join(",")}`
      : undefined;

    const parts = [transport, type ? `type=${type}` : undefined, reason ? `reason=${reason}` : undefined, message, keySummary]
      .filter((part): part is string => typeof part === "string" && part.length > 0);

    return parts.length > 0 ? parts.join(" | ") : shortJson(payload);
  }

  if (isSignalLikeUpdate(event.type)) {
    const target = readString(payload, "key") ?? readString(payload, "rid") ?? readString(payload, "name");
    const nextValue =
      readUnknown(payload, "next") ??
      readUnknown(payload, "value") ??
      readUnknown(payload, "newValue");

    if (target && nextValue !== undefined) {
      return `${target} updated to ${safeString(nextValue)}`;
    }

    if (target) {
      return `${target} updated`;
    }
  }

  if (event.type.startsWith("effect:")) {
    const target = readString(payload, "name") ?? readString(payload, "key") ?? readString(payload, "rid") ?? readString(payload, "scope");
    const action = event.type.endsWith(":cleanup")
      ? "cleaned up"
      : event.type.endsWith(":registered")
        ? "registered"
        : event.type.endsWith(":run")
          ? "ran"
          : "updated";

    if (target) {
      return `${target} ${action}`;
    }
  }

  if (event.type.startsWith("component:")) {
    const identity = readComponentIdentity(event);
    const target = identity?.scope ?? readString(payload, "scope") ?? readString(payload, "name");
    const action = event.type.split(":").slice(1).join(" ").replace(/-/g, " ").trim();

    if (target) {
      return `${target} ${action || "updated"}`;
    }
  }

  const scope = readString(payload, "scope") ?? readString(payload, "name");
  const message = readString(payload, "message");
  if (message) return message;
  if (scope) return scope;

  const structuredSummary = summarizePayloadFields(payload);
  if (structuredSummary) {
    return structuredSummary;
  }

  return "Structured event payload captured.";
}

function summarizePayloadFields(payload: Record<string, unknown>): string | null {
  const parts = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null)
    .slice(0, 3)
    .map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key}=${safeString(value)}`;
      }

      if (Array.isArray(value)) {
        return `${key}=${value.length} items`;
      }

      if (typeof value === "object") {
        return `${key}=object`;
      }

      return `${key}=${safeString(value)}`;
    });

  return parts.length > 0 ? parts.join(" | ") : null;
}

export function issueMessage(event: DevtoolsEventLike): string {
  const message = readString(event.payload, "message");
  if (message) return message;
  const likelyCause = readString(event.payload, "likelyCause");
  if (likelyCause) return `Likely Cause: ${likelyCause}`;
  return shortJson(event.payload ?? {});
}

export function queueEventSummary(event: DevtoolsEventLike): string {
  const payload = event.payload ?? {};
  const id = readString(payload, "id");
  const type = readString(payload, "type");
  const decision = readString(payload, "decision");
  const attempts = readNumber(payload, "attempts");
  const pending = readNumber(payload, "pending");

  const parts = [
    type ? `type=${type}` : undefined,
    id ? `id=${id}` : undefined,
    decision ? `decision=${decision}` : undefined,
    attempts !== undefined ? `attempts=${attempts}` : undefined,
    pending !== undefined ? `pending=${pending}` : undefined
  ].filter((part): part is string => typeof part === "string");

  return parts.length > 0 ? parts.join(" ") : shortJson(payload);
}

export function routeEventSummary(event: DevtoolsEventLike): string {
  const payload = event.payload ?? {};
  const from = readString(payload, "from");
  const to = readString(payload, "to") ?? readString(payload, "route");
  const source = readString(payload, "source");
  const message = readString(payload, "message");
  const redirectTo = readString(payload, "redirectTo");
  const phase = readString(payload, "phase");
  const guardName = readString(payload, "guardName");
  const durationMs = readNumber(payload, "durationMs");

  const middleware = readUnknown(payload, "middleware");
  const middlewareSummary = Array.isArray(middleware)
    ? middleware.map((item) => safeString(item)).join(",")
    : undefined;

  const parts = [
    from !== undefined ? `from=${from ?? "null"}` : undefined,
    to ? `to=${to}` : undefined,
    source ? `source=${source}` : undefined,
    redirectTo ? `redirect=${redirectTo}` : undefined,
    guardName ? `guard=${guardName}` : undefined,
    middlewareSummary ? `middleware=${middlewareSummary}` : undefined,
    phase ? `phase=${phase}` : undefined,
    durationMs !== undefined ? `duration=${durationMs}ms` : undefined,
    message ? `message=${message}` : undefined
  ].filter((part): part is string => typeof part === "string" && part.length > 0);

  return parts.length > 0 ? parts.join(" ") : shortJson(payload);
}

export function generateLikelyCause(payload: Record<string, unknown> | undefined): string | null {
  const snapshot = captureStateSnapshot();
  const entries = snapshot.signals.map((signal) => `${signal.key ?? signal.id}: ${safeString(signal.value)}`);
  const topEntries = entries.slice(0, 4).join("; ");
  const origin = readString(payload, "rid") ?? readString(payload, "scope") ?? "unknown origin";
  const message = readString(payload, "message") ?? "reactive error detected";

  return `Detected reactive error (${message}) from ${origin}. Current keyed state: ${topEntries || "no keyed signals available"}.`;
}

function isComponentMountEvent(type: string): boolean {
  return type === "component:mounted" || type === "component:mount";
}
