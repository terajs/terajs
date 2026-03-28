import { UINode } from "../ui/node";
import { domMap } from "./domMap";
import { createNode } from "./createNode";
import { setProp } from "./setProp";
import { patchChildren } from "./patchChildren";
import { ParentDomNode } from "./domTypes";

/**
 * Patch an existing DOM node so that it matches a new `UINode`.
 *
 * @remarks
 * This is the central update function in Nebula's renderer.
 * It performs:
 *
 * - Node replacement when types differ
 * - Prop diffing (static props only; reactive props are handled by effects)
 * - Children diffing (delegated to `patchChildren`)
 *
 * The function assumes that `oldVNode` has already been mounted
 * and that its corresponding DOM node is stored in `domMap`.
 *
 * @param parent - The DOM parent containing the node to patch.
 * @param oldVNode - The previous UI description.
 * @param newVNode - The new UI description.
 */
export function patchNode(
    parent: Node,
    oldVNode: UINode,
    newVNode: UINode
): void {
    // -------------------------------------------------------------
    // 1. If node types differ → replace the entire DOM node
    // -------------------------------------------------------------
    if (oldVNode.type !== newVNode.type) {
        const newDom = createNode(newVNode) as ParentDomNode;
        const oldDom = domMap.get(oldVNode)!;

        parent.replaceChild(newDom, oldDom);
        domMap.set(newVNode, newDom);
        return;
    }

    // -------------------------------------------------------------
    // 2. Same type → update in place
    // -------------------------------------------------------------
    const el = domMap.get(oldVNode)!;
    domMap.set(newVNode, el);

    // Update props
    patchProps(el as HTMLElement, oldVNode.props, newVNode.props);

    // Update children
    patchChildren(el, oldVNode.children, newVNode.children);
}

/**
 * Diff and apply prop updates to a DOM element.
 *
 * @remarks
 * Reactive props are ignored here because they are handled
 * by `bindProp()` inside `createNode.ts`, which attaches
 * fine‑grained reactive effects.
 *
 * This function only handles:
 * - Removing old static props
 * - Adding/updating new static props
 *
 * @param el - The DOM element to update.
 * @param oldProps - Previous props object.
 * @param newProps - New props object.
 */
function patchProps(
    el: HTMLElement,
    oldProps: Record<string, any> | null,
    newProps: Record<string, any> | null
): void {
    oldProps = oldProps || {};
    newProps = newProps || {};

    // Remove props that no longer exist
    for (const key in oldProps) {
        if (!(key in newProps)) {
            setProp(el, key, null);
        }
    }

    // Add or update new props
    for (const key in newProps) {
        const value = newProps[key];

        // Reactive props are handled by bindProp() and should not be patched here
        if (typeof value === "function") continue;

        setProp(el, key, value);
    }
}
