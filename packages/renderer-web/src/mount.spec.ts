/**
 * @file mount.test.ts
 * @group Renderer
 * @description
 * Tests for mount() and unmount(), ensuring root clearing, context storage,
 * cleanup execution, and correct DOM insertion.
 */

import { describe, it, expect } from "vitest";
import { mount, unmount } from "./mount";
import { renderComponent } from "./render";
import { component, onCleanup, onMounted } from "@terajs/runtime";
import { jsx } from "./jsx-runtime";
import { Portal } from "./portal";
import { signal } from "@terajs/reactivity";

describe("mount() / unmount()", () => {

    it("mount defaults to #app and auto-creates it when missing", () => {
        const existing = document.getElementById("app");
        existing?.remove();

        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "auto-root";
            return div;
        };

        const root = mount(Comp);

        expect(root.id).toBe("app");
        expect(document.body.contains(root)).toBe(true);
        expect(root.textContent).toBe("auto-root");

        unmount(root);
        root.remove();
    });

    it("mount accepts selector targets", () => {
        const root = document.createElement("div");
        root.id = "selector-root";
        document.body.appendChild(root);

        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "selector";
            return div;
        };

        const mountedRoot = mount(Comp, "#selector-root");

        expect(mountedRoot).toBe(root);
        expect(root.textContent).toBe("selector");

        unmount(root);
        root.remove();
    });

    it("mount supports custom default ids via options", () => {
        const existing = document.getElementById("terajs-root");
        existing?.remove();

        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "custom-default";
            return div;
        };

        const root = mount(Comp, {
            defaultId: "terajs-root"
        });

        expect(root.id).toBe("terajs-root");
        expect(root.textContent).toBe("custom-default");

        unmount(root);
        root.remove();
    });

    it("mount inserts component DOM into root", () => {
        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "hello";
            return div;
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("hello");
    });

    it("mount clears previous DOM", () => {
        const root = document.createElement("div");
        root.textContent = "old";

        const Comp = () => {
            const div = document.createElement("div");
            div.textContent = "new";
            return div;
        };

        mount(Comp, root);

        expect(root.textContent).toBe("new");
    });

    it("unmounts previous component before remounting", () => {
        let cleanupCalls = 0;

        const First = () => () => {
            onCleanup(() => cleanupCalls++);
            const div = document.createElement("div");
            div.textContent = "first";
            return div;
        };

        const Second = () => {
            const div = document.createElement("div");
            div.textContent = "second";
            return div;
        };

        const root = document.createElement("div");
        mount(First, root);
        mount(Second, root);

        expect(cleanupCalls).toBe(1);
        expect(root.textContent).toBe("second");
    });

    it("unmount runs cleanup and clears DOM", () => {
        let calls = 0;

        const Comp = () => {
            return () => {
                onCleanup(() => calls++);
                const div = document.createElement("div");
                div.textContent = "x";
                return div;
            };
        };

        const root = document.createElement("div");
        mount(Comp, root);

        expect(root.textContent).toBe("x");

        unmount(root);

        expect(calls).toBe(1);
        expect(root.textContent).toBe("");
    });

    it("runs onMounted hooks for runtime-wrapped components", () => {
        let mountedCalls = 0;

        const App = component({ name: "WrappedApp" }, () => {
            onMounted(() => {
                mountedCalls += 1;
            });

            return () => {
                const div = document.createElement("div");
                div.textContent = "wrapped";
                return div;
            };
        });

        const root = document.createElement("div");
        mount(App, root);

        expect(root.textContent).toBe("wrapped");
        expect(mountedCalls).toBe(1);
    });

    it("attaches live component context to rendered roots for DevTools", () => {
        const App = component({ name: "InspectableCard" }, (props: { enabled: boolean }) => {
            return () => {
                const article = document.createElement("article");
                article.textContent = props.enabled ? "enabled" : "disabled";
                return article;
            };
        });

        const root = document.createElement("div");
        mount(App, root, { enabled: true });

        const article = root.firstElementChild as (Element & { __terajsComponentContext?: { props?: unknown } }) | null;
        expect(article?.getAttribute("data-terajs-component-scope")).toBe("InspectableCard");
        expect(article?.getAttribute("data-terajs-component-instance")).toBe("1");
        expect(article?.__terajsComponentContext?.props).toEqual({ enabled: true });
    });

    it("preserves inner fragment component identity when an outer fragment component mounts around it", () => {
        const Page = component({
            name: "Page",
            meta: { title: "Docs route" },
            ai: { summary: "Docs summary" }
        }, () => {
            return () => {
                const fragment = document.createDocumentFragment();
                const hero = document.createElement("section");
                hero.id = "page-hero";
                hero.textContent = "hero";
                const body = document.createElement("section");
                body.id = "page-body";
                body.textContent = "body";
                fragment.append(hero, body);
                return fragment;
            };
        });

        const Layout = component({ name: "Layout" }, () => {
            return () => {
                const fragment = document.createDocumentFragment();
                fragment.appendChild(renderComponent(Page, {}).node);
                const footer = document.createElement("footer");
                footer.id = "layout-footer";
                footer.textContent = "footer";
                fragment.appendChild(footer);
                return fragment;
            };
        });

        const root = document.createElement("div");
        mount(Layout, root);

        const hero = root.querySelector("#page-hero") as (Element & { __terajsComponentContext?: { name?: string; meta?: unknown; ai?: unknown } }) | null;
        const body = root.querySelector("#page-body") as (Element & { __terajsComponentContext?: { name?: string } }) | null;
        const footer = root.querySelector("#layout-footer") as (Element & { __terajsComponentContext?: { name?: string } }) | null;

        expect(hero?.getAttribute("data-terajs-component-scope")).toBe("Page");
        expect(body?.getAttribute("data-terajs-component-scope")).toBe("Page");
        expect(hero?.__terajsComponentContext?.name).toBe("Page");
        expect(hero?.__terajsComponentContext?.meta).toEqual({ title: "Docs route" });
        expect(hero?.__terajsComponentContext?.ai).toEqual({ summary: "Docs summary" });
        expect(footer?.getAttribute("data-terajs-component-scope")).toBe("Layout");
        expect(footer?.__terajsComponentContext?.name).toBe("Layout");
    });

    it("mounts portal children into the document body by default", () => {
        const root = document.createElement("div");

        const Comp = () => jsx(Portal, {
            children: jsx("div", {
                id: "modal",
                children: "hello"
            })
        });

        mount(Comp, root);

        expect(root.textContent).toBe("");
        expect(document.body.querySelector("#modal")?.textContent).toBe("hello");

        unmount(root);

        expect(document.body.querySelector("#modal")).toBeNull();
    });

    it("mounts portal children into a selector target", () => {
        const root = document.createElement("div");
        const overlay = document.createElement("div");
        overlay.id = "overlay";
        document.body.appendChild(overlay);

        const Comp = () => jsx(Portal, {
            to: "#overlay",
            children: jsx("div", {
                id: "tooltip",
                children: "inside overlay"
            })
        });

        mount(Comp, root);

        expect(overlay.querySelector("#tooltip")?.textContent).toBe("inside overlay");

        unmount(root);
        overlay.remove();
    });

    it("reconciles portal content across reactive updates", () => {
        const root = document.createElement("div");
        const overlay = document.createElement("div");
        const message = signal("one");
        overlay.id = "overlay";
        document.body.appendChild(overlay);

        const Comp = () => () => jsx(Portal, {
            to: overlay,
            children: jsx("div", {
                class: "portal-value",
                children: message()
            })
        });

        mount(Comp, root);

        expect(overlay.textContent).toBe("one");
        expect(overlay.querySelectorAll(".portal-value")).toHaveLength(1);

        message.set("two");

        expect(overlay.textContent).toBe("two");
        expect(overlay.querySelectorAll(".portal-value")).toHaveLength(1);

        unmount(root);
        expect(overlay.textContent).toBe("");
        overlay.remove();
    });

});

