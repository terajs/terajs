/**
 * @file reactive.ts
 * @description
 * Implements deep reactivity for objects and arrays using Terajs's
 * fine-grained signal system.
 *
 * Each property becomes its own signal, enabling:
 *
 * ```ts
 * const user = reactive({
 * name: "Gabriel",
 * address: { city: "Beaverton" }
 * });
 *
 * effect(() => console.log(user.address.city));
 * user.address.city = "Portland"; // triggers only that effect
 * ```
 *
 * This avoids the pitfalls of Proxy-only systems:
 * - no identity issues
 * - no deep Proxy recursion
 * - no over-tracking
 * - no array mutation traps
 *
 * The system also supports *dynamic* deep reactivity:
 * - adding new properties later
 * - adding new nested objects later
 * - effects re-running to subscribe to new nested signals
 */

import { signal, type Signal } from "./signal.js";
import {
  createReactiveMetadata,
  registerReactiveInstance,
  updateReactiveValue,
  Debug
} from "@terajs/shared";
import { analyzeReactivity } from "./analyzer.js";

import type { ReactiveMetadata } from "@terajs/shared";

type AnyObj = Record<string | symbol, any>;

/** Determines if a value is a non-null object. */
function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null;
}

/**
 * Context passed down for metadata (scope/instance/file/etc.).
 */
interface WrapContext {
  scope: string;
  instance: number;
  file?: string;
  line?: number;
  column?: number;
}

/**
 * Creates a signal + metadata + debug integration for a property.
 *
 * @typeParam T - The value type.
 * @param initial - Initial value for the property.
 * @param ctx - Metadata context (scope, instance, source location).
 * @param key - Optional property key for better identification.
 */
function createTrackedSignal<T>(
  initial: T,
  ctx: WrapContext,
  key?: string
): Signal<T> {
  const globalLocation = typeof globalThis === "object" && globalThis !== null && "location" in globalThis
    ? (globalThis as typeof globalThis & {
        location?: { hostname?: unknown };
      }).location
    : undefined;
  // Platform-agnostic dev check: works in Node, browser, and any bundler
  // @ts-expect-error: __DEV__ and process may not be typed, but this is safe
  const isDev = (typeof __DEV__ !== "undefined" && __DEV__)
    || globalLocation?.hostname === "localhost"
    || false;
  if (isDev) {
    analyzeReactivity(initial, ctx);
  }

  const meta: ReactiveMetadata = createReactiveMetadata({
    type: "reactive",
    scope: ctx.scope,
    instance: ctx.instance,
    key,
    file: ctx.file,
    line: ctx.line,
    column: ctx.column
  });

  const sig = signal(initial, {
    scope: ctx.scope,
    instance: ctx.instance,
    key,
    file: ctx.file,
    line: ctx.line,
    column: ctx.column
  });

  (sig as any)._meta = meta;

  registerReactiveInstance(meta, { scope: ctx.scope, instance: ctx.instance });
  updateReactiveValue(meta.rid, initial);

  Debug.emit("reactive:created", {
    type: "reactive:created",
    timestamp: Date.now(),
    meta
  });

  return sig;
}

/**
 * Wraps a value in either:
 * - a nested reactive object (if object/array)
 * - a tracked signal (if primitive)
 *
 * @param value - The value to wrap.
 * @param ctx - Metadata context.
 * @param key - Optional property key.
 */
function wrap(value: any, ctx: WrapContext, key?: string): any {
  if (isObject(value) || Array.isArray(value)) {
    return reactive(value as AnyObj, ctx);
  }
  return createTrackedSignal(value, ctx, key);
}

/**
 * A deeply reactive object.
 *
 * @typeParam T - The shape of the original object.
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
 * It also ensures that nested reactive objects added later still
 * participate in dependency tracking, so patterns like:
 *
 * ```ts
 * const obj = reactive({});
 *
 * effect(() => {
 * obj.nested?.value;
 * });
 *
 * obj.nested = reactive({ value: 1 });
 * obj.nested.value = 2; // effect runs again
 * ```
 *
 * behave as expected.
 *
 * @param obj - The source object to wrap.
 * @param options - Optional metadata for debugging and scoping.
 * @returns A Proxy that exposes reactive reads/writes.
 */
export function reactive<T extends AnyObj>(
  obj: T,
  options?: {
    scope?: string;
    instance?: number;
    file?: string;
    line?: number;
    column?: number;
  }
): Reactive<T> {
  const ctx: WrapContext = {
    scope: options?.scope ?? "UnknownScope",
    instance: options?.instance ?? 0,
    file: options?.file,
    line: options?.line,
    column: options?.column
  };

  // Root object metadata (for grouping/inspection)
  const rootMeta: ReactiveMetadata = createReactiveMetadata({
    type: "reactive",
    scope: ctx.scope,
    instance: ctx.instance,
    file: ctx.file,
    line: ctx.line,
    column: ctx.column
  });

  Debug.emit("reactive:created", {
    type: "reactive:created",
    timestamp: Date.now(),
    meta: rootMeta
  });

  const store: AnyObj = {};

  // Initialize signals or nested reactive objects
  for (const key of Object.keys(obj)) {
    store[key] = wrap((obj as any)[key], ctx, key);
  }

  return new Proxy(store, {
    get(target, prop, receiver) {
      let v = Reflect.get(target, prop, receiver);

      // Lazily create a signal for missing properties
      if (v === undefined && !(prop in target)) {
        v = wrap(undefined, ctx, String(prop));
        Reflect.set(target, prop, v, receiver);
      }

      // If it's a signal -> return its value
      if (typeof v === "function" && "_dep" in v && "_value" in v) {
        const sig = v as Signal<any>;
        const value = sig();

        Debug.emit("reactive:read", {
          type: "reactive:read",
          timestamp: Date.now(),
          rid: (sig as any)._meta?.rid ?? rootMeta.rid
        });

        return value;
      }

      return v;
    },

    set(target, prop, value, receiver) {
      const existing = Reflect.get(target, prop, receiver);

      // Existing signal -> update it (preserve nested reactive behavior)
      if (typeof existing === "function" && "_dep" in existing && "_value" in existing) {
        const sig = existing as Signal<any>;
        const prev = sig();

        // If a plain object/array is assigned later, make it reactive
        if (isObject(value) || Array.isArray(value)) {
          sig.set(reactive(value as AnyObj, ctx));
        } else {
          sig.set(value);
        }

        updateReactiveValue((sig as any)._meta?.rid ?? rootMeta.rid, sig());

        Debug.emit("reactive:updated", {
          type: "reactive:updated",
          timestamp: Date.now(),
          rid: (sig as any)._meta?.rid ?? rootMeta.rid,
          prev,
          next: sig()
        });

        return true;
      }

      // New property -> wrap it and set it
      const wrapped = wrap(value, ctx, String(prop));
      Reflect.set(target, prop, wrapped, receiver);

      return true;
    }
  }) as Reactive<T>;
}
