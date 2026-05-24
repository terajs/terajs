/**
 * @file contract.ts
 * @description
 * A contract is a shared reactive object passed explicitly between components.
 *
 * Contracts define a structured, reactive API shared between parent and child.
 */
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
export declare function contract<T extends object>(shape: T): Readonly<T>;
export declare namespace contract {
    var reactive: <T extends object>(shape: T) => Readonly<any>;
}
//# sourceMappingURL=contract.d.ts.map