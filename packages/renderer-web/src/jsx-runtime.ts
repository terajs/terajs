/**
 * @file jsx-runtime.ts
 * @description
 * Nebula’s JSX runtime — the bridge between JSX syntax and Nebula’s
 * fine‑grained DOM renderer.
 *
 * JSX compiles directly into:
 * - Native DOM nodes
 * - Reactive bindings
 * - Component executions
 *
 * No VDOM. No diffing. No re-renders.
 */

import { unwrap } from "./unwrap";
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

import { Debug } from "@nebula/shared";

/**
 * Special symbol used by JSX to represent a fragment.
 */
export const Fragment = Symbol("Nebula.Fragment");

/**
 * Normalize any JSX child into a concrete DOM Node.
 */
function normalizeChild(child: any): Node {
    child = unwrap(child);

    Debug.emit("jsx:normalize", {
        value: child
    });

    if (child == null || child === false || child === true) {
        return createText("");
    }

    if (typeof child === "string" || typeof child === "number") {
        return createText(String(child));
    }

    if (child instanceof Node) {
        return child;
    }

    if (typeof child === "function") {
        return normalizeChild(child());
    }

    throw new Error("Unsupported JSX child: " + child);
}

/**
 * Apply JSX props to a DOM element.
 */
function applyProps(el: HTMLElement, props: Record<string, any>) {
    Debug.emit("jsx:props", {
        el,
        props
    });

    for (const key in props) {
        const value = props[key];

        if (key === "children") continue;

        // Event handlers
        if (key.startsWith("on") && typeof value === "function") {
            const event = key.slice(2).toLowerCase();
            bindEvent(el, event, value);
            continue;
        }

        // Class
        if (key === "class" || key === "className") {
            if (typeof value === "function") bindClass(el, value);
            else el.className = unwrap(value);
            continue;
        }

        // Style
        if (key === "style") {
            if (typeof value === "function") bindStyle(el, value);
            else setStyle(el, unwrap(value));
            continue;
        }

        // Dynamic prop (accessor or ref)
        if (typeof value === "function" || (value && (value as any)._sig)) {
            bindProp(el, key, () => unwrap(value));
        } else {
            el.setAttribute(key, unwrap(value));
        }
    }
}

/**
 * JSX factory for single-child elements.
 */
export function jsx(type: any, props: any): Node {
    return createVNode(type, props);
}

/**
 * JSX factory for multi-child elements.
 */
export function jsxs(type: any, props: any): Node {
    return createVNode(type, props);
}

/**
 * Core JSX → DOM conversion.
 */
function createVNode(type: any, props: any): Node {
    props = props || {};

    Debug.emit("jsx:create", {
        type,
        props
    });

    // Fragment
    if (type === Fragment) {
        const frag = createFragment();

        Debug.emit("jsx:fragment", {
            fragment: frag,
            children: props.children
        });

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

    // Component
    if (typeof type === "function") {
        Debug.emit("jsx:component", {
            component: type,
            props
        });

        return type(props);
    }

    // Native DOM element
    const el = createElement(type);

    Debug.emit("jsx:element", {
        tag: type,
        el
    });

    applyProps(el, props);

    const children = props.children;

    Debug.emit("jsx:children", {
        parent: el,
        children
    });

    if (Array.isArray(children)) {
        for (const child of children) {
            insert(el, normalizeChild(child));
        }
    } else if (children != null) {
        insert(el, normalizeChild(children));
    }

    return el;
}