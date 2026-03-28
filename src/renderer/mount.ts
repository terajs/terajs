import { insert } from "./dom";
import { FrameworkComponent, renderComponent } from "./render";
import type { ComponentContext, Disposer } from "./context";

declare global {
    interface HTMLElement {
        /** Internal: component context for the mounted component. */
        __ctx?: ComponentContext;
    }
}

/**
 * Mounts a component into a root element.
 * Clears the root, renders the component, and stores its context.
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
    root.innerHTML = "";

    const { node, ctx } = renderComponent(component, props);

    root.__ctx = ctx;

    insert(root, node);
}

/**
 * Unmounts the component currently mounted in the root element.
 * Runs all cleanup functions and clears the DOM.
 *
 * @param root - The DOM element to unmount from.
 */
export function unmount(root: HTMLElement): void {
    const ctx = root.__ctx;

    if (ctx) {
        for (const dispose of ctx.disposers as Disposer[]) {
            try {
                dispose();
            } catch {
                // swallow user cleanup errors
            }
        }
        root.__ctx = undefined;
    }

    root.innerHTML = "";
}
