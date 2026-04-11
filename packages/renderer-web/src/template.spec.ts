/**
 * @file template.test.ts
 * @group Renderer
 * @description
 * Tests for the reactive `template()` system. Ensures DOM nodes update
 * correctly when signals change, nodes are replaced rather than mutated,
 * and cleanup is executed on unmount.
 */

import { describe, it, expect } from "vitest";
import { template } from "./template";
import { state } from "@terajs/reactivity";
import { mount, unmount } from "./mount";
import { onCleanup } from "@terajs/runtime";

describe("template()", () => {

    it("renders initial DOM node", () => {
        const count = state(0);

        const tpl = template(() => {
            const div = document.createElement("div");
            div.textContent = String(count.get());
            return div;
        });

        expect(tpl.textContent).toBe("0");
    });

    it("reactively updates DOM when dependencies change", () => {
        const count = state(0);

        const tpl = template(() => {
            const div = document.createElement("div");
            div.textContent = String(count.get());
            return div;
        });

        const root = document.createElement("div");
        root.appendChild(tpl);

        expect(root.textContent).toBe("0");

        count.set(5);
        expect(root.textContent).toBe("5");
    });

    it("replaces DOM node instead of mutating it", () => {
        const toggle = state(true);

        const tpl = template(() => {
            const el = document.createElement(toggle.get() ? "span" : "p");
            el.textContent = "x";
            return el;
        });

        const root = document.createElement("div");
        root.appendChild(tpl);

        const first = root.firstChild;
        expect(first?.nodeName).toBe("SPAN");

        toggle.set(false);

        const second = root.firstChild;
        expect(second?.nodeName).toBe("P");
        expect(second).not.toBe(first);
    });

    it("runs cleanup when unmounted", () => {
        let cleanupCalls = 0;

        const Component = () => {
            return () => {
                onCleanup(() => cleanupCalls++);
                const div = document.createElement("div");
                div.textContent = "x";
                return div;
            };
        };

        const root = document.createElement("div");
        mount(Component, root);

        expect(cleanupCalls).toBe(0);

        unmount(root);
        expect(cleanupCalls).toBe(1);
    });

});

