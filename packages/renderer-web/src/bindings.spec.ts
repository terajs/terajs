import { describe, it, expect } from "vitest";
import { bindText, bindProp, bindClass, bindStyle } from "./bindings";
import { createText, createElement } from "./dom";
import { signal } from "../../reactivity/src/signal";

describe("bindings", () => {
    it("bindText updates when signal changes", () => {
        const count = signal(1);
        const node = createText("");

        bindText(node, () => count());

        expect(node.data).toBe("1");

        count.set(2);
        expect(node.data).toBe("2");
    });

    it("bindProp updates attributes reactively", () => {
        const id = signal("a");
        const el = createElement("div");

        bindProp(el, "id", () => id());

        expect(el.getAttribute("id")).toBe("a");

        id.set("b");
        expect(el.getAttribute("id")).toBe("b");
    });

    it("bindClass updates className reactively", () => {
        const active = signal(false);
        const el = createElement("div");

        bindClass(el, () => (active() ? "on" : "off"));

        expect(el.className).toBe("off");

        active.set(true);
        expect(el.className).toBe("on");
    });

    it("bindStyle updates inline styles reactively", () => {
        const color = signal("red");
        const el = createElement("div");

        bindStyle(el, () => ({ color: color() }));

        expect(el.style.color).toBe("red");

        color.set("blue");
        expect(el.style.color).toBe("blue");
    });
});
