import { insert } from "./dom";
import {
    createComponentContext,
    setCurrentContext,
    getCurrentContext,
    ComponentContext,
} from "./context";
import { template, TemplateFn } from "./template";

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
    setCurrentContext(ctx);

    const out = component(props);

    let node: Node;

    if (out instanceof Node) {
        // Static component
        node = out;
    } else if (typeof out === "function") {
        // Reactive component — MUST run template() inside the component context
        node = template(out);
    } else {
        throw new Error("Invalid component return value.");
    }

    // Restore previous context AFTER template() has run
    setCurrentContext(prev);

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
    root.innerHTML = "";

    const { node, ctx } = renderComponent(component, props);

    (root as any).__ctx = ctx;

    insert(root, node);

    return ctx;
}
