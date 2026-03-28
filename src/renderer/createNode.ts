import { UINode, UINodeFlags, ComponentFn, Fragment } from "../ui/node";
import { mount } from "./mount";
import { setProp } from "./setProp";
import { bindText } from "./patch";
import { effect } from "../reactivity/effect";
import { domMap } from "./domMap";
import { DomNode, ParentDomNode } from "./domTypes";

/**
 * Create a real DOM node from a Nebula `UINode`.
 *
 * @remarks
 * This is the core entry point for DOM creation in the renderer.
 * It handles:
 * - Text nodes (static + reactive)
 * - Elements
 * - Components
 * - Fragments
 *
 * Every created DOM node is stored in `domMap` so that the patcher
 * can later update, move, or remove it during reconciliation.
 *
 * @param node - The abstract UI node to convert.
 * @returns A real DOM `Node` instance.
 */
export function createNode(node: UINode): DomNode {
    const flags = node.flags ?? 0;

    // -------------------------------------------------------------
    // TEXT NODE
    // -------------------------------------------------------------
    if (flags & UINodeFlags.TEXT) {
        // Reactive text: children is a getter function
        if (typeof node.children === "function") {
            const text = document.createTextNode("");
            bindText(text, node.children as any);
   
            return text;
        }

        // Static text
        const text = document.createTextNode(node.children as string);

        return text;
    }

    // -------------------------------------------------------------
    // COMPONENT NODE
    // -------------------------------------------------------------
    if (flags & UINodeFlags.COMPONENT) {
        const component = node.type as ComponentFn;

        // Render the component into a child UINode
        const rendered = component(node.props ?? {});

        // Recursively create DOM for the rendered subtree
        const dom = createNode(rendered) as ParentDomNode;

        // Store the root DOM node for this component
        domMap.set(node, dom);
        return dom;
    }

    // -------------------------------------------------------------
    // FRAGMENT NODE
    // -------------------------------------------------------------
    if (flags & UINodeFlags.FRAGMENT || node.type === Fragment) {
        const frag = document.createDocumentFragment();
        domMap.set(node, frag);

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                mount(child, frag);
            }
        }

        return frag;
    }

    // -------------------------------------------------------------
    // ELEMENT NODE
    // -------------------------------------------------------------
    if (flags & UINodeFlags.ELEMENT && typeof node.type === "string") {
        const el = document.createElement(node.type);
        domMap.set(node, el);

        // -----------------------------
        // Props (static + reactive)
        // -----------------------------
        if (node.props) {
            for (const key in node.props) {
                const value = node.props[key];

                if (typeof value === "function") {
                    // Reactive prop: bind via effect()
                    bindProp(el, key, value);
                } else {
                    // Static prop
                    setProp(el, key, value);
                }
            }
        }

        // -----------------------------
        // Children
        // -----------------------------
        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                mount(child, el);
            }
        } else if (typeof node.children === "string") {
            el.textContent = node.children;
        } else if (typeof node.children === "function") {
            // Reactive text child
            const text = document.createTextNode("");
            bindText(text, node.children as any);
            el.appendChild(text);
        }

        return el;
    }

    throw new Error("Unsupported UINode type");
}

/**
 * Bind a reactive prop to a DOM element.
 *
 * @remarks
 * This attaches an effect that re-runs whenever the reactive
 * getter changes. The effect calls `setProp()` with the latest
 * value, ensuring DOM stays in sync with reactive state.
 *
 * @param el - The DOM element to update.
 * @param key - The prop name.
 * @param getter - A reactive getter returning the prop value.
 */
function bindProp(el: HTMLElement, key: string, getter: () => any): void {
    effect(() => {
        const value = getter();
        setProp(el, key, value);
    });
}
