/**
 * @file onCleanup.ts
 * @description
 * Registers cleanup functions for reactive effects.
 *
 * Cleanup functions run:
 * - before the effect re-executes
 * - when the effect is stopped
 * - when the owning component is disposed
 */
/**
 * Registers a cleanup function to be executed before the next run of the
 * currently active reactive effect.
 *
 * @param fn - The cleanup function to register.
 */
export declare function onEffectCleanup(fn: () => void): void;
//# sourceMappingURL=cleanup.d.ts.map