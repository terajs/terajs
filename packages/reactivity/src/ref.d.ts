/**
 * @file ref.ts
 * @description
 * Public-facing reactive primitive for Terajs.
 *
 * A `ref()` wraps a primitive value in a fine-grained `signal()` and exposes
 * a `.value` getter/setter. This mirrors Vue's ergonomics while maintaining
 * Terajs's explicit signal semantics.
 *
 * `ref()` is ideal for:
 * - primitive values (number, string, boolean)
 * - form inputs
 * - component-local state
 * - two-way bindings via `model()`
 *
 * Debug integration:
 * - Creates metadata via `createReactiveMetadata()`
 * - Registers itself in the global reactive registry
 * - Emits typed debug events on read/write
 * - Participates in the dependency graph automatically
 */
import { type Signal } from "./signal.js";
/**
 * A boxed signal exposing a `.value` property.
 *
 * @typeParam T - The wrapped value type.
 */
export interface Ref<T> {
    /** Underlying fine-grained signal. */
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
 * This is a thin ergonomic layer over Terajs's core `signal()`:
 * - `.value` reads track dependencies
 * - `.value = x` triggers updates
 * - no deep reactivity is introduced
 *
 * Debug behavior:
 * - Emits `reactive:created`, `reactive:read`, `reactive:updated`
 * - Registers metadata + current value in the debug registry
 *
 * @param initial - Initial value for the ref.
 * @param options - Optional metadata for debugging and scoping.
 * @returns A reactive reference with a `.value` property.
 */
export declare function ref<T>(initial: T, options?: {
    scope?: string;
    instance?: number;
    key?: string;
    file?: string;
    line?: number;
    column?: number;
    composable?: string;
    group?: string;
}): Ref<T>;
//# sourceMappingURL=ref.d.ts.map