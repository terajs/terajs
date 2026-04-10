/**
 * @file provide.ts
 * @description
 * Registers a value in the current component's context frame.
 */

import { emitDebug as emit } from "@terajs/shared";
import { contextStack, type ContextKey } from "./contextStack.js";

/**
 * Provide a value to the current context frame.
 * If no frame exists, a root frame is created.
 */
export function provide<T>(key: ContextKey, value: T): void {
  const frame = contextStack[contextStack.length - 1];

  // Safety: If provide is called before any component is pushed, 
  // initialize a root context.
  if (!frame) {
    const root = { map: new Map<ContextKey, unknown>() };
    root.map.set(key, value);
    contextStack.push(root);

    emit({
      type: "dom:updated",
      rid: "context-root-init",
      nodeId: "context:provide:root",
      timestamp: Date.now()
    });

    return;
  }

  // Standard case: set value in the currently active component's frame
  frame.map.set(key, value);

  emit({
    type: "dom:updated",
    rid: `context-depth-${contextStack.length}`,
    nodeId: "context:provide",
    timestamp: Date.now()
  });
}
