/**
 * @file model.ts
 * @description
 * Implements Nebula’s two‑way binding primitive.
 *
 * `model()` creates a `ref()` that stays synchronized with a parent
 * component’s prop. Updating the model updates the parent, and updating
 * the parent updates the model.
 *
 * This is the foundation for:
 * - form inputs
 * - controlled components
 * - two‑way binding patterns
 *
 * @example
 * ```ts
 * // Parent
 * const name = ref("Gabriel");
 * <Input model={name} />
 *
 * // Child
 * const name = model(props, "model");
 * name.value = "New Name"; // updates parent
 * ```
 */

import { ref, type Ref } from "./ref";
import { Debug } from "../debug/events";
/**
 * Creates a two‑way binding between a component prop and a local `ref()`.
 *
 * @typeParam T - The type of the bound value.
 * @param props - The component’s props object.
 * @param key - The prop key to bind.
 * @returns A `Ref<T>` synchronized with the parent.
 */
export function model<T>(props: any, key: string): Ref<T> {
    const initial = props[key];
    const r = ref(initial);

    Debug.emit("model:create", {
        key,
        initialValue: initial,
        ref: r
    });
    // Sync → parent
    const originalSet = r._sig.set;
    r._sig.set = (v: T) => {
        Debug.emit("model:update:child-to-parent", {
            key,
            newValue: v,
            ref: r
        });
        props[key] = v;
        originalSet(v);
    };

    // Sync ← parent
    Object.defineProperty(props, key, {
        get() {
            return r.value;
        },
        set(v) {
            Debug.emit("model:update:parent-to-child", {
                key,
                newValue: v,
                ref: r
            });
            r.value = v;
        }
    });

    return r;
}
