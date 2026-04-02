/**
 * @file batch.spec.ts
 * @group Renderer
 * @description
 * Tests for component execution context, cleanup behavior, nested cleanup,
 * and the current behavior of effects inside components.
 *
 * NOTE:
 * These tests document the *actual* behavior of the current runtime.
 * In particular, effects created inside components do not automatically
 * stop running after unmount unless explicitly disposed.
 */

import { describe, it, expect } from "vitest";
import { mount, unmount } from "./mount";
import { state } from "../../reactivity/src/state";
import { onCleanup } from "@nebula/runtime";
import { effect, dispose } from "@nebula/reactivity";

describe("Component Lifecycle", () => {

    it("runs cleanup on unmount", () => {
        let calls = 0;

        const Comp = () => {
            return () => {
                onCleanup(() => calls++);
                return document.createElement("div");
            };
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(calls).toBe(0);

        unmount(root);
        expect(calls).toBe(1);
    });

    it("nested components run cleanup in correct order", () => {
        const events: string[] = [];

        const Child = () => {
            return () => {
                onCleanup(() => events.push("child"));
                return document.createElement("span");
            };
        };

        const Parent = () => {
            onCleanup(() => events.push("parent"));
            return Child();
        };

        const root = document.createElement("div");
        mount(Parent, root);

        unmount(root);

        expect(events).toEqual(["parent", "child"]);
    });
    it("effects inside components stop running after unmount", () => {
        const count = state(0);
        let calls = 0;

        const Comp = () => {
            return () => {
                const runner = effect(() => {
                    count.get();
                    calls++;
                });

                onCleanup(() => dispose(runner));

                return document.createElement("div");
            };
        };

        const root = document.createElement("div");
        mount(Comp, root);

        // Effect runs once on initial mount
        expect(calls).toBe(1);

        unmount(root);

        // Trigger state update after unmount
        count.set(1);

        // Effect should NOT run after unmount
        expect(calls).toBe(1);
    });

});
