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
import { signal } from "./signal.js";
import { debugInstrumentationEnabled, getProductionMetadataPlaceholder } from "./debugRuntime.js";
import { createReactiveMetadata, getCurrentComposable, getCurrentContext, registerReactiveInstance, updateReactiveValue, Debug } from "@terajs/shared";
import { analyzeReactivity } from "./analyzer.js";
/** Determines if a value is a non-null object. */
function isObject(value) {
    return typeof value === "object" && value !== null;
}
/**
 * Creates a signal + metadata + debug integration for a property.
 *
 * @typeParam T - The value type.
 * @param initial - Initial value for the property.
 * @param ctx - Metadata context (scope, instance, source location).
 * @param key - Optional property key for better identification.
 */
function createTrackedSignal(initial, ctx, key) {
    const globalLocation = typeof globalThis === "object" && globalThis !== null && "location" in globalThis
        ? globalThis.location
        : undefined;
    // Platform-agnostic dev check: works in Node, browser, and any bundler
    // @ts-expect-error: __DEV__ and process may not be typed, but this is safe
    const isDev = (typeof __DEV__ !== "undefined" && __DEV__)
        || globalLocation?.hostname === "localhost"
        || false;
    if (isDev) {
        analyzeReactivity(initial, ctx);
    }
    const meta = debugInstrumentationEnabled
        ? createReactiveMetadata({
            type: "reactive",
            scope: ctx.scope,
            instance: ctx.instance,
            key,
            file: ctx.file,
            line: ctx.line,
            column: ctx.column,
            composable: ctx.composable ?? getCurrentComposable() ?? undefined,
            group: ctx.group,
        })
        : getProductionMetadataPlaceholder("reactive");
    const sig = signal(initial, {
        scope: ctx.scope,
        instance: ctx.instance,
        key,
        file: ctx.file,
        line: ctx.line,
        column: ctx.column,
        composable: ctx.composable ?? getCurrentComposable() ?? undefined,
        group: ctx.group
    });
    sig._meta = meta;
    if (debugInstrumentationEnabled) {
        registerReactiveInstance(meta, { scope: ctx.scope, instance: ctx.instance }, {
            setValue: (next) => sig.set(next)
        });
        updateReactiveValue(meta.rid, initial);
        Debug.emit("reactive:created", {
            type: "reactive:created",
            timestamp: Date.now(),
            meta
        });
    }
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
function wrap(value, ctx, key) {
    if (isObject(value) || Array.isArray(value)) {
        return reactive(value, ctx);
    }
    return createTrackedSignal(value, ctx, key);
}
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
export function reactive(obj, options) {
    const currentContext = getCurrentContext();
    const ctx = {
        scope: options?.scope ?? currentContext?.name ?? "UnknownScope",
        instance: options?.instance ?? currentContext?.instance ?? 0,
        file: options?.file,
        line: options?.line,
        column: options?.column,
        composable: options?.composable,
        group: options?.group
    };
    // Root object metadata (for grouping/inspection)
    const rootMeta = debugInstrumentationEnabled
        ? createReactiveMetadata({
            type: "reactive",
            scope: ctx.scope,
            instance: ctx.instance,
            file: ctx.file,
            line: ctx.line,
            column: ctx.column
        })
        : getProductionMetadataPlaceholder("reactive");
    if (debugInstrumentationEnabled) {
        Debug.emit("reactive:created", {
            type: "reactive:created",
            timestamp: Date.now(),
            meta: rootMeta
        });
    }
    const store = {};
    // Initialize signals or nested reactive objects
    for (const key of Object.keys(obj)) {
        store[key] = wrap(obj[key], ctx, key);
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
                const sig = v;
                const value = sig();
                if (debugInstrumentationEnabled) {
                    Debug.emit("reactive:read", {
                        type: "reactive:read",
                        timestamp: Date.now(),
                        rid: sig._meta?.rid ?? rootMeta.rid
                    });
                }
                return value;
            }
            return v;
        },
        set(target, prop, value, receiver) {
            const existing = Reflect.get(target, prop, receiver);
            // Existing signal -> update it (preserve nested reactive behavior)
            if (typeof existing === "function" && "_dep" in existing && "_value" in existing) {
                const sig = existing;
                const prev = sig();
                // If a plain object/array is assigned later, make it reactive
                if (isObject(value) || Array.isArray(value)) {
                    sig.set(reactive(value, ctx));
                }
                else {
                    sig.set(value);
                }
                if (debugInstrumentationEnabled) {
                    updateReactiveValue(sig._meta?.rid ?? rootMeta.rid, sig());
                    Debug.emit("reactive:updated", {
                        type: "reactive:updated",
                        timestamp: Date.now(),
                        rid: sig._meta?.rid ?? rootMeta.rid,
                        prev,
                        next: sig()
                    });
                }
                return true;
            }
            // New property -> wrap it and set it
            const wrapped = wrap(value, ctx, String(prop));
            Reflect.set(target, prop, wrapped, receiver);
            return true;
        }
    });
}
