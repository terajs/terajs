/**
 * @file createNode.test.ts
 */

import { describe, it, expect } from "vitest";
import { createNode } from "../src/renderer/createNode";
import { domMap } from "../src/renderer/domMap";
import { textNode, elNode, fragNode, compNode } from "./testUtils";

describe("createNode()", () => {
    it("creates a Text node for TEXT UINode", () => {
        const vnode = textNode("hello");
        const dom = createNode(vnode);

        expect(dom.nodeType).toBe(Node.TEXT_NODE);
        expect(dom.textContent).toBe("hello");
        expect(domMap.has(vnode)).toBe(false);
    });

    it("creates an HTMLElement for ELEMENT UINode", () => {
        const vnode = elNode("div");
        const dom = createNode(vnode);

        expect(dom instanceof HTMLElement).toBe(true);
        expect((dom as HTMLElement).tagName.toLowerCase()).toBe("div");
        expect(domMap.get(vnode)).toBe(dom);
    });

    it("creates a DocumentFragment for FRAGMENT UINode", () => {
        const vnode = fragNode([]);
        const dom = createNode(vnode);

        expect(dom instanceof DocumentFragment).toBe(true);
        expect(domMap.get(vnode)).toBe(dom);
    });

    it("component nodes produce parent DOM nodes", () => {
        const Component = () => elNode("span");

        const vnode = compNode(Component);
        const dom = createNode(vnode);

        expect(dom instanceof HTMLElement).toBe(true);
        expect((dom as HTMLElement).tagName.toLowerCase()).toBe("span");
        expect(domMap.get(vnode)).toBe(dom);
    });
});
