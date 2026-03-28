/**
 * @file reactive.ts
 * @description
 * Implements deep reactivity for objects and arrays using Nebula's
 * fine‑grained signal system.
 *
 * Each property becomes its own signal, enabling:
 *
 * ```ts
 * const user = reactive({
 *   name: "Gabriel",
 *   address: { city: "Beaverton" }
 * });
 *
 * effect(() => console.log(user.address.city));
 * user.address.city = "Portland"; // triggers only that effect
 * ```
 *
 * This avoids the pitfalls of Proxy‑only systems:
 * - no identity issues
 * - no deep Proxy recursion
 * - no over‑tracking
 * - no array mutation traps
 *
 * The system also supports *dynamic* deep reactivity:
 * - adding new properties later
 * - adding new nested objects later
 * - effects re-running to subscribe to new nested signals
 */

import { signal, type Signal } from "./signal";
import { Debug } from "../debug/events";

type AnyObj = Record<string | symbol, any>;

/** Determines if a value is a non-null object. */
function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null;
}

/**
 * Wraps a value in either:
 * - a nested reactive object (if object/array)
 * - a signal (if primitive)
 */
function wrap(value: any): any {
  if (isObject(value) || Array.isArray(value)) {
    return reactive(value);
  }
  return signal(value);
}

/**
 * A deeply reactive object.
 *
 * @template T - The shape of the original object.
 */
export type Reactive<T extends AnyObj> = T;

/**
 * Creates a deeply reactive object using signals-per-property.
 *
 * This supports:
 * - nested objects
 * - arrays
 * - dynamic property addition
 * - dynamic nested object addition
 *
 * @param obj - The source object to wrap.
 * @returns A Proxy that exposes reactive reads/writes.
 */
export function reactive<T extends AnyObj>(obj: T): Reactive<T> {
  Debug.emit("reactive:create", { source: obj });

  const store: AnyObj = {};

  // Initialize signals or nested reactive objects
  for (const key of Object.keys(obj)) {
    store[key] = wrap((obj as any)[key]);
  }

  return new Proxy(store, {
    get(target, prop, receiver) {
      let v = Reflect.get(target, prop, receiver);

      // Lazily create a signal for missing properties
      if (v === undefined && !(prop in target)) {
        const sig = signal(undefined);
        Reflect.set(target, prop, sig, receiver);
        v = sig;
      }

      // If it's a signal → return its value
      if (typeof v === "function" && "_dep" in v && "_value" in v) {
        Debug.emit("reactive:get", {
          target,
          prop,
          value: v(),
        });
        return (v as Signal<any>)();
      }
      Debug.emit("reactive:get", {
        target,
        prop,
        value: v,
      });

      return v;
    },

    set(target, prop, value, receiver) {
      const existing = Reflect.get(target, prop, receiver);

      // Existing signal → update it
      if (typeof existing === "function" && "_dep" in existing && "_value" in existing) {
        Debug.emit("reactive:set", {
          target,
          prop,
          oldValue: existing(),
          newValue: value,
          signal: existing,
        });

        if (isObject(value)) {
          (existing as Signal<any>).set(reactive(value));
        } else {
          (existing as Signal<any>).set(value);
        }
        return true;
      }

      // New property → wrap it and set it
      const wrapped = wrap(value);

      Debug.emit("reactive:set", {
        target,
        prop,
        oldValue: existing,
        newValue: wrapped,
      });

      Reflect.set(target, prop, wrapped, receiver);

      // If a lazy signal was created earlier, update it now
      const lazy = Reflect.get(target, prop, receiver);
      if (typeof lazy === "function" && "_dep" in lazy && "_value" in lazy) {
        (lazy as Signal<any>).set(wrapped);
      }

      return true;
    }
  }) as Reactive<T>;
}
