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

import { afterEach, beforeEach, describe, it, expect } from "vitest";
import {
    createComponentContext,
    getAllReactives,
    getCurrentContext,
    getReactiveByRid,
    resetDebugRegistry,
    setCurrentContext,
    setReactiveValue
} from "@terajs/shared";
import { effect } from "./effect";
import { reactive } from "./reactive";
import { ref } from "./ref";
import { signal } from "./signal";
import { state } from "./state";
import { computed } from "./computed";
import { onEffectCleanup } from "./dx/cleanup";
import { watch } from "./dx/watch";
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

    it("propagates computed and watch updates from signals", () => {
        const count = signal(0);
        const step = signal(2);
        const double = computed(() => count() * step());
        const summary = signal("idle");

        const stop = watch(() => double.get(), (next, prev) => {
            summary.set(`${prev} -> ${next}`);
        });

        expect(double.get()).toBe(0);
        expect(summary()).toBe("idle");

        count.set(2);
        expect(double.get()).toBe(4);
        expect(summary()).toBe("0 -> 4");

        step.set(3);
        expect(double.get()).toBe(6);
        expect(summary()).toBe("4 -> 6");

        stop();
    });

    it("keeps computed runners alive across effect and watch updates", () => {
        const count = signal(0);
        const step = signal(2);
        const double = computed(() => count() * step());
        const summary = signal("idle");
        const audit = signal("idle");

        effect(() => {
            audit.set(`double=${double.get()}`);
        });

        const stop = watch(() => double.get(), (next, prev) => {
            summary.set(`${prev} -> ${next}`);
        });

        count.set(2);
        expect(double.get()).toBe(4);
        expect(audit()).toBe("double=4");
        expect(summary()).toBe("0 -> 4");

        step.set(3);
        expect(double.get()).toBe(6);
        expect(audit()).toBe("double=6");
        expect(summary()).toBe("4 -> 6");

        stop();
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

describe("Debug registry integration", () => {
    beforeEach(() => {
        resetDebugRegistry();
        setCurrentContext(null);
    });

    afterEach(() => {
        resetDebugRegistry();
        setCurrentContext(null);
    });

    it("inherits the active component context for component-local reactives", () => {
        const previousContext = getCurrentContext();
        const context = createComponentContext();
        context.name = "HomePage";
        context.instance = 7;

        setCurrentContext(context);

        try {
            signal(1, { key: "heroCount" });
            ref("ready", { key: "status" });
            reactive({ ready: true });

            const ownedEntries = getAllReactives().filter((candidate) =>
                candidate.owner?.scope === "HomePage"
                && candidate.owner.instance === 7
            );

            expect(ownedEntries.some((candidate) => candidate.meta.type === "signal" && candidate.meta.key === "heroCount")).toBe(true);
            expect(ownedEntries.some((candidate) => candidate.meta.type === "ref" && candidate.meta.key === "status")).toBe(true);
            expect(ownedEntries.some((candidate) => candidate.meta.type === "reactive" && candidate.meta.key === "ready" && candidate.currentValue === true)).toBe(true);
        } finally {
            setCurrentContext(previousContext);
        }
    });

    it("registers signals immediately with a live setter", () => {
        const count = signal(1, {
            scope: "Counter",
            instance: 1,
            key: "count"
        });

        const entry = getReactiveByRid(count._meta.rid);

        expect(entry?.currentValue).toBe(1);
        expect(typeof entry?.setValue).toBe("function");
        expect(setReactiveValue(count._meta.rid, 2)).toBe(true);
        expect(count()).toBe(2);
        expect(getReactiveByRid(count._meta.rid)?.currentValue).toBe(2);
    });

    it("registers refs immediately for DevTools inspection", () => {
        const count = ref(1, {
            scope: "Counter",
            instance: 1,
            key: "count"
        });

        const entry = getAllReactives().find((candidate) =>
            candidate.meta.scope === "Counter"
            && candidate.meta.instance === 1
            && candidate.meta.key === "count"
            && candidate.currentValue === 1
            && typeof candidate.setValue === "function"
        );

        expect(entry).toBeDefined();
        expect(setReactiveValue(entry!.meta.rid, 3)).toBe(true);
        expect(count.value).toBe(3);
    });

    it("registers reactive properties immediately for DevTools inspection", () => {
        const user = reactive({ name: "Ada" }, {
            scope: "ProfileCard",
            instance: 2
        });

        const entry = getAllReactives().find((candidate) =>
            candidate.meta.type === "reactive"
            && candidate.meta.scope === "ProfileCard"
            && candidate.meta.instance === 2
            && candidate.meta.key === "name"
            && candidate.currentValue === "Ada"
            && typeof candidate.setValue === "function"
        );

        expect(entry).toBeDefined();
        expect(setReactiveValue(entry!.meta.rid, "Grace")).toBe(true);
        expect(user.name).toBe("Grace");
    });
});
