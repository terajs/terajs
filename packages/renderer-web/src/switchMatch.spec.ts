/**
 * @file switch-match.test.ts
 * @group Renderer
 * @description
 * Tests for <Switch> and <Match>, verifying boolean matching, value-based
 * matching, fallback behavior, and reactive switching.
 */

import { describe, it, expect } from "vitest";
import { Switch, Match } from "./controlFlow";
import { mount } from "./mount";
import { state } from "../../reactivity/src/state";

describe("<Switch> / <Match>", () => {

    it("boolean matching selects first truthy Match", () => {
        const a = state(false);
        const b = state(true);

        const Comp = () => {
            return Switch({
                children: [
                    Match({ when: () => a.get(), children: () => document.createTextNode("A") }),
                    Match({ when: () => b.get(), children: () => document.createTextNode("B") }),
                ]
            });
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("B");
    });

    it("value-based matching selects correct Match", () => {
        const mode = state("edit");

        const Comp = () => {
            return Switch({
                value: () => mode.get(),
                children: [
                    Match({ when: "view", children: () => document.createTextNode("VIEW") }),
                    Match({ when: "edit", children: () => document.createTextNode("EDIT") }),
                ]
            });
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("EDIT");

        mode.set("view");
        expect(root.textContent).toBe("VIEW");
    });

    it("renders fallback when no Match matches", () => {
        const mode = state("x");

        const Comp = () => {
            return Switch({
                value: () => mode.get(),
                fallback: () => document.createTextNode("NONE"),
                children: [
                    Match({ when: "a", children: () => document.createTextNode("A") }),
                    Match({ when: "b", children: () => document.createTextNode("B") }),
                ]
            });
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("NONE");
    });

});
