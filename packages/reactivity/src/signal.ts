/**
 * @file signal.ts
 * Core fine-grained reactive primitive for Terajs.
 *
 * Fully integrated with the Terajs Debug Core:
 * - metadata creation
 * - reactive registry
 * - dependency graph
 * - typed debug events
 */

import { currentEffect } from "./deps.js";
import type { ReactiveEffect } from "./deps.js";
import { scheduleEffect } from "./effect.js";
import { debugInstrumentationEnabled, getProductionMetadataPlaceholder } from "./debugRuntime.js";

import {
  createReactiveMetadata,
  registerReactiveInstance,
  updateReactiveValue,
  emitDebug,
  addDependency
} from "@terajs/shared";

import type { ReactiveMetadata } from "@terajs/shared";

const signalRegistry = new Set<WeakRef<Signal<unknown>>>();
const signalFinalizer = new FinalizationRegistry<WeakRef<Signal<unknown>>>((ref) => {
  signalRegistry.delete(ref);
});

function registerActiveSignal<T>(sig: Signal<T>): void {
  const ref = new WeakRef(sig);
  signalRegistry.add(ref);
  signalFinalizer.register(sig, ref);
}

/**
 * Returns the currently live, debug-registered signals.
 *
 * Signals are tracked through weak references, so entries for collected
 * signals are removed as the registry is traversed.
 *
 * @returns A snapshot of active signals that still have live references.
 */
export function getActiveSignals(): Signal<unknown>[] {
  if (!debugInstrumentationEnabled) {
    return [];
  }

  const active: Signal<unknown>[] = [];

  for (const ref of Array.from(signalRegistry)) {
    const signal = ref.deref();
    if (signal) {
      active.push(signal);
    } else {
      signalRegistry.delete(ref);
    }
  }

  return active;
}

/**
 * A reactive signal holding a value of type T.
 */
export interface Signal<T> {
  (): T;
  set(value: T): void;
  update(fn: (value: T) => T): void;

  /** Internal fields */
  _value: T;
  _dep: Set<ReactiveEffect>;
  _meta: ReactiveMetadata;
}

/**
 * Create a reactive signal.
 *
 * @param value - The initial value.
 * @param options - Configuration for debugging and scoping.
 */
export function signal<T>(
  value: T,
  options?: {
    scope?: string;
    instance?: number;
    key?: string;
    file?: string;
    line?: number;
    column?: number;
  }
): Signal<T> {
  const scope = options?.scope ?? "UnknownScope";
  const instance = options?.instance ?? 0;

  // Create metadata for this signal
  const meta: ReactiveMetadata = debugInstrumentationEnabled
    ? createReactiveMetadata({
        type: "ref",
        scope,
        instance,
        key: options?.key,
        file: options?.file,
        line: options?.line,
        column: options?.column
      })
    : getProductionMetadataPlaceholder("ref");

  const sig = function () {
    // Track dependency if inside an effect
    if (currentEffect) {
      sig._dep.add(currentEffect);

      if (!currentEffect.deps.includes(sig._dep)) {
        currentEffect.deps.push(sig._dep);
      }

      // Add to dependency graph: effect RID -> signal RID
      const from = (currentEffect as any)._meta?.rid as string | undefined;
      if (debugInstrumentationEnabled && from) {
        addDependency(from, meta.rid);
      }

      if (debugInstrumentationEnabled) {
        emitDebug({
          type: "reactive:read",
          timestamp: Date.now(),
          rid: meta.rid
        });
      }
    }

    return sig._value;
  } as Signal<T>;

  sig._value = value;
  sig._dep = new Set<ReactiveEffect>();
  sig._meta = meta;

  if (debugInstrumentationEnabled && typeof options?.key === "string" && options.key.length > 0) {
    registerActiveSignal(sig);
  }

  /**
   * Updates the signal's value and notifies all dependents.
    *
    * @param next - The new value to set.
   */
  sig.set = (next: T) => {
    const prev = sig._value;

    // IMPORTANT: Only notify dependents when value actually changes
    if (Object.is(prev, next)) return;

    sig._value = next;

    if (debugInstrumentationEnabled) {
      updateReactiveValue(meta.rid, next);

      emitDebug({
        type: "reactive:updated",
        timestamp: Date.now(),
        rid: meta.rid,
        prev,
        next
      });
    }

    // Trigger effects
    const subs = Array.from(sig._dep);
    for (const eff of subs) {
      if (eff.scheduler) {
        eff.scheduler();
      } else {
        scheduleEffect(eff);
      }
    }
  };

  if (debugInstrumentationEnabled) {
    registerReactiveInstance(meta, { scope, instance }, {
      setValue: (next) => sig.set(next as T)
    });

    // Track the initial value once the debug registry can mutate the signal.
    updateReactiveValue(meta.rid, value);

    emitDebug({
      type: "reactive:created",
      timestamp: Date.now(),
      meta
    });
  }

  /**
   * Updates the signal's value using a transformation function.
    *
    * @param fn - A function that takes the current value and returns a new one.
   */
  sig.update = (fn) => sig.set(fn(sig._value));

  return sig;
}
