/**
 * @file reactivity-core.test.ts
 * @group Reactivity
 * @description
 * Comprehensive test suite validating Terajs’s fine‑grained reactivity engine.
 * Covers:
 *  - state primitives
 *  - effects and dependency tracking
 *  - cleanup behavior
 *  - computed memoization
 *  - watchEffect and disposal
 *  - SSR mode behavior
 *  - nested effect correctness
 *
 * This suite ensures the core reactive graph behaves predictably and efficiently.
 */

import { describe, it, expect } from "vitest";
import { effect } from "./effect";
import { state } from "./state";
import { computed } from "./computed";
import { onEffectCleanup } from "./dx/cleanup";
import { watchEffect } from "./dx/watchEffect";
import { setRuntimeMode } from "./dx/runtime";

describe("Reactivity Core", () => {

    // ---------------------------------------------------------------------
    // 1. STATE BASICS
    // ---------------------------------------------------------------------

    /**
     * @test State basic integrity
     * @description
     * Ensures the `state()` primitive maintains synchronous value consistency
     * and updates immediately when `.set()` is called.
     */
    it("state get/set works", () => {
        const count = state<number>(0);
        expect(count.get()).toBe(0);

        count.set(1);
        expect(count.get()).toBe(1);
    });

    // ---------------------------------------------------------------------
    // 2. EFFECT BASIC TRACKING
    // ---------------------------------------------------------------------

    /**
     * @test Automatic Dependency Tracking
     * @description
     * Verifies that `effect()` automatically tracks dependencies accessed
     * during execution and re-runs when those dependencies change.
     */
    it("effect runs when state changes", () => {
        const count = state<number>(0);
        let dummy = 0;

        effect(() => {
            dummy = count.get();
        });

        expect(dummy).toBe(0);

        count.set(5);
        expect(dummy).toBe(5);
    });

    // ---------------------------------------------------------------------
    // 3. COMPUTED VALUES
    // ---------------------------------------------------------------------

    /**
     * @test Memoization and Lazy Evaluation
     * @description
     * Validates that:
     *  1. computed values are lazy (not executed until `.get()` is called),
     *  2. cached values are reused when dependencies haven't changed,
     *  3. recomputation occurs only when dependencies update.
     */
    it("computed caches value and updates when dependencies change", () => {
        const count = state<number>(0);
        let computeRuns = 0;

        const double = computed(() => {
            computeRuns++;
            return count.get() * 2;
        });

        // Lazy: should not run until first .get()
        expect(computeRuns).toBe(0);

        expect(double.get()).toBe(0);
        expect(computeRuns).toBe(1);

        // Dependency changed → should invalidate but not recompute yet
        count.set(5);
        expect(computeRuns).toBe(1);

        // Now recompute
        expect(double.get()).toBe(10);
        expect(computeRuns).toBe(2);

        // Cached
        double.get();
        expect(computeRuns).toBe(2);
    });

    // ---------------------------------------------------------------------
    // 4. EFFECT CLEANUP
    // ---------------------------------------------------------------------

    /**
     * @test Dynamic Dependency Branching (Cleanup)
     * @description
     * Ensures effects unsubscribe from stale dependencies when switching
     * branches, preventing ghost updates from old reactive paths.
     */
    it("effect cleanup removes old dependencies", () => {
        const toggle = state<boolean>(true);
        const count = state<number>(0);
        let calls = 0;

        effect(() => {
            calls++;
            if (toggle.get()) {
                count.get();
            }
        });

        expect(calls).toBe(1);

        // count is tracked
        count.set(1);
        expect(calls).toBe(2);

        // switch branch → count should no longer be tracked
        toggle.set(false);
        expect(calls).toBe(3);

        count.set(2);
        expect(calls).toBe(3);
    });

    /**
     * @test Cleanup Execution Order
     * @description
     * Ensures cleanup functions registered via `onEffectCleanup()` run before
     * the next effect execution.
     */
    it("onEffectCleanup runs before next effect execution", () => {
        const count = state<number>(0);
        let cleanupCalls = 0;

        effect(() => {
            onEffectCleanup(() => cleanupCalls++);
            count.get();
        });

        expect(cleanupCalls).toBe(0);

        count.set(1);
        expect(cleanupCalls).toBe(1);

        count.set(2);
        expect(cleanupCalls).toBe(2);
    });

    // ---------------------------------------------------------------------
    // 5. WATCH EFFECT
    // ---------------------------------------------------------------------

    /**
     * @test watchEffect Re-Execution
     * @description
     * Ensures `watchEffect()` tracks dependencies and re-runs when they change.
     */
    it("watchEffect re-runs when dependencies change", () => {
        const count = state<number>(0);
        let calls = 0;

        watchEffect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        count.set(1);
        expect(calls).toBe(2);
    });

    /**
     * @test watchEffect Disposal
     * @description
     * Ensures the stop function returned by `watchEffect()` prevents further
     * re-runs and executes cleanup.
     */
    it("watchEffect stop function prevents further re-runs", () => {
        const count = state<number>(0);
        let calls = 0;

        const stop = watchEffect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        stop();
        count.set(1);

        expect(calls).toBe(1);
    });

    // ---------------------------------------------------------------------
    // 6. SSR MODE
    // ---------------------------------------------------------------------

    /**
     * @test SSR Mode Behavior
     * @description
     * Effects should not run in server mode. This ensures SSR safety and
     * prevents side effects during server rendering.
     */
    it("effects do not run in server mode", () => {
        setRuntimeMode("server");

        const count = state<number>(0);
        let calls = 0;

        effect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(0);

        // Reset mode for other tests
        setRuntimeMode("client");
    });

    // ---------------------------------------------------------------------
    // 7. NESTED EFFECTS
    // ---------------------------------------------------------------------

    /**
     * @test Nested Effects
     * @description
     * Ensures nested effects track dependencies independently and re-run
     * in the correct order when their respective dependencies change.
     */
    it("nested effects track correctly", () => {
        const a = state<number>(1);
        const b = state<number>(2);

        let outer = 0;
        let inner = 0;

        effect(() => {
            a.get();
            outer++;

            effect(() => {
                b.get();
                inner++;
            });
        });

        expect(outer).toBe(1);
        expect(inner).toBe(1);

        a.set(3);
        expect(outer).toBe(2);
        expect(inner).toBe(2);

        b.set(4);
        expect(inner).toBe(3);
    });

});
