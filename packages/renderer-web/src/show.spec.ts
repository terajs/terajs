/**
 * @file show.test.ts
 * @group Renderer
 * @description
 * Tests for the <Show> control-flow component, verifying conditional
 * rendering, fallback behavior, and reactive updates.
 */

import { describe, it, expect } from "vitest";
import { Show } from "./controlFlow";
import { mount } from "./mount";
import { state } from "@terajs/reactivity";

describe("<Show>", () => {

    it("renders children when condition is truthy", () => {
        const visible = state(true);

        const Comp = () => {
            return Show({
                when: () => visible.get(),
                children: () => document.createTextNode("yes"),
                fallback: () => document.createTextNode("no")
            });
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("yes");
    });

    it("renders fallback when condition is falsy", () => {
        const visible = state(false);

        const Comp = () => {
            return Show({
                when: () => visible.get(),
                children: () => document.createTextNode("yes"),
                fallback: () => document.createTextNode("no")
            });
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("no");
    });

    it("reactively switches between children and fallback", () => {
        const visible = state(true);

        const Comp = () => {
            return Show({
                when: () => visible.get(),
                children: () => document.createTextNode("A"),
                fallback: () => document.createTextNode("B")
            });
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("A");

        visible.set(false);
        expect(root.textContent).toBe("B");

        visible.set(true);
        expect(root.textContent).toBe("A");
    });

});

