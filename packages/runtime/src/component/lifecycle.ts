/**
 * @file lifecycle.ts
 * @description
 * Lifecycle registration utilities for Terajs components.
 */

import { emitDebug as emit } from "@terajs/shared";
import { 
  type ComponentContext,
  getCurrentContext
 } from "./context.js";

/**
 * Internal helper to ensure lifecycle arrays exist on the context.
 */
function ensureLifecycleArrays(ctx: ComponentContext) {
  if (!ctx.mounted) ctx.mounted = [];
  if (!ctx.updated) ctx.updated = [];
  if (!ctx.unmounted) ctx.unmounted = [];
}

/**
 * Register a callback to run after the component's DOM node is inserted.
 */
export function onMounted(fn: () => void): void {
  const ctx = getCurrentContext();
  if (!ctx) {
    throw new Error("onMounted() called outside of component setup.");
  }

  ensureLifecycleArrays(ctx);
  ctx.mounted!.push(fn);

  emit({
    type: "dom:updated", // Leveraging the shared event union
    rid: `${ctx.name}#${ctx.instance}`,
    nodeId: "lifecycle:mounted",
    timestamp: Date.now()
  });
}

/**
 * Register a callback to run after the component re-renders (template update).
 */
export function onUpdated(fn: () => void): void {
  const ctx = getCurrentContext();
  if (!ctx) {
    throw new Error("onUpdated() called outside of component setup.");
  }

  ensureLifecycleArrays(ctx);
  ctx.updated!.push(fn);

  // Debug event for update tracking
  emit({
    type: "reactive:updated",
    rid: `${ctx.name}#${ctx.instance}`,
    timestamp: Date.now()
  });
}

/**
 * Register a callback to run when the component is destroyed.
 */
export function onUnmounted(fn: () => void): void {
  const ctx = getCurrentContext();
  if (!ctx) {
    throw new Error("onUnmounted() called outside of component setup.");
  }

  ensureLifecycleArrays(ctx);
  ctx.unmounted!.push(fn);

  emit({
    type: "component:unmounted",
    scope: ctx.name,
    instance: ctx.instance,
    timestamp: Date.now()
  });
}
