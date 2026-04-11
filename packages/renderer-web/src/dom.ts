/**
 * @file dom.ts
 * @description
 * Platform-specific DOM operations for Terajs's renderer.
 *
 * Terajs does NOT use a virtual DOM. These operations directly mutate the DOM
 * to ensure maximum performance and minimal memory overhead.
 */

import { Debug } from "@terajs/shared";
import { unwrap } from "./unwrap.js"; 

const nodeCleanup = new WeakMap<Node, Array<() => void>>();

interface HydrationFrame {
    parent: Node;
    nextChild: ChildNode | null;
}

let hydrationFrames: HydrationFrame[] = [];
let hydrationRoot: HTMLElement | null = null;

function isHydrating(): boolean {
    return hydrationRoot != null;
}

function currentHydrationFrame(): HydrationFrame | undefined {
    if (hydrationFrames.length === 0) return undefined;
    return hydrationFrames[hydrationFrames.length - 1];
}

function claimHydrationChild(matcher: (candidate: ChildNode) => boolean): ChildNode | null {
    const frame = currentHydrationFrame();
    if (!frame || !frame.nextChild) {
        return null;
    }

    const candidate = frame.nextChild;
    if (!matcher(candidate)) {
        return null;
    }

    frame.nextChild = candidate.nextSibling;
    return candidate;
}

function pruneHydrationRemainder(frame: HydrationFrame): void {
    let node = frame.nextChild;
    while (node) {
        const next = node.nextSibling;
        remove(node);
        node = next;
    }

    frame.nextChild = null;
}

/**
 * Begins hydration mode for a root container.
 *
 * During hydration, creation helpers claim matching existing nodes before
 * allocating new ones.
 */
export function startHydration(root: HTMLElement): void {
    hydrationRoot = root;
    hydrationFrames = [{
        parent: root,
        nextChild: root.firstChild
    }];

    Debug.emit("dom:hydrate:start", {
        root
    });
}

/**
 * Ends hydration mode and removes any unclaimed server-rendered nodes.
 */
export function finishHydration(): void {
    const root = hydrationRoot;
    if (!root) {
        return;
    }

    const rootFrame = hydrationFrames[0];
    if (rootFrame) {
        pruneHydrationRemainder(rootFrame);
    }

    hydrationFrames = [];
    hydrationRoot = null;

    Debug.emit("dom:hydrate:end", {
        root
    });
}

/**
 * Executes work under a nested hydration frame.
 *
 * Remaining unclaimed children for the frame parent are pruned after `run`.
 */
export function withHydrationParent<T>(parent: Node, run: () => T): T {
    if (!isHydrating()) {
        return run();
    }

    hydrationFrames.push({
        parent,
        nextChild: parent.firstChild
    });

    try {
        return run();
    } finally {
        const frame = hydrationFrames.pop();
        if (frame) {
            pruneHydrationRemainder(frame);
        }
    }
}

export function addNodeCleanup(node: Node, cleanup: () => void): void {
    const existing = nodeCleanup.get(node);
    if (existing) {
        existing.push(cleanup);
        return;
    }

    nodeCleanup.set(node, [cleanup]);
}

export function removeNodeCleanup(node: Node, cleanup: () => void): void {
    const existing = nodeCleanup.get(node);
    if (!existing) return;

    const index = existing.indexOf(cleanup);
    if (index !== -1) {
        existing.splice(index, 1);
    }

    if (existing.length === 0) {
        nodeCleanup.delete(node);
    }
}

function disposeNode(node: Node): void {
    const cleanups = nodeCleanup.get(node);
    if (cleanups) {
        try {
            for (const cleanup of cleanups) {
                cleanup();
            }
        } finally {
            nodeCleanup.delete(node);
        }
    }
}

export function disposeNodeTree(node: Node): void {
    let child = node.firstChild;
    while (child) {
        const next = child.nextSibling;
        disposeNodeTree(child);
        child = next;
    }

    disposeNode(node);
}

export function disposeNodeChildren(node: Node): void {
    let child = node.firstChild;
    while (child) {
        const next = child.nextSibling;
        disposeNodeTree(child);
        child = next;
    }
}

/**
 * Create a DOM element node.
 */
export function createElement(type: string, svg: boolean = false): HTMLElement | SVGElement {
    const expectedTag = type.toLowerCase();
    const expectsSvg = svg || expectedTag === "svg";

    const claimed = claimHydrationChild((candidate) => {
        if (candidate.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const element = candidate as Element;
        const tagMatches = element.tagName.toLowerCase() === expectedTag;
        if (!tagMatches) {
            return false;
        }

        if (expectsSvg) {
            return element.namespaceURI === "http://www.w3.org/2000/svg";
        }

        return element.namespaceURI !== "http://www.w3.org/2000/svg";
    });

    if (claimed) {
        return claimed as HTMLElement | SVGElement;
    }

    const el = expectsSvg
        ? document.createElementNS("http://www.w3.org/2000/svg", type)
        : document.createElement(type);

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
    const claimed = claimHydrationChild((candidate) => candidate.nodeType === Node.TEXT_NODE);
    if (claimed) {
        const text = claimed as Text;
        if (text.data !== value) {
            text.data = value;
        }

        return text;
    }

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
    if (child.parentNode === parent) {
        if (anchor === null && parent.lastChild === child) {
            return;
        }

        if (anchor !== null && child.nextSibling === anchor) {
            return;
        }
    }

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

    disposeNodeTree(node);
    if (parent && node.parentNode === parent) {
        parent.removeChild(node);
    }
}

export function clear(node: Node): void {
    while (node.firstChild) {
        remove(node.firstChild);
    }
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
export function setProp(el: Element, name: string, value: any): void {
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
        if (v) {
            el.setAttribute(name, "");
        } else {
            el.removeAttribute(name);
        }
        return;
    }

    el.setAttribute(name, String(v));
}

/**
 * Apply a style object to an Element.
 */
export function setStyle(el: Element, style: Record<string, string>): void {
    Debug.emit("dom:update", {
        kind: "style",
        el,
        style
    });

    const styleTarget = (el as HTMLElement | SVGElement).style;
    for (const key in style) {
        styleTarget[key as any] = style[key];
    }
}

/**
 * Set the class attribute on an element.
 */
export function setClass(el: Element, className: string): void {
    Debug.emit("dom:update", {
        kind: "class",
        el,
        className
    });

    el.setAttribute("class", className);
}

/**
 * Add an event listener to an element.
 */
export function addEvent(el: Element, name: string, handler: EventListener): void {
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
export function removeEvent(el: Element, name: string, handler: EventListener): void {
    Debug.emit("dom:update", {
        kind: "event:remove",
        el,
        name,
        handler
    });

    el.removeEventListener(name, handler);
}
