/**
 * @file patchNode.test.ts
 * @description Tests for patching DOM nodes when UINodes change.
 */

import { describe, it, expect } from "vitest";
import { patchNode } from "../src/renderer/patchNode";
import { createNode } from "../src/renderer/createNode";
import { domMap } from "../src/renderer/domMap";
import { elNode } from "./testUtils";

describe("patchNode()", () => {
    it("replaces DOM node when types differ", () => {
        const parent = document.createElement("div");

        const oldVNode = elNode("div");
        const newVNode = elNode("span");

        const oldDom = createNode(oldVNode);
        parent.appendChild(oldDom);

        patchNode(parent, oldVNode, newVNode);

        const newDom = domMap.get(newVNode);
        expect(newDom instanceof HTMLElement).toBe(true);
        expect((newDom as HTMLElement).tagName.toLowerCase()).toBe("span");
        expect(parent.firstChild).toBe(newDom);
    });

    it("updates static props", () => {
        const parent = document.createElement("div");

        const oldVNode = elNode("div", { id: "old" });
        const newVNode = elNode("div", { id: "new" });

        const dom = createNode(oldVNode);
        parent.appendChild(dom);

        patchNode(parent, oldVNode, newVNode);

        expect((dom as HTMLElement).id).toBe("new");
    });

    it("removes old props", () => {
        const parent = document.createElement("div");

        const oldVNode = elNode("div", { id: "gone" });
        const newVNode = elNode("div", {});

        const dom = createNode(oldVNode);
        parent.appendChild(dom);

        patchNode(parent, oldVNode, newVNode);

        expect((dom as HTMLElement).hasAttribute("id")).toBe(false);
    });

    it("delegates children updates to patchChildren()", () => {
        const parent = document.createElement("div");

        const oldVNode = elNode("div", null, "old");
        const newVNode = elNode("div", null, "new");

        const dom = createNode(oldVNode);
        parent.appendChild(dom);

        patchNode(parent, oldVNode, newVNode);

        expect(dom.textContent).toBe("new");
    });
});
