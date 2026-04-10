/**
 * @file memo.ts
 * Terajs memoization utility for shallowly caching computed results.
 * DX-first: simple, ergonomic, and works with signals, refs, or plain values.
 *
 * Usage:
 *   const m = memo(() => expensiveFn(a(), b.value));
 *   // Only recomputes if a() or b.value changes (shallow compare)
 *
 *   <Memo deps={[a, b]}>{([a, b]) => expensiveFn(a, b)}</Memo>
 */

import { Signal } from "./signal.js";
import { Ref } from "./ref.js";

/**
 * Shallow equality check for arrays/objects.
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

// DX-correct: static cache per call site (symbol key)
const _memoCache = new Map<symbol, { lastDeps: any[]; lastValue: any }>();

/**
 * Memoizes the result of a function, recomputing only if shallow deps change.
 * Each call site should provide a unique symbol as the first argument for correct isolation.
 *
 * @param key - Unique symbol for this memoization context (use: const key = Symbol('desc'))
 * @param fn - Function to memoize
 * @param deps - Optional array of dependencies (signals, refs, or values)
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
 * Mark an object/array as static (non-reactive).
 *
 * @param obj - The object or array to mark static
 * @returns The same object, marked as static
 * @example
 *   const arr = markStatic([1,2,3]);
 */
export function markStatic<T extends object>(obj: T): T {
  Object.defineProperty(obj, "__terajs_static__", { value: true, enumerable: false });
  return obj;
}

/**
 * Shallow ref: only .value is reactive, not nested.
 *
 * @param value - The value to wrap
 * @returns A shallow ref object
 * @example
 *   const s = shallowRef({a:1});
 *   s.value = ...
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
