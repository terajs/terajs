import { describe, it, expect } from "vitest";
import { jsx } from "./jsx-runtime";
import { template } from "./template";
import { createText } from "./dom";
import { signal } from "@nebula/reactivity";

describe("JSX reactivity", () => {
    it("reactive text children update via template()", () => {
        const msg = signal("hello");

        const node = jsx("div", {
            children: template(() => createText(msg()))
        }) as HTMLElement;

        expect(node.textContent).toBe("hello");

        msg.set("world");
        expect(node.textContent).toBe("world");
    });

    it("reactive props update", () => {
        const id = signal("a");

        const el = jsx("div", {
            id: () => id()
        }) as HTMLElement;

        expect(el.getAttribute("id")).toBe("a");

        id.set("b");
        expect(el.getAttribute("id")).toBe("b");
    });

    it("reactive style updates", () => {
        const color = signal("red");

        const el = jsx("div", {
            style: () => ({ color: color() })
        }) as HTMLElement;

        expect(el.style.color).toBe("red");

        color.set("blue");
        expect(el.style.color).toBe("blue");
    });

    it("reactive class updates", () => {
        const active = signal(false);

        const el = jsx("div", {
            class: () => (active() ? "on" : "off")
        }) as HTMLElement;

        expect(el.className).toBe("off");

        active.set(true);
        expect(el.className).toBe("on");
    });
});
