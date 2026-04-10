import type { DebugEvent } from "./types/events.js";

/**
 * Simple in-memory pub/sub for debug events.
 * This is the central channel the rest of Terajs emits into.
 */
export type DebugEventListener = (event: DebugEvent) => void;

const listeners = new Set<DebugEventListener>();

/**
 * Subscribes a listener to all debug events.
 * Returns an unsubscribe function.
 */
export function subscribeDebug(listener: DebugEventListener): () => void {
  if (process.env.NODE_ENV === "production") {
    return () => {};
  }

  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Emits a debug event to all subscribers.
 * Internal use only from the framework.
 */
export function emitDebug(event: DebugEvent): void {
  if (process.env.NODE_ENV === "production") return;
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
}
