/**
 * @file mount.ts
 * @description
 * Mounting and unmounting entry points for Nebula’s component system.
 *
 * Mounting:
 *  - Clears the root
 *  - Executes the component
 *  - Stores its ComponentContext on the root
 *  - Inserts the resulting DOM node
 *
 * Unmounting:
 *  - Runs all disposers registered via `onCleanup`
 *  - Clears the DOM
 */

import { insert } from "./dom";
import { FrameworkComponent, renderComponent } from "./render";
import type { ComponentContext, Disposer } from "./context";
import { Debug } from "../debug/events";

declare global {
    interface HTMLElement {
        /** Internal: component context for the mounted component. */
        __ctx?: ComponentContext;
    }
}

/**
 * Mounts a component into a root element.
 *
 * @param component - The component to mount.
 * @param root - The DOM element to mount into.
 * @param props - Optional props passed to the component.
 */
export function mount(
    component: FrameworkComponent,
    root: HTMLElement,
    props?: any
): void {
    Debug.emit("component:mount", {
        component,
        root,
        props
    });

    root.innerHTML = "";

    const { node, ctx } = renderComponent(component, props);

    root.__ctx = ctx;

    insert(root, node);
}

/**
 * Unmounts the component currently mounted in the root element.
 *
 * Runs all cleanup functions and clears the DOM.
 *
 * @param root - The DOM element to unmount from.
 */
export function unmount(root: HTMLElement): void {
    const ctx = root.__ctx;

    Debug.emit("component:unmount", {
        root,
        context: ctx
    });

    if (ctx) {
        for (const dispose of ctx.disposers as Disposer[]) {
            try {
                Debug.emit("component:dispose", {
                    disposer: dispose,
                    context: ctx
                });
                dispose();
            } catch {
                // swallow user cleanup errors
            }
        }
        root.__ctx = undefined;
    }

    root.innerHTML = "";
}
