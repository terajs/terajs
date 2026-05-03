import { describe, expect, it } from "vitest";
import { bindDirectTextSource, bindText, bindProp, bindClass, bindStyle } from "./bindings";
import { createText, createElement, disposeNodeTree } from "./dom";
import { signal } from "@terajs/reactivity";

describe("bindings", () => {
        it("bindDirectTextSource updates when signal changes and stops after disposal", () => {
                const value = signal("one");
                const node = createText("");

                bindDirectTextSource(node, value);

                expect(node.data).toBe("one");

                value.set("two");
                expect(node.data).toBe("two");

                disposeNodeTree(node);
                value.set("three");
                expect(node.data).toBe("two");
        });

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

        expect(el.getAttribute("class")).toBe("off");

        active.set(true);
        expect(el.getAttribute("class")).toBe("on");
    });

    it("bindProp removes boolean attributes when false", () => {
        const enabled = signal(false);
        const el = createElement("button");

        bindProp(el, "disabled", () => enabled());

        expect(el.hasAttribute("disabled")).toBe(false);

        enabled.set(true);
        expect(el.hasAttribute("disabled")).toBe(true);

        enabled.set(false);
        expect(el.hasAttribute("disabled")).toBe(false);
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
