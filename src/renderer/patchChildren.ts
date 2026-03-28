import { UINode } from "../ui/node";
import { mount } from "./mount";
import { patchNode } from "./patchNode";
import { domMap } from "./domMap";

/**
 * Patch the children of a DOM element to match new UI children.
 *
 * @remarks
 * This function handles all transitions between:
 *
 * - `string` → `string` (text update)
 * - `string` → `UINode[]` (replace text with nodes)
 * - `UINode[]` → `string` (replace nodes with text)
 * - `UINode[]` → `UINode[]` (diff arrays)
 * - `null` → anything
 * - anything → `null`
 *
 * Keyed diffing is implemented separately and plugged in here.
 *
 * @param parent - The DOM element whose children are being updated.
 * @param oldChildren - The previous children (string, array, or null).
 * @param newChildren - The new children (string, array, or null).
 */
export function patchChildren(
    parent: HTMLElement | DocumentFragment,
    oldChildren: UINode[] | string | null,
    newChildren: UINode[] | string | null
): void {

    // -------------------------------------------------------------
    // CASE 1: new children is a string
    // -------------------------------------------------------------
    if (typeof newChildren === "string") {
        // If old was also a string → update textContent
        if (typeof oldChildren === "string") {
            if (oldChildren !== newChildren) {
                parent.textContent = newChildren;
            }
            return;
        }

        // Otherwise → clear old nodes and set text
        parent.textContent = newChildren;
        return;
    }

    // -------------------------------------------------------------
    // CASE 2: new children is null
    // -------------------------------------------------------------
    if (newChildren == null) {
        parent.textContent = "";
        return;
    }

    // -------------------------------------------------------------
    // CASE 3: new children is an array
    // -------------------------------------------------------------
    if (Array.isArray(newChildren)) {

        // Old was a string → clear and mount new nodes
        if (typeof oldChildren === "string") {
            parent.textContent = "";
            for (const child of newChildren) {
                mount(child, parent);
            }
            return;
        }

        // Old was null → mount new nodes
        if (oldChildren == null) {
            for (const child of newChildren) {
                mount(child, parent);
            }
            return;
        }

        // Old was also an array → diff arrays
        if (Array.isArray(oldChildren)) {
            // For now: naive diff (replace everything)
            // We will replace this with keyed diffing next.
            parent.textContent = "";
            for (const child of newChildren) {
                mount(child, parent);
            }
            return;
        }
    }
}
