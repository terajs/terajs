/**
 * @file model.ts
 * @description
 * Implements Terajs's two-way binding primitive.
 *
 * `model()` creates a `ref()` that stays synchronized with a parent
 * component's prop. Updating the model updates the parent, and updating
 * the parent updates the model.
 *
 * This is the foundation for:
 * - form inputs
 * - controlled components
 * - two-way binding patterns
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
import { type Ref } from "./ref.js";
/**
 * Creates a two-way binding between a component prop and a local `ref()`.
 *
 * @typeParam T - The type of the bound value.
 * @param props - The component's props object.
 * @param key - The prop key to bind.
 * @returns A `Ref<T>` synchronized with the parent.
 */
export declare function model<T>(props: any, key: string): Ref<T>;
//# sourceMappingURL=model.d.ts.map