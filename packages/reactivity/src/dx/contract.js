/**
 * @file contract.ts
 * @description
 * A contract is a shared reactive object passed explicitly between components.
 *
 * Contracts define a structured, reactive API shared between parent and child.
 */
import { ref } from "../ref.js";
import { Debug } from "@terajs/shared";
import { debugInstrumentationEnabled } from "../debugRuntime.js";
/**
 * Creates an explicit contract object.
 *
 * This version does **not** auto-wrap primitives.
 * Use this when you want full control over reactivity.
 *
 * @typeParam T - The shape of the contract.
 * @param shape - An object defining shared state and behavior.
 * @returns A frozen contract object.
 */
export function contract(shape) {
    if (debugInstrumentationEnabled) {
        Debug.emit("contract:create", {
            kind: "explicit",
            shape
        });
    }
    return Object.freeze(shape);
}
/**
 * Creates a contract where primitive values are automatically wrapped in `ref()`.
 *
 * @typeParam T - The input shape.
 * @param shape - An object whose primitive values will be wrapped in refs.
 * @returns A frozen contract object with reactive primitives.
 */
contract.reactive = function (shape) {
    if (debugInstrumentationEnabled) {
        Debug.emit("contract:reactive:create", {
            shape
        });
    }
    const out = {};
    for (const key in shape) {
        const value = shape[key];
        if (isPrimitive(value)) {
            const wrapped = ref(value);
            if (debugInstrumentationEnabled) {
                Debug.emit("contract:reactive:wrap", {
                    key,
                    original: value,
                    wrapped
                });
            }
            out[key] = wrapped;
        }
        else {
            out[key] = value;
        }
    }
    return Object.freeze(out);
};
/**
 * Determines whether a value is a primitive.
 */
function isPrimitive(v) {
    return v === null || (typeof v !== "object" && typeof v !== "function");
}
