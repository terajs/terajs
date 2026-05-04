interface SharedDebugState {
  history: unknown[];
  listeners: Set<(event: unknown) => void>;
}

declare global {
  var __TERAJS_SHARED_DEBUG_STATE__: SharedDebugState | undefined;
}

export function getSharedDebugState(): SharedDebugState {
  if (!globalThis.__TERAJS_SHARED_DEBUG_STATE__) {
    globalThis.__TERAJS_SHARED_DEBUG_STATE__ = {
      history: [],
      listeners: new Set<(event: unknown) => void>()
    };
  }

  return globalThis.__TERAJS_SHARED_DEBUG_STATE__;
}