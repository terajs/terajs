/**
 * @file computed.ts
 * @description
 * A lazily evaluated, cached derived reactive value.
 *
 * The getter `fn` is wrapped in an internal effect so that:
 * - its dependencies are tracked
 * - when those dependencies change, the computed is marked "dirty"
 * - the value is recomputed on next access
 */

import { effect } from "./effect.js";
import { currentEffect, type ReactiveEffect, withDetachedCurrentEffect } from "./deps.js";
import { scheduleEffect } from "./effect.js";

import {
  addDependency,
  createReactiveMetadata,
  registerReactiveInstance,
  updateReactiveValue,
  Debug,
  getCurrentContext,
} from "@terajs/shared";

/**
 * A lazily evaluated, cached derived reactive value.
 *
 * The getter `fn` is wrapped in an internal effect so that:
 * - its dependencies are tracked
 * - when those dependencies change, the computed is marked "dirty"
 * - the value is recomputed on next access
 *
 * @typeParam T - The type of the computed value.
 */
export interface Computed<T> {
  /**
   * Returns the current computed value.
   *
   * - Recomputes the value if it is marked as dirty.
   * - Registers the current effect (if any) as a dependent of this computed.
   */
  get(): T;
}

/**
 * Optional metadata for derived values used by diagnostics and tooling.
 */
export interface ComputedOptions {
  /**
   * Stable label attached to the computed metadata when available.
   */
  key?: string;
}

/**
 * Creates a derived reactive value that is lazily evaluated and cached.
 *
 * @typeParam T - The type of the value returned by the computed function.
 * @param fn - The "getter" function that calculates the derived state.
 * @returns A `Computed<T>` object with a `get()` method to access the value.
 */
export function computed<T>(fn: () => T, options: ComputedOptions = {}): Computed<T> {
  let value: T;

  const ctx = getCurrentContext();
  const owner = ctx
    ? {
        scope: ctx.name,
        instance: ctx.instance
      }
    : undefined;
  const context = ctx
    ? {
        name: ctx.name,
        instance: ctx.instance
      }
    : undefined;
  const key = typeof options.key === "string" && options.key.trim().length > 0
    ? options.key.trim()
    : undefined;
  const scope = owner?.scope ?? "Computed";
  const instance = owner?.instance ?? 0;

  // Metadata + registry entry for this computed
  const meta = createReactiveMetadata({
    type: "computed",
    scope,
    instance,
    key
  });

  registerReactiveInstance(meta, owner);

  Debug.emit("computed:create", {
    type: "computed:create",
    timestamp: Date.now(),
    rid: meta.rid,
    meta,
    owner,
    context,
    key
  });

  Debug.emit("reactive:created", {
    type: "reactive:created",
    timestamp: Date.now(),
    meta
  });

  /**
   * Cache invalidation flag.
   * When true, the value must be re-calculated on the next access.
   */
  let dirty = true;

  /**
   * Subscriber set: tracks which effects depend on this computed value.
   */
  const deps = new Set<ReactiveEffect>();

  /**
   * Custom scheduler.
   *
   * Instead of immediately re-running the effect when a dependency changes,
   * we mark this computed as "dirty" and notify its own subscribers.
   */
  const scheduler = () => {
    dirty = true;

    // Trigger any effects that are watching this computed value
    const effectsToRun = new Set(deps);
    effectsToRun.forEach((dep) => {
      if (dep.scheduler) {
        dep.scheduler();
      } else {
        scheduleEffect(dep);
      }
    });
  };

  /**
   * Internal runner.
   *
   * Wraps the getter function in an effect to track its own internal dependencies.
   * We pass the `scheduler` so that dependency changes don't cause immediate re-runs,
   * but instead just trigger our "dirty" logic.
   */
  const runner = effect(
    () => {
      // Note: oldValue is captured here but we'll stick to your logic 
      // of just updating the value and marking it not dirty.
      value = fn();
      dirty = false;

      updateReactiveValue(meta.rid, value);

      Debug.emit("computed:recomputed", {
        type: "computed:recomputed",
        timestamp: Date.now(),
        rid: meta.rid,
        owner,
        context
      });
    },
    scheduler
  );

  /**
   * Public accessor for the computed value.
   * Handles both lazy evaluation and dependency registration.
   */
  function get(): T {
    // 1. Lazy evaluation: only run the inner function if the cache is stale.
    if (dirty) {
      if (currentEffect) {
        withDetachedCurrentEffect(() => runner());
      } else {
        runner();
      }
    }

    // 2. Dependency tracking: if this is called inside another effect,
    // register that effect as a subscriber to this computed value.
    if (currentEffect) {
      deps.add(currentEffect);
      currentEffect.deps.push(deps);

      // Graph edge: effect RID -> computed RID
      const from = (currentEffect as any)._meta?.rid as string | undefined;
      if (from) {
        addDependency(from, meta.rid);
      }

      Debug.emit("reactive:read", {
        type: "reactive:read",
        timestamp: Date.now(),
        rid: meta.rid
      });
    }

    return value;
  }

  return { get };
}
