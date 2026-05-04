import type { DebugEvent } from "./types/events.js";
import { clearDebugHistory, readDebugHistory, recordDebugHistory } from "./history.js";
import { getSharedDebugState } from "./store.js";

/**
 * Simple in-memory pub/sub for debug events.
 * This is the central channel the rest of Terajs emits into.
 */
export type DebugEventListener = (event: DebugEvent) => void;

export interface SubscribeDebugOptions {
  replay?: boolean;
}

function listeners(): Set<DebugEventListener> {
  return getSharedDebugState().listeners as Set<DebugEventListener>;
}

/**
 * Subscribes a listener to all debug events.
 * Returns an unsubscribe function.
 */
export function subscribeDebug(listener: DebugEventListener, options?: SubscribeDebugOptions): () => void {
  if (process.env.NODE_ENV === "production") {
    return () => {};
  }

  const activeListeners = listeners();
  activeListeners.add(listener);

  if (options?.replay) {
    for (const event of readDebugHistory()) {
      try {
        listener(event as DebugEvent);
      } catch {
        // Swallow replay listener errors to keep debug tools non-fatal.
      }
    }
  }

  return () => activeListeners.delete(listener);
}

/**
 * Emits a debug event to all subscribers.
 * Internal use only from the framework.
 */
export function emitDebug(event: DebugEvent): void {
  if (process.env.NODE_ENV === "production") return;
  recordDebugHistory(event);
  const activeListeners = listeners();
  if (activeListeners.size === 0) return;
  for (const listener of activeListeners) {
    try {
      listener(event);
    } catch {
      // Swallow errors to avoid breaking app runtime from debug listeners.
    }
  }
}

export function getDebugListenerCount(): number {
  return listeners().size;
}

export function resetDebugListeners(): void {
  listeners().clear();
  clearDebugHistory();
}
