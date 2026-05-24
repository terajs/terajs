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
import { signal } from "./signal.js";
import { debugInstrumentationEnabled, getProductionMetadataPlaceholder } from "./debugRuntime.js";
import { createReactiveMetadata, getCurrentComposable, getCurrentContext, registerReactiveInstance, updateReactiveValue, Debug } from "@terajs/shared";
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
export function ref(initial, options) {
    const currentContext = getCurrentContext();
    const scope = options?.scope ?? currentContext?.name ?? "UnknownScope";
    const instance = options?.instance ?? currentContext?.instance ?? 0;
    // Create metadata for this ref
    const meta = debugInstrumentationEnabled
        ? createReactiveMetadata({
            type: "ref",
            scope,
            instance,
            key: options?.key,
            file: options?.file,
            line: options?.line,
            column: options?.column,
            composable: options?.composable ?? getCurrentComposable() ?? undefined,
            group: options?.group
        })
        : getProductionMetadataPlaceholder("ref");
    // Create the underlying signal
    const sig = signal(initial, {
        scope,
        instance,
        key: options?.key,
        file: options?.file,
        line: options?.line,
        column: options?.column,
        composable: options?.composable,
        group: options?.group
    });
    const refObj = { _sig: sig };
    const applyRefValue = (next) => {
        const prev = sig();
        sig.set(next);
        if (debugInstrumentationEnabled) {
            updateReactiveValue(meta.rid, next);
            Debug.emit("reactive:updated", {
                type: "reactive:updated",
                timestamp: Date.now(),
                rid: meta.rid,
                prev,
                next
            });
        }
    };
    if (debugInstrumentationEnabled) {
        registerReactiveInstance(meta, { scope, instance }, {
            setValue: (next) => {
                applyRefValue(next);
            }
        });
        updateReactiveValue(meta.rid, initial);
        // Emit creation event after the live DevTools setter is registered.
        Debug.emit("reactive:created", {
            type: "reactive:created",
            timestamp: Date.now(),
            meta
        });
    }
    return new Proxy(refObj, {
        get(target, prop) {
            if (prop === "value") {
                const value = target._sig();
                if (debugInstrumentationEnabled) {
                    Debug.emit("reactive:read", {
                        type: "reactive:read",
                        timestamp: Date.now(),
                        rid: meta.rid
                    });
                }
                return value;
            }
            return target[prop];
        },
        set(target, prop, value) {
            if (prop === "value") {
                applyRefValue(value);
                return true;
            }
            target[prop] = value;
            return true;
        }
    });
}
