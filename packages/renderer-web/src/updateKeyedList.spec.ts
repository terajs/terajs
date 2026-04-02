import { describe, it, expect } from "vitest";
// FIXED: Path changed from ../src/renderer/ to ./
import { updateKeyedList, KeyedItem, MountFn, UnmountFn } from "./updateKeyedList";

function makeItem(key: any, text: string): KeyedItem {
    const node = document.createElement("div");
    node.textContent = text;
    return { key, node };
}

describe("updateKeyedList()", () => {
    it("mounts all items when old list is empty", () => {
        const parent = document.createElement("div");
        const oldItems: KeyedItem[] = [];
        const newItems = [makeItem(1, "a"), makeItem(2, "b")];

        // Types are now correctly inferred from the valid import
        const mount: MountFn = (item, p, anchor) => {
            p.insertBefore(item.node, anchor);
        };
        const unmount: UnmountFn = () => {};

        updateKeyedList(parent, oldItems, newItems, mount, unmount);

        expect(parent.textContent).toBe("ab");
    });

    it("removes all items when new list is empty", () => {
        const parent = document.createElement("div");
        const oldItems = [makeItem(1, "a"), makeItem(2, "b")];
        oldItems.forEach(i => parent.appendChild(i.node));

        const newItems: KeyedItem[] = [];

        const mount: MountFn = () => {};
        const unmount: UnmountFn = (item, p) => {
            p.removeChild(item.node);
        };

        updateKeyedList(parent, oldItems, newItems, mount, unmount);

        expect(parent.childNodes.length).toBe(0);
    });

    it("reorders items with minimal DOM movement", () => {
        const parent = document.createElement("div");
        const a = makeItem(1, "a");
        const b = makeItem(2, "b");
        const c = makeItem(3, "c");
        const d = makeItem(4, "d");

        const oldItems = [a, b, c, d];
        oldItems.forEach(i => parent.appendChild(i.node));

        const newItems = [d, b, a, c];

        const mount: MountFn = (item, p, anchor) => {
            p.insertBefore(item.node, anchor);
        };
        const unmount: UnmountFn = (item, p) => {
            p.removeChild(item.node);
        };

        updateKeyedList(parent, oldItems, newItems, mount, unmount);

        expect(parent.textContent).toBe("dbac");
        expect(parent.childNodes[0]).toBe(d.node);
        expect(parent.childNodes[1]).toBe(b.node);
        expect(parent.childNodes[2]).toBe(a.node);
        expect(parent.childNodes[3]).toBe(c.node);
    });

    it("handles insertions and deletions in the middle", () => {
        const parent = document.createElement("div");
        const a = makeItem(1, "a");
        const b = makeItem(2, "b");
        const d = makeItem(4, "d");

        const oldItems = [a, b, d];
        oldItems.forEach(i => parent.appendChild(i.node));

        const c = makeItem(3, "c");
        const newItems = [a, c, d];

        const mount: MountFn = (item, p, anchor) => {
            p.insertBefore(item.node, anchor);
        };
        const unmount: UnmountFn = (item, p) => {
            p.removeChild(item.node);
        };

        updateKeyedList(parent, oldItems, newItems, mount, unmount);

        expect(parent.textContent).toBe("acd");
        expect(parent.childNodes[0]).toBe(a.node);
        expect(parent.childNodes[1]).toBe(c.node);
        expect(parent.childNodes[2]).toBe(d.node);
    });
});