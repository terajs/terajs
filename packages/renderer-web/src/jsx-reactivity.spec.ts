import { describe, it, expect } from "vitest";
import { jsx } from "./jsx-runtime";
import { template } from "./template";
import { createText } from "./dom";
import { signal } from "@terajs/reactivity";

function appendValue(parent: HTMLElement, value: any): void {
    if (Array.isArray(value)) {
        value.forEach((item) => appendValue(parent, item));
        return;
    }

    if (value instanceof Node) {
        parent.appendChild(value);
        return;
    }

    if (value != null) {
        parent.appendChild(document.createTextNode(String(value)));
    }
}

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

    it("extracts named slot children for components", () => {
        const Card = (props: any) => {
            const el = document.createElement("section");
            const header = document.createElement("header");
            const body = document.createElement("div");
            appendValue(header, props.slots?.header?.());
            appendValue(body, props.children);
            el.append(header, body);
            return el;
        };

        const node = jsx(Card, {
            children: [
                jsx("h1", { slot: "header", children: "Title" }),
                jsx("p", { children: "Body" })
            ]
        }) as HTMLElement;

        expect(node.querySelector("header")?.textContent).toBe("Title");
        expect(node.querySelector("div")?.textContent).toBe("Body");
    });

    it("preserves explicit scoped slot functions on props.slots", () => {
        const List = (props: any) => {
            const el = document.createElement("div");
            appendValue(el, props.slots.item("Ada"));
            return el;
        };

        const node = jsx(List, {
            slots: {
                item: (value: string) => jsx("span", { children: value.toUpperCase() })
            }
        }) as HTMLElement;

        expect(node.textContent).toBe("ADA");
    });
});

