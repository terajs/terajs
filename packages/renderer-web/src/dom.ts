/**
 * @file dom.ts
 * @description
 * Platform‑specific DOM operations for Nebula’s renderer.
 *
 * Nebula does NOT use a virtual DOM. These operations directly mutate the DOM
 * to ensure maximum performance and minimal memory overhead.
 */

import { Debug } from "@nebula/shared";
import { unwrap } from "./unwrap"; 

/**
 * Create a DOM element node.
 */
export function createElement(type: string): HTMLElement {
    const el = document.createElement(type);

    Debug.emit("dom:create", {
        kind: "element",
        type,
        node: el
    });

    return el;
}

/**
 * Create a DOM text node.
 */
export function createText(value: string): Text {
    const node = document.createTextNode(value);

    Debug.emit("dom:create", {
        kind: "text",
        value,
        node
    });

    return node;
}

/**
 * Create a DocumentFragment.
 */
export function createFragment(): DocumentFragment {
    const frag = document.createDocumentFragment();

    Debug.emit("dom:create", {
        kind: "fragment",
        node: frag
    });

    return frag;
}

/**
 * Insert a child node into a parent before an optional anchor.
 */
export function insert(parent: Node, child: Node, anchor: Node | null = null): void {
    Debug.emit("dom:insert", {
        parent,
        child,
        anchor
    });

    parent.insertBefore(child, anchor);
}

/**
 * Remove a DOM node from its parent.
 */
export function remove(node: Node): void {
    const parent = node.parentNode;
    
    Debug.emit("dom:remove", {
        node,
        parent
    });

    if (parent) parent.removeChild(node);
}

/**
 * Update the text content of a Text node.
 */
export function setText(node: Text, value: any): void {
    const v = String(unwrap(value));

    Debug.emit("dom:update", {
        kind: "text",
        node,
        value: v
    });

    node.data = v;
}

/**
 * Set or update a property on an HTMLElement.
 */
export function setProp(el: HTMLElement, name: string, value: any): void {
    const v = unwrap(value);

    Debug.emit("dom:update", {
        kind: "prop",
        el,
        name,
        value: v
    });

    if (v == null) {
        el.removeAttribute(name);
        return;
    }

    if (typeof v === "boolean") {
        if (v) el.setAttribute(name, "");
        else el.removeAttribute(name);
        return;
    }

    el.setAttribute(name, String(v));
}

/**
 * Apply a style object to an HTMLElement.
 */
export function setStyle(el: HTMLElement, style: Record<string, string>): void {
    Debug.emit("dom:update", {
        kind: "style",
        el,
        style
    });

    for (const key in style) {
        el.style[key as any] = style[key];
    }
}

/**
 * Set the class attribute on an element.
 */
export function setClass(el: HTMLElement, className: string): void {
    Debug.emit("dom:update", {
        kind: "class",
        el,
        className
    });

    el.className = className;
}

/**
 * Add an event listener to an element.
 */
export function addEvent(el: HTMLElement, name: string, handler: EventListener): void {
    Debug.emit("dom:update", {
        kind: "event:add",
        el,
        name,
        handler
    });

    el.addEventListener(name, handler);
}

/**
 * Remove an event listener from an element.
 */
export function removeEvent(el: HTMLElement, name: string, handler: EventListener): void {
    Debug.emit("dom:update", {
        kind: "event:remove",
        el,
        name,
        handler
    });

    el.removeEventListener(name, handler);
}