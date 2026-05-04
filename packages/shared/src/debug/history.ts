export interface PersistedDebugEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

import { getSharedDebugState } from "./store.js";

const MAX_PERSISTED_DEBUG_EVENTS = 4000;
const MAX_SERIALIZATION_DEPTH = 5;
const MAX_ARRAY_ITEMS = 40;
const MAX_OBJECT_KEYS = 40;

function historyCache(): PersistedDebugEvent[] {
  return getSharedDebugState().history as PersistedDebugEvent[];
}

/**
 * Returns a snapshot of the shared debug archive for overlay hydration.
 */
export function readDebugHistory(): PersistedDebugEvent[] {
  return historyCache().map(clonePersistedDebugEvent);
}

/**
 * Normalizes and stores debug events in the shared in-memory ring buffer.
 */
export function recordDebugHistory(rawEvent: unknown): void {
  const normalized = normalizePersistedDebugEvent(rawEvent);
  if (!normalized) {
    return;
  }

  const history = historyCache();
  history.push(normalized);
  if (history.length > MAX_PERSISTED_DEBUG_EVENTS) {
    history.splice(0, history.length - MAX_PERSISTED_DEBUG_EVENTS);
  }
}

/**
 * Clears the shared debug archive.
 */
export function clearDebugHistory(): void {
  historyCache().length = 0;
}

function normalizePersistedDebugEvent(rawEvent: unknown): PersistedDebugEvent | null {
  if (!rawEvent || typeof rawEvent !== "object") {
    return null;
  }

  const event = rawEvent as Record<string, unknown>;
  const type = typeof event.type === "string" ? event.type : null;
  const timestamp = typeof event.timestamp === "number" ? event.timestamp : Date.now();
  if (!type) {
    return null;
  }

  const payloadSource = event.payload && typeof event.payload === "object"
    ? event.payload
    : Object.fromEntries(
        Object.entries(event).filter(([key]) =>
          key !== "type"
          && key !== "timestamp"
          && key !== "level"
          && key !== "file"
          && key !== "line"
          && key !== "column"
        )
      );

  const payload = sanitizeDebugValue(payloadSource);
  return {
    type,
    timestamp,
    payload: payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : undefined,
    level: parseLevel(event.level),
    file: typeof event.file === "string" ? event.file : undefined,
    line: typeof event.line === "number" ? event.line : undefined,
    column: typeof event.column === "number" ? event.column : undefined
  };
}

function sanitizeDebugValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
    return String(value);
  }

  if (value === undefined) {
    return "undefined";
  }

  if (depth >= MAX_SERIALIZATION_DEPTH) {
    return "[max-depth]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((entry) => sanitizeDebugValue(entry, depth + 1, seen));
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[circular]";
  }

  seen.add(value);
  const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
  const normalized = Object.fromEntries(
    entries.map(([key, entryValue]) => [key, sanitizeDebugValue(entryValue, depth + 1, seen)])
  );
  seen.delete(value);
  return normalized;
}

function clonePersistedDebugEvent(event: PersistedDebugEvent): PersistedDebugEvent {
  return {
    ...event,
    payload: event.payload ? { ...event.payload } : undefined
  };
}

function parseLevel(level: unknown): PersistedDebugEvent["level"] {
  if (level === "info" || level === "warn" || level === "error") {
    return level;
  }

  return undefined;
}
