/**
 * @file bindings.ts
 * @description
 * Fine‑grained DOM bindings for Nebula’s reactive renderer.
 *
 * These helpers connect reactive values (signals, memos, derived functions)
 * to DOM updates. They are the glue between Nebula Core’s reactivity and the
 * DOM primitives defined in `dom.ts`.
 *
 * Nebula does NOT use a virtual DOM. Instead:
 * - Each dynamic expression creates a binding.
 * - Each binding registers a reactive effect.
 * - When dependencies change, only the affected DOM nodes update.
 *
 * This is the same model used by SolidJS and Vue Vapor Mode.
 */

import { effect } from "../reactivity/effect";
import {
    setText,
    setProp,
    setStyle,
    setClass,
    addEvent,
    removeEvent,
} from "./dom";

/**
 * Bind a reactive expression to a Text node.
 *
 * @param node - The Text node to update.
 * @param compute - A function returning the latest text value.
 *
 * @example
 * const text = createText("");
 * bindText(text, () => count());
 */
export function bindText(node: Text, compute: () => string): void {
    effect(() => {
        setText(node, compute());
    });
}

/**
 * Bind a reactive expression to an element attribute/property.
 *
 * @param el - The element to update.
 * @param name - The attribute name (e.g., "id", "class", "value").
 * @param compute - A function returning the latest value.
 *
 * @example
 * bindProp(el, "id", () => props.id);
 */
export function bindProp(
    el: HTMLElement,
    name: string,
    compute: () => any
): void {
    effect(() => {
        setProp(el, name, compute());
    });
}

/**
 * Bind a reactive expression to an element's class attribute.
 *
 * @param el - The element to update.
 * @param compute - A function returning the class string.
 *
 * @example
 * bindClass(el, () => isActive() ? "active" : "");
 */
export function bindClass(
    el: HTMLElement,
    compute: () => string
): void {
    effect(() => {
        setClass(el, compute());
    });
}

/**
 * Bind a reactive expression to an element's inline styles.
 *
 * @param el - The element to update.
 * @param compute - A function returning a style object.
 *
 * @example
 * bindStyle(el, () => ({ color: color(), background: bg() }));
 */
export function bindStyle(
    el: HTMLElement,
    compute: () => Record<string, string>
): void {
    effect(() => {
        setStyle(el, compute());
    });
}

/**
 * Bind a static event listener to an element.
 *
 * Events are NOT reactive — the handler is attached once.
 *
 * @param el - The element to bind to.
 * @param name - Event name (e.g., "click").
 * @param handler - The event handler function.
 *
 * @example
 * bindEvent(el, "click", () => console.log("clicked"));
 */
export function bindEvent(
    el: HTMLElement,
    name: string,
    handler: EventListener
): void {
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
    el: HTMLElement,
    name: string,
    handler: EventListener
): void {
    removeEvent(el, name, handler);
}
