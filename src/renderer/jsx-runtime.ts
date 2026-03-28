/**
 * @file jsx-runtime.ts
 * @description
 * Nebula’s JSX runtime — the bridge between JSX and the fine‑grained DOM renderer.
 *
 * This file defines:
 * - `jsx`  → for elements with a single child
 * - `jsxs` → for elements with multiple children
 * - `Fragment`
 *
 * Nebula does NOT use a virtual DOM. JSX elements are turned directly into:
 * - DOM nodes
 * - reactive bindings
 * - nested component executions
 *
 * This runtime is intentionally minimal and renderer‑agnostic.
 */

import {
    createElement,
    createText,
    createFragment,
    insert,
    setStyle,
} from "./dom";

import {
    bindText,
    bindProp,
    bindClass,
    bindStyle,
    bindEvent,
} from "./bindings";

/**
 * Fragment symbol used by JSX.
 */
export const Fragment = Symbol("Nebula.Fragment");

/**
 * Normalize a child into a DOM node.
 *
 * @param child - Any JSX child value.
 * @returns A DOM node.
 */
function normalizeChild(child: any): Node {
    if (child == null || child === false || child === true) {
        return createText("");
    }

    if (typeof child === "string" || typeof child === "number") {
        return createText(String(child));
    }

    // Already a DOM node
    if (child instanceof Node) {
        return child;
    }

    // Component function
    if (typeof child === "function") {
        return child();
    }

    throw new Error("Unsupported JSX child: " + child);
}

/**
 * Apply props to an element.
 *
 * @param el - The element to update.
 * @param props - The props object from JSX.
 */
function applyProps(el: HTMLElement, props: Record<string, any>) {
    for (const key in props) {
        const value = props[key];

        // Children handled separately
        if (key === "children") continue;

        // Event handlers: onClick → click
        if (key.startsWith("on") && typeof value === "function") {
            const event = key.slice(2).toLowerCase();
            bindEvent(el, event, value);
            continue;
        }

        // Class
        if (key === "class" || key === "className") {
            if (typeof value === "function") {
                bindClass(el, value);
            } else {
                el.className = value;
            }
            continue;
        }

        // Style
        if (key === "style") {
            if (typeof value === "function") {
                bindStyle(el, value);
            } else {
                setStyle(el, value);
            }
            continue;
        }

        // Dynamic prop
        if (typeof value === "function") {
            bindProp(el, key, value);
        } else {
            el.setAttribute(key, value);
        }
    }
}

/**
 * Create a DOM node from JSX.
 *
 * @param type - HTML tag name, Fragment, or component function.
 * @param props - Props object.
 * @returns A DOM node.
 */
export function jsx(type: any, props: any): Node {
    return createVNode(type, props);
}

/**
 * Same as `jsx` but used when JSX has multiple children.
 */
export function jsxs(type: any, props: any): Node {
    return createVNode(type, props);
}

/**
 * Core JSX → DOM conversion.
 *
 * @param type - Element type (string, Fragment, or component).
 * @param props - Props object.
 * @returns A DOM node.
 */
function createVNode(type: any, props: any): Node {
    props = props || {};

    // -------------------------------------------------------------
    // 1. Fragment
    // -------------------------------------------------------------
    if (type === Fragment) {
        const frag = createFragment();
        const children = props.children;

        if (Array.isArray(children)) {
            for (const child of children) {
                insert(frag, normalizeChild(child));
            }
        } else if (children != null) {
            insert(frag, normalizeChild(children));
        }

        return frag;
    }

    // -------------------------------------------------------------
    // 2. Component
    // -------------------------------------------------------------
    if (typeof type === "function") {
        return type(props);
    }

    // -------------------------------------------------------------
    // 3. Native DOM element
    // -------------------------------------------------------------
    const el = createElement(type);

    applyProps(el, props);

    const children = props.children;

    if (Array.isArray(children)) {
        for (const child of children) {
            insert(el, normalizeChild(child));
        }
    } else if (children != null) {
        insert(el, normalizeChild(children));
    }

    return el;
}
