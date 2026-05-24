/**
 * @file memo.ts
 * @description
 * Memoization helpers for shallow dependency comparison and explicit
 * static/shallow value markers.
 */
import { Ref } from "./ref.js";
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
export declare function memo<T>(key: symbol, fn: () => T, deps?: any[]): T;
/**
 * Marks an object/array as intentionally static for downstream consumers.
 *
 * @typeParam T Object type to mark.
 * @param obj Object or array to mark.
 * @returns The same instance with a non-enumerable static marker.
 */
export declare function markStatic<T extends object>(obj: T): T;
/**
 * Creates a shallow ref-like wrapper where only `.value` replacement is tracked.
 *
 * Nested object mutations are not automatically tracked.
 *
 * @typeParam T Wrapped value type.
 * @param value Initial value.
 * @returns Ref-compatible shallow wrapper.
 */
export declare function shallowRef<T>(value: T): Ref<T>;
//# sourceMappingURL=memo.d.ts.map