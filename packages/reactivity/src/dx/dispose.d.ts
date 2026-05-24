/**
 * @file dispose.ts
 * @description
 * Disposes of a reactive effect, unsubscribing it from all dependencies
 * and preventing future executions.
 *
 * This is essential for:
 * - component unmounting
 * - stopping watchers
 * - preventing ghost updates
 * - avoiding memory leaks
 */
import { type ReactiveEffect } from "../deps.js";
/**
 * Disposes of a reactive effect.
 *
 * Steps:
 * 1. Run cleanup functions
 * 2. Remove effect from all dependency sets
 * 3. Mark effect as inactive
 *
 * @param effectFn - The ReactiveEffect to dispose.
 */
export declare function dispose(effectFn: ReactiveEffect): void;
//# sourceMappingURL=dispose.d.ts.map