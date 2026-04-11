/**
 * @file component-lifecycle.test.ts
 * @group Renderer
 * @description
 * Tests for component execution context, cleanup behavior, nested cleanup,
 * and correct disposal on unmount.
 */

import { describe, it, expect } from "vitest";
import { mount, unmount } from "./mount";
import { onCleanup } from "@terajs/runtime";;
import { effect, state, dispose } from "@terajs/reactivity";

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

        // The template effect ALSO runs once
        expect(calls).toBe(1);

        unmount(root);

        count.set(1);

        // Only the template effect would have run, but it's disposed by unmount
        expect(calls).toBe(1);
    });



});

