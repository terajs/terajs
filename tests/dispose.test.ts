/**
 * @file dispose.test.ts
 * @group Reactivity
 * @description
 * Test suite validating the behavior of the `dispose()` function, which
 * terminates reactive effects and executes any registered cleanup
 * callbacks. Ensures that disposed effects no longer respond to state
 * changes and that cleanup functions run exactly once.
 */

import { describe, it, expect } from "vitest";
import { state } from "../src/reactivity/state";
import { effect } from "../src/reactivity/effect";
import { dispose } from "../src/dx/dispose";
import { onCleanup } from "../src/dx/cleanup";

describe("dispose()", () => {

    /**
     * @test Effect Termination
     * @description
     * Ensures that calling `dispose()` on an effect prevents it from
     * re-running when its dependencies change. This is essential for
     * avoiding memory leaks and stopping reactive computations that are
     * no longer needed.
     */
    it("stops an effect from running again", () => {
        const count = state(0);
        let calls = 0;

        const runner = effect(() => {
            calls++;
            count.get();
        });

        // Effect runs once immediately
        expect(calls).toBe(1);

        // Dispose the effect
        dispose(runner);

        // Changing state should NOT trigger the effect again
        count.set(1);
        expect(calls).toBe(1);
    });

    /**
     * @test Cleanup Execution
     * @description
     * Ensures that cleanup functions registered via `onCleanup()` inside
     * an effect are executed when the effect is disposed. This mirrors
     * the behavior of cleanup in component unmounting and dynamic
     * dependency switching.
     */
    it("runs cleanup functions on dispose", () => {
        const count = state(0);
        let cleanupCalls = 0;

        const runner = effect(() => {
            onCleanup(() => cleanupCalls++);
            count.get();
        });

        // Cleanup should not run until disposal
        expect(cleanupCalls).toBe(0);

        dispose(runner);

        // Cleanup should run exactly once
        expect(cleanupCalls).toBe(1);
    });

});
