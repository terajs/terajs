/**
 * @file memo.ts
 * @description
 * Memoization helpers for shallow dependency comparison and explicit
 * static/shallow value markers.
 */

import { Ref } from "./ref.js";

/**
 * Performs shallow equality checks for dependency arrays/objects.
 */
function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (a[k] !== b[k]) return false;
    return true;
  }
  return false;
}

const _memoCache = new Map<symbol, { lastDeps: any[]; lastValue: any }>();

/**
 * Memoizes a computed value by shallow-comparing dependency inputs.
 *
 * Callers must provide a stable symbol key per memoization context.
 *
 * @typeParam T Memoized value type.
 * @param key Stable symbol key for one memoization context.
 * @param fn Computation to execute when dependencies change.
 * @param deps Optional dependencies checked via shallow equality.
 * @returns Cached value when dependencies are unchanged; otherwise next computed value.
 */
export function memo<T>(key: symbol, fn: () => T, deps?: any[]): T {
  if (!deps || deps.length === 0) return fn();
  let state = _memoCache.get(key);
  if (!state || !shallowEqual(deps, state.lastDeps)) {
    state = { lastDeps: deps.slice(), lastValue: fn() };
    _memoCache.set(key, state);
  }
  return state.lastValue as T;
}

/**
 * Marks an object/array as intentionally static for downstream consumers.
 *
 * @typeParam T Object type to mark.
 * @param obj Object or array to mark.
 * @returns The same instance with a non-enumerable static marker.
 */
export function markStatic<T extends object>(obj: T): T {
  Object.defineProperty(obj, "__terajs_static__", { value: true, enumerable: false });
  return obj;
}

/**
 * Creates a shallow ref-like wrapper where only `.value` replacement is tracked.
 *
 * Nested object mutations are not automatically tracked.
 *
 * @typeParam T Wrapped value type.
 * @param value Initial value.
 * @returns Ref-compatible shallow wrapper.
 */
export function shallowRef<T>(value: T): Ref<T> {
  let _val = value;
  const refObj = {
    get value() { return _val; },
    set value(v) { _val = v; },
    _sig: undefined as any // Not a true signal, but for type compat
  } as Ref<T>;
  Object.defineProperty(refObj, "__terajs_shallow__", { value: true, enumerable: false });
  return refObj;
}
