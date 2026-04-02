/**
 * @file mount.test.ts
 * @group Renderer
 * @description
 * Tests for mount() and unmount(), ensuring root clearing, context storage,
 * cleanup execution, and correct DOM insertion.
 */

import { describe, it, expect } from "vitest";
import { mount, unmount } from "./mount";
import { onCleanup } from "@nebula/runtime";

describe("mount() / unmount()", () => {

    it("mount inserts component DOM into root", () => {
        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "hello";
            return div;
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("hello");
    });

    it("mount clears previous DOM", () => {
        const root = document.createElement("div");
        root.textContent = "old";

        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "new";
            return div;
        };

        mount(Comp, root);

        expect(root.textContent).toBe("new");
    });

    it("unmount runs cleanup and clears DOM", () => {
        let calls = 0;

        const Comp = () => {
            return () => {
                onCleanup(() => calls++);
                const div = document.createElement("div");
                div.textContent = "x";
                return div;
            };
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("x");

        unmount(root);

        expect(calls).toBe(1);
        expect(root.textContent).toBe("");
    });

});
