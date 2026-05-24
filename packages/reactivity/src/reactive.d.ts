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
type AnyObj = Record<string | symbol, any>;
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
export declare function reactive<T extends AnyObj>(obj: T, options?: {
    scope?: string;
    instance?: number;
    file?: string;
    line?: number;
    column?: number;
    composable?: string;
    group?: string;
}): Reactive<T>;
export {};
//# sourceMappingURL=reactive.d.ts.map