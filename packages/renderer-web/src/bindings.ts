/**
 * @file bindings.ts
 * @description
 * Fine-grained DOM bindings for Terajs's reactive renderer.
 *
 * These helpers connect reactive expressions (signals, memos, accessors)
 * to DOM updates. Each binding registers a reactive effect that updates
 * only the affected DOM node - no virtual DOM, no diffing.
 *
 * This is the same model used by SolidJS and Vue Vapor Mode.
 */

import { effect } from "@terajs/reactivity";
import { unwrap } from "./unwrap.js";
import {
    setText,
    setProp,
    setStyle,
    setClass,
    addEvent,
    removeEvent,
} from "./dom.js";
import { Debug } from "@terajs/shared";

/**
 * Bind a reactive expression to a Text node.
 *
 * @param node - The Text node to update.
 * @param compute - A function returning the latest text value.
 */
export function bindText(node: Text, compute: () => any): void {
    Debug.emit("binding:create", {
        type: "text",
        node,
    });

    effect(() => {
        const value = unwrap(compute());

        Debug.emit("binding:update", {
            type: "text",
            node,
            value,
        });

        setText(node, value);
    });
}

/**
 * Bind a reactive expression to an element attribute/property.
 *
 * @param el - The element to update.
 * @param name - The attribute or property name.
 * @param compute - A function returning the latest value.
 */
export function bindProp(
    el: Element,
    name: string,
    compute: () => any
): void {
    Debug.emit("binding:create", {
        type: "prop",
        el,
        name,
    });

    effect(() => {
        const value = unwrap(compute());

        Debug.emit("binding:update", {
            type: "prop",
            el,
            name,
            value,
        });

        setProp(el, name, value);
    });
}

/**
 * Bind a reactive expression to an element's class attribute.
 *
 * @param el - The element to update.
 * @param compute - A function returning the class string or class object.
 */
export function bindClass(
    el: Element,
    compute: () => any
): void {
    Debug.emit("binding:create", {
        type: "class",
        el,
    });

    effect(() => {
        const value = unwrap(compute());

        Debug.emit("binding:update", {
            type: "class",
            el,
            value,
        });

        setClass(el, value);
    });
}

/**
 * Bind a reactive expression to an element's inline styles.
 *
 * @param el - The element to update.
 * @param compute - A function returning a style object.
 */
export function bindStyle(
    el: Element,
    compute: () => Record<string, any>
): void {
    Debug.emit("binding:create", {
        type: "style",
        el,
    });

    effect(() => {
        const styleObj = unwrap(compute());
        const resolved: Record<string, string> = {};

        for (const key in styleObj) {
            resolved[key] = unwrap(styleObj[key]);
        }

        Debug.emit("binding:update", {
            type: "style",
            el,
            value: resolved,
        });

        setStyle(el, resolved);
    });
}

/**
 * Bind a static event listener to an element.
 *
 * Events are NOT reactive - the handler is attached once.
 *
 * @param el - The element to bind to.
 * @param name - Event name (e.g., "click").
 * @param handler - The event handler function.
 */
export function bindEvent(
    el: Element,
    name: string,
    handler: EventListener
): void {
    Debug.emit("binding:create", {
        type: "event",
        el,
        name,
        handler,
    });

    addEvent(el, name, handler);
}

/**
 * Remove a previously bound event listener.
 *
 * @param el - The element to unbind from.
 * @param name - Event name.
 * @param handler - The handler to remove.
 */
export function unbindEvent(
    el: Element,
    name: string,
    handler: EventListener
): void {
    Debug.emit("binding:dispose", {
        type: "event",
        el,
        name,
        handler,
    });

    removeEvent(el, name, handler);
}
