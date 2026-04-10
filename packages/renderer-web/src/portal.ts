import { onCleanup } from "@terajs/runtime";

import { createText, insert, remove } from "./dom.js";
import { unwrap } from "./unwrap.js";

export type PortalTarget =
    | string
    | Node
    | null
    | undefined
    | (() => string | Node | null | undefined);

export interface PortalProps {
    to?: PortalTarget;
    children?: any;
}

export function Portal(props: PortalProps = {}): Node {
    const anchor = createText("");
    const target = resolvePortalTarget(props.to);
    const nodes = createPortalNodes(props.children);

    for (const node of nodes) {
        insert(target, node);
    }

    onCleanup(() => {
        for (const node of nodes) {
            remove(node);
        }
    });

    return anchor;
}

function resolvePortalTarget(target: PortalTarget): Node {
    const resolved = typeof target === "function"
        ? unwrap(target())
        : unwrap(target);

    if (resolved == null) {
        return document.body;
    }

    if (typeof resolved === "string") {
        const element = document.querySelector(resolved);
        if (element) {
            return element;
        }

        throw new Error(`Portal target not found: ${resolved}`);
    }

    if (resolved instanceof Node) {
        return resolved;
    }

    throw new Error("Portal target must be a selector, DOM node, or accessor.");
}

function createPortalNodes(children: any): Node[] {
    return flattenChildren(children).flatMap((child) => normalizePortalChild(child));
}

function normalizePortalChild(child: any): Node[] {
    const value = unwrap(child);

    if (value == null || value === false || value === true) {
        return [];
    }

    if (typeof value === "string" || typeof value === "number") {
        return [createText(String(value))];
    }

    if (typeof value === "function") {
        return normalizePortalChild(value());
    }

    if (value instanceof DocumentFragment) {
        return Array.from(value.childNodes);
    }

    if (value instanceof Node) {
        return [value];
    }

    throw new Error("Unsupported Portal child.");
}

function flattenChildren(children: any): any[] {
    if (Array.isArray(children)) {
        return children.flatMap((child) => flattenChildren(child));
    }

    return children == null ? [] : [children];
}