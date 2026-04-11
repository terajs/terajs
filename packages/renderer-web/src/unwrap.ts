/**
 * @file unwrap.ts
 * @description
 * Central unwrapping logic for Terajs's renderer.
 *
 * This function normalizes any reactive value into a plain value:
 * - `ref()` -> returns `.value`
 * - raw signals -> calls the signal getter
 * - accessor functions -> calls the function
 * - everything else -> returned as-is
 *
 * The renderer uses `unwrap()` to ensure DOM bindings always receive
 * concrete values, not reactive wrappers.
 */

import { Debug } from "@terajs/shared";

/**
 * Normalizes a value by resolving signals, refs, or accessors.
 * * @param value - The value to unwrap.
 * @returns The resolved raw value.
 */
export function unwrap(value: any): any {
    // Ref (boxed signal)
    if (value && typeof value === "object" && "_sig" in value) {
        const out = value._sig();

        Debug.emit("unwrap:ref", {
            input: value,
            output: out
        });

        return out;
    }

    // Raw signal (internal reactivity check)
    if (typeof value === "function" && "_dep" in value && "_value" in value) {
        const out = value();

        Debug.emit("unwrap:signal", {
            input: value,
            output: out
        });

        return out;
    }

    // Accessor function (standard getter)
    if (typeof value === "function") {
        const out = value();

        Debug.emit("unwrap:accessor", {
            input: value,
            output: out
        });

        return out;
    }

    // Raw value
    Debug.emit("unwrap:raw", {
        input: value,
        output: value
    });

    return value;
}
