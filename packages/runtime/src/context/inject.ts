/**
 * @file inject.ts
 * @description
 * Retrieves a value from the nearest ancestor context frame.
 */

import { emitDebug as emit } from "@terajs/shared";
import { contextStack, type ContextKey } from "./contextStack.js";

/**
 * Inject a value previously provided by an ancestor component.
 * Performs a reverse-order search through the context stack.
 */
export function inject<T>(key: ContextKey, fallback?: T): T {
  // Search from the current component upwards to the root
  for (let i = contextStack.length - 1; i >= 0; i--) {
    const frame = contextStack[i];
    if (frame.map.has(key)) {
      const value = frame.map.get(key) as T;

      emit({
        type: "dom:updated",
        rid: `context-lookup-${i}`,
        nodeId: "context:hit",
        timestamp: Date.now()
      });

      return value;
    }
  }

  // No provider found in the stack
  emit({
    type: "dom:updated",
    rid: "context-lookup-failed",
    nodeId: "context:miss",
    timestamp: Date.now()
  });

  // Check if a fallback was actually provided (even if the fallback is undefined)
  if (arguments.length === 2) {
    return fallback as T;
  }

  throw new Error(
    `Terajs inject(): no provider found for key. ` +
      `Either supply a fallback or ensure a matching provide() exists.`
  );
}
