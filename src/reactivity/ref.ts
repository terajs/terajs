/**
 * @file ref.ts
 * @description
 * Public-facing reactive primitive for Nebula.
 *
 * A `ref()` wraps a primitive value in a Proxy that exposes a `.value`
 * getter/setter. This provides an intuitive, Vue-like API while still
 * using Nebula’s fine‑grained signal system internally.
 *
 * `ref()` is ideal for:
 * - primitive values (numbers, strings, booleans)
 * - form inputs
 * - component-local state
 * - two‑way bindings via `model()`
 *
 * @example
 * ```ts
 * const count = ref(0);
 *
 * effect(() => {
 *   console.log("count is", count.value);
 * });
 *
 * count.value++; // triggers effect
 * ```
 */

import { signal, type Signal } from "./signal";
import { Debug } from "../debug/events";

/**
 * A boxed signal exposing a `.value` property.
 *
 * @typeParam T - The wrapped value type.
 */
export interface Ref<T> {
  /** The underlying fine‑grained signal. */
  readonly _sig: Signal<T>;

  /**
   * Reactive getter/setter for the value.
   *
   * Accessing `.value` tracks dependencies.
   * Assigning to `.value` triggers updates.
   */
  value: T;
}

/**
 * Creates a reactive reference around a primitive value.
 *
 * This is a thin ergonomic layer over Nebula’s core `signal()`:
 * - `.value` reads track dependencies
 * - `.value = x` triggers effects
 * - no deep reactivity is introduced
 *
 * @param initial - Initial value for the ref.
 * @returns A reactive reference with a `.value` property.
 */
export function ref<T>(initial: T): Ref<T> {
  const sig = signal(initial);

  Debug.emit("ref:create", {
    initialValue: initial,
    signal: sig
  });

  return new Proxy({ _sig: sig } as Ref<T>, {
    get(target, prop) {
      if (prop === "value") {
        const value = target._sig();
        Debug.emit("ref:get", {
          value,
          signal: target._sig
        });
        return target._sig();
      }
      return (target as any)[prop];
    },
    set(target, prop, value) {
      if (prop === "value") {
        const oldValue = target._sig();

        Debug.emit("ref:set", {
          oldValue,
          newValue: value,
          signal: target._sig
        });
        
        target._sig.set(value);
        return true;
      }
      (target as any)[prop] = value;
      return true;
    }
  });
}
