import type { DebugEvent } from "./types/events.js";

/**
 * Simple in-memory pub/sub for debug events.
 * This is the central channel the rest of Terajs emits into.
 */
export type DebugEventListener = (event: DebugEvent) => void;

export interface SubscribeDebugOptions {
  replay?: boolean;
}

const listeners = new Set<DebugEventListener>();
const eventHistory: DebugEvent[] = [];
const MAX_EVENT_HISTORY = 300;

function pushEventHistory(event: DebugEvent): void {
  eventHistory.push(event);
  if (eventHistory.length > MAX_EVENT_HISTORY) {
    eventHistory.splice(0, eventHistory.length - MAX_EVENT_HISTORY);
  }
}

/**
 * Subscribes a listener to all debug events.
 * Returns an unsubscribe function.
 */
export function subscribeDebug(listener: DebugEventListener, options?: SubscribeDebugOptions): () => void {
  if (process.env.NODE_ENV === "production") {
    return () => {};
  }

  listeners.add(listener);

  if (options?.replay) {
    for (const event of eventHistory) {
      try {
        listener(event);
      } catch {
        // Swallow replay listener errors to keep debug tools non-fatal.
      }
    }
  }

  return () => listeners.delete(listener);
}

/**
 * Emits a debug event to all subscribers.
 * Internal use only from the framework.
 */
export function emitDebug(event: DebugEvent): void {
  if (process.env.NODE_ENV === "production") return;
  pushEventHistory(event);
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Swallow errors to avoid breaking app runtime from debug listeners.
    }
  }
}

export function getDebugListenerCount(): number {
  return listeners.size;
}

export function resetDebugListeners(): void {
  listeners.clear();
  eventHistory.length = 0;
}
