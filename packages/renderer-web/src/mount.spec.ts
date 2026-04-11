/**
 * @file mount.test.ts
 * @group Renderer
 * @description
 * Tests for mount() and unmount(), ensuring root clearing, context storage,
 * cleanup execution, and correct DOM insertion.
 */

import { describe, it, expect } from "vitest";
import { mount, unmount } from "./mount";
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

