/**
 * @file contextStack.ts
 * @description
 * Internal context stack used by Terajs's runtime to support
 * provide() / inject() without prop drilling or compiler magic.
 */

import { emitDebug as emit } from "@terajs/shared";

/**
 * Allowed key types for context entries.
 * Using a Map allows for non-string keys like Symbols or Objects.
 */
export type ContextKey = string | symbol | object | Function;

/**
 * A single context frame associated with a component boundary.
 */
export interface ContextFrame {
  map: Map<ContextKey, unknown>;
}

/**
 * Global stack of context frames.
 * The top of the stack represents the currently executing component.
 */
export const contextStack: ContextFrame[] = [];

/**
 * Push a new context frame onto the stack.
 */
export function pushContextFrame(): void {
  const frame: ContextFrame = { map: new Map() };
  contextStack.push(frame);

  emit({
    type: "dom:updated", // Re-using a generic update event for context tracking
    rid: `context-depth-${contextStack.length}`,
    nodeId: "context:push",
    timestamp: Date.now()
  });
}

/**
 * Pop the current context frame.
 */
export function popContextFrame(): void {
  const frame = contextStack.pop();

  emit({
    type: "dom:updated",
    rid: `context-depth-${contextStack.length}`,
    nodeId: "context:pop",
    timestamp: Date.now()
  });
}
