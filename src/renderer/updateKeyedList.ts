/**
 * @file updateKeyedList.ts
 * @description
 * A minimal, platform‑agnostic keyed list reconciler for Nebula's fine‑grained renderer.
 *
 * Nebula does NOT use a virtual DOM or tree diffing. Instead, lists are updated
 * reactively: when the underlying array changes, this function receives the old
 * and new lists and performs the minimal DOM operations needed to update the UI.
 *
 * This reconciler:
 * - Preserves DOM identity using keys
 * - Moves existing nodes instead of recreating them
 * - Mounts new items
 * - Unmounts removed items
 * - Uses an LIS (Longest Increasing Subsequence) to minimize DOM movement
 *
 * It is the ONLY diffing Nebula performs.
 */

export interface KeyedItem {
    /** Unique identity for the item. Determines DOM preservation. */
    key: any;

    /** The actual DOM node associated with this item. */
    node: Node;
}

/**
 * Mount a new keyed item into the DOM.
 *
 * @param item - The keyed item to mount.
 * @param parent - The parent DOM node.
 * @param anchor - The DOM node to insert before, or null to append.
 */
export type MountFn = (item: KeyedItem, parent: Node, anchor: Node | null) => void;

/**
 * Remove an existing keyed item from the DOM.
 *
 * @param item - The keyed item to remove.
 * @param parent - The parent DOM node.
 */
export type UnmountFn = (item: KeyedItem, parent: Node) => void;

/**
 * Reconcile two keyed lists with minimal DOM movement.
 *
 * This function assumes:
 * - `oldItems` and `newItems` are arrays of `{ key, node }`
 * - Keys uniquely identify DOM nodes
 * - Caller ensures this runs inside a reactive effect
 *
 * @param parent - The parent DOM node containing the list.
 * @param oldItems - The previous list of keyed items.
 * @param newItems - The next list of keyed items.
 * @param mount - Function to mount a new item.
 * @param unmount - Function to remove an old item.
 */
export function updateKeyedList(
    parent: Node,
    oldItems: KeyedItem[],
    newItems: KeyedItem[],
    mount: MountFn,
    unmount: UnmountFn
) {
    let i = 0;
    let oldEnd = oldItems.length - 1;
    let newEnd = newItems.length - 1;

    // -------------------------------------------------------------
    // 1. Sync from start
    // -------------------------------------------------------------
    while (i <= oldEnd && i <= newEnd && oldItems[i].key === newItems[i].key) {
        i++;
    }

    // -------------------------------------------------------------
    // 2. Sync from end
    // -------------------------------------------------------------
    while (i <= oldEnd && i <= newEnd && oldItems[oldEnd].key === newItems[newEnd].key) {
        oldEnd--;
        newEnd--;
    }

    // -------------------------------------------------------------
    // 3. Mount new items (new list is longer)
    // -------------------------------------------------------------
    if (i > oldEnd) {
        const anchor =
            newEnd + 1 < newItems.length ? newItems[newEnd + 1].node : null;

        while (i <= newEnd) {
            mount(newItems[i], parent, anchor);
            i++;
        }
        return;
    }

    // -------------------------------------------------------------
    // 4. Unmount old items (old list is longer)
    // -------------------------------------------------------------
    if (i > newEnd) {
        while (i <= oldEnd) {
            unmount(oldItems[i], parent);
            i++;
        }
        return;
    }

    // -------------------------------------------------------------
    // 5. Full keyed reconciliation for the middle segment
    // -------------------------------------------------------------
    const oldStart = i;
    const newStart = i;

    const keyToNewIndex = new Map<any, number>();
    for (let j = newStart; j <= newEnd; j++) {
        keyToNewIndex.set(newItems[j].key, j);
    }

    const toMove = new Array(newEnd - newStart + 1).fill(-1);
    let moved = false;
    let maxNewIndexSoFar = 0;

    for (let j = oldStart; j <= oldEnd; j++) {
        const oldItem = oldItems[j];
        const newIndex = keyToNewIndex.get(oldItem.key);

        if (newIndex == null) {
            unmount(oldItem, parent);
        } else {
            toMove[newIndex - newStart] = j;

            if (newIndex < maxNewIndexSoFar) {
                moved = true;
            } else {
                maxNewIndexSoFar = newIndex;
            }
        }
    }

    // If no movement is needed, only mount missing items
    if (!moved) {
        for (let j = newStart; j <= newEnd; j++) {
            if (toMove[j - newStart] === -1) {
                const anchor =
                    j + 1 < newItems.length ? newItems[j + 1].node : null;
                mount(newItems[j], parent, anchor);
            }
        }
        return;
    }

    // -------------------------------------------------------------
    // 6. Move items using LIS to minimize DOM operations
    // -------------------------------------------------------------
    const seq = longestIncreasingSubsequence(toMove);
    let seqIdx = seq.length - 1;

    for (let j = newEnd; j >= newStart; j--) {
        const newItem = newItems[j];
        const anchor =
            j + 1 < newItems.length ? newItems[j + 1].node : null;

        if (toMove[j - newStart] === -1) {
            mount(newItem, parent, anchor);
        } else if (seqIdx < 0 || j - newStart !== seq[seqIdx]) {
            parent.insertBefore(newItem.node, anchor);
        } else {
            seqIdx--;
        }
    }
}

/**
 * Compute the Longest Increasing Subsequence (LIS) of an array.
 *
 * Used to determine which DOM nodes can stay in place during list reconciliation.
 *
 * @param arr - Array of old indices aligned to new positions.
 * @returns An array of indices representing the LIS.
 */
function longestIncreasingSubsequence(arr: number[]): number[] {
    const p = arr.slice();
    const result: number[] = [];
    let u: number;
    let v: number;

    for (let i = 0; i < arr.length; i++) {
        const n = arr[i];
        if (n === -1) continue;

        if (result.length === 0 || arr[result[result.length - 1]] < n) {
            p[i] = result.length > 0 ? result[result.length - 1] : -1;
            result.push(i);
            continue;
        }

        u = 0;
        v = result.length - 1;

        while (u < v) {
            const c = ((u + v) / 2) | 0;
            if (arr[result[c]] < n) u = c + 1;
            else v = c;
        }

        if (n < arr[result[u]]) {
            if (u > 0) p[i] = result[u - 1];
            result[u] = i;
        }
    }

    u = result.length;
    v = result[result.length - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }

    return result;
}
