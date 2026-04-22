/**
 * @file for.ts
 * @description
 * Terajs's reactive keyed list component.
 *
 * This component is the idiomatic way to render arrays in Terajs.
 * It performs:
 * - minimal DOM movement
 * - keyed identity preservation
 * - reactive updates when the array changes
 *
 * It does NOT diff templates or VDOM trees.
 * It simply re-runs when the array changes and reconciles DOM nodes.
 */

import { effect } from "@terajs/reactivity";
import { createFragment, insert, remove } from "./dom.js";
import { updateKeyedList, type KeyedItem } from "./updateKeyedList.js";
import { emitRendererDebug } from "./debug.js";

export interface ForProps<T> {
    /** Reactive getter returning the array to iterate over */
    each: () => T[];

    /** Function that turns each item into a DOM node */
    children: (item: T, index: () => number) => Node;

    /** Optional key extractor (defaults to item.key or index) */
    key?: (item: T, index: number) => any;
}

/**
 * Reactive keyed list renderer.
 *
 * @example
 * <For each={() => items()}>{(item) => <div>{item.name}</div>}</For>
 */
export function For<T>(props: ForProps<T>): Node {
    const parent = createFragment();

    emitRendererDebug("list:create", () => ({
        type: "For",
        props,
        parent
    }));

    let oldItems: KeyedItem[] = [];

    effect(() => {
        const array = props.each();
        const getKey = props.key ?? ((item: any, i: number) => item.key ?? i);

        emitRendererDebug("list:update", () => ({
            type: "For",
            arrayLength: array.length
        }));

        const newItems: KeyedItem[] = array.map((item, i) => {
            const node = props.children(item, () => i);

            return {
                key: getKey(item, i),
                node
            };
        });

        emitRendererDebug("list:reconcile", () => ({
            type: "For",
            oldCount: oldItems.length,
            newCount: newItems.length
        }));

        updateKeyedList(
            parent,
            oldItems,
            newItems,

            // mount
            (item, p, anchor) => {
                emitRendererDebug("list:mount", () => ({
                    type: "For",
                    key: item.key,
                    node: item.node,
                    anchor
                }));
                insert(p, item.node, anchor);
            },

            // unmount
            (item, p) => {
                emitRendererDebug("list:unmount", () => ({
                    type: "For",
                    key: item.key,
                    node: item.node
                }));
                remove(item.node);
            }
        );

        oldItems = newItems;
    });

    return parent;
}
