/**
 * @file render.ts
 * @description
 * Core component execution pipeline for Nebula.
 *
 * Components run inside a ComponentContext, which tracks disposers.
 * Components may return:
 *  - A DOM Node (static component)
 *  - A TemplateFn (reactive component)
 *
 * Reactive components are wrapped with `template()` to produce a DOM node
 * that updates automatically when dependencies change.
 */

import { insert } from "./dom";
import {
    createComponentContext,
    setCurrentContext,
    getCurrentContext,
    ComponentContext,
} from "./context";
import { template, TemplateFn } from "./template";
import { Debug } from "../debug/events";

/**
 * A framework component.
 * It may return either:
 *  - a DOM Node (static component)
 *  - a TemplateFn (reactive component)
 */
export type FrameworkComponent = (props?: any) => Node | TemplateFn;

/**
 * Result of rendering a component.
 */
export interface RenderResult {
    /** The DOM node produced by the component. */
    node: Node;
    /** The component's execution context. */
    ctx: ComponentContext;
}

/**
 * Executes a component inside a fresh component context.
 *
 * @param component - The component function to execute.
 * @param props - Optional props passed to the component.
 * @returns The rendered DOM node and the component context.
 */
export function renderComponent(
    component: FrameworkComponent,
    props?: any
): RenderResult {
    const ctx = createComponentContext();
    const prev = getCurrentContext();

    Debug.emit("component:render:start", {
        component,
        props,
        parentContext: prev
    });

    setCurrentContext(ctx);

    const out = component(props);

    let node: Node;

    if (out instanceof Node) {
        Debug.emit("component:render:static", {
            component,
            node: out
        });
        node = out;
    } else if (typeof out === "function") {
        Debug.emit("component:render:template", {
            component,
            templateFn: out
        });

        // Reactive component — MUST run template() inside the component context
        node = template(out);
    } else {
        throw new Error("Invalid component return value.");
    }

    // Restore previous context AFTER template() has run
    setCurrentContext(prev);

    Debug.emit("component:render:end", {
        component,
        node,
        context: ctx
    });

    return { node, ctx };
}

/**
 * Renders a component into a root element.
 * Clears the root, renders the component, and stores its context.
 *
 * @param component - The component to render.
 * @param root - The DOM element to render into.
 * @param props - Optional props passed to the component.
 * @returns The component context.
 */
export function renderIntoRoot(
    component: FrameworkComponent,
    root: HTMLElement,
    props?: any
): ComponentContext {
    Debug.emit("component:render:root", {
        component,
        root,
        props
    });

    root.innerHTML = "";

    const { node, ctx } = renderComponent(component, props);

    (root as any).__ctx = ctx;

    insert(root, node);

    return ctx;
}
