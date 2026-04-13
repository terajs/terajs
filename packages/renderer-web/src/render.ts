/**
 * @file render.ts
 * @description
 * Core component execution pipeline for Terajs.
 *
 * Components run inside a ComponentContext, which tracks disposers.
 * Components may return:
 * - A DOM Node (static component)
 * - A TemplateFn (reactive component)
 * - An AST (from SFC compiler)
 *
 * Reactive components are wrapped with `template()` to produce a DOM node
 * that updates automatically when dependencies change.
 */

import { insert, clear } from "./dom.js";
import {
    createComponentContext,
    setCurrentContext,
    getCurrentContext,
} from "@terajs/runtime";
import type { ComponentContext } from "@terajs/runtime";
import { template, type TemplateFn } from "./template.js";
import { Debug } from "@terajs/shared";

// AST to JSX adapter
import { renderAst } from "./astToJsx.js";
import type { ASTNode } from "@terajs/renderer";

const COMPONENT_SCOPE_ATTR = "data-terajs-component-scope";
const COMPONENT_INSTANCE_ATTR = "data-terajs-component-instance";

type InspectableComponentElement = Element & {
    __terajsComponentContext?: ComponentContext;
};

/**
 * A framework component.
 * It may return either:
 * - a DOM Node (static component)
 * - a TemplateFn (reactive component)
 * - an AST (SFC compiler output)
 */
export type FrameworkComponent = (props?: any) =>
    Node | TemplateFn | ASTNode;

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
    ctx.errorBoundary = prev?.errorBoundary;

    Debug.emit("component:render:start", {
        component,
        props,
        parentContext: prev
    });

    setCurrentContext(ctx);

    const out = component(props);

    let node: Node;

    // AST support
    if (isAst(out)) {
        Debug.emit("component:render:template", {
            component,
            templateFn: "AST"
        });

        // TemplateFn MUST be () => Node
        // So we close over ctx instead of passing it
        const fn: TemplateFn = () => {
            const jsx = renderAst(out, ctx); // AST -> JSX
            return jsx;                      // JSX -> DOM happens in template()
        };

        node = template(fn);
    }
    else if (out instanceof Node) {
        Debug.emit("component:render:static", {
            component,
            node: out
        });
        node = out;
    }
    else if (typeof out === "function") {
        Debug.emit("component:render:template", {
            component,
            templateFn: out
        });

        node = template(out);
    }
    else {
        const componentName = describeComponentName(component);
        const returnType = describeReturnValue(out);

        Debug.emit("error:renderer", {
            message: "Invalid component return value.",
            component: componentName,
            returnType,
            value: out
        });

        throw new Error(`Invalid component return value for ${componentName} (${returnType}).`);
    }

    if (process.env.NODE_ENV !== "production") {
        attachComponentIdentity(node, ctx);
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

function describeComponentName(component: FrameworkComponent): string {
    return typeof component === "function" && component.name
        ? component.name
        : "anonymous component";
}

function describeReturnValue(value: unknown): string {
    if (value === null) {
        return "null";
    }

    if (value === undefined) {
        return "undefined";
    }

    if (value instanceof Node) {
        return value.nodeName;
    }

    if (typeof value === "function") {
        return "function";
    }

    if (typeof value === "object") {
        const constructorName = (value as { constructor?: { name?: string } }).constructor?.name;
        return constructorName ? `object:${constructorName}` : "object";
    }

    return typeof value;
}

function attachComponentIdentity(node: Node, ctx: ComponentContext): void {
    if (
        !ctx.name
        || ctx.name === "Unknown"
        || !Number.isFinite(ctx.instance)
        || ctx.instance <= 0
    ) {
        return;
    }

    const scope = String(ctx.name);
    const instance = String(ctx.instance);

    if (node instanceof Element) {
        applyComponentIdentity(node, scope, instance, ctx);
        return;
    }

    if (node instanceof DocumentFragment) {
        for (const child of Array.from(node.childNodes)) {
            if (!(child instanceof Element)) {
                continue;
            }

            applyComponentIdentity(child, scope, instance, ctx);
        }
    }
}

function applyComponentIdentity(node: Element, scope: string, instance: string, ctx: ComponentContext): void {
    const element = node as InspectableComponentElement;

    if (element.hasAttribute(COMPONENT_SCOPE_ATTR) || element.hasAttribute(COMPONENT_INSTANCE_ATTR) || element.__terajsComponentContext) {
        return;
    }

    element.setAttribute(COMPONENT_SCOPE_ATTR, scope);
    element.setAttribute(COMPONENT_INSTANCE_ATTR, instance);
    element.__terajsComponentContext = ctx;
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

    // Clear root and notify debug
    Debug.emit("dom:clear", { el: root });
    clear(root);

    const { node, ctx } = renderComponent(component, props);

    (root as any).__ctx = ctx;

    insert(root, node);

    return ctx;
}

/** Type guard for AST nodes */
function isAst(value: any): value is ASTNode {
    if (!value || typeof value !== "object" || value instanceof Node) {
        return false;
    }

    return value.type === "element"
        || value.type === "text"
        || value.type === "interp"
        || value.type === "if"
        || value.type === "for"
        || value.type === "portal"
        || value.type === "slot";
}

