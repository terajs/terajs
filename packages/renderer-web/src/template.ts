/**
 * @file template.ts
 * @description
 * Nebula’s reactive template wrapper.
 *
 * A TemplateFn is a function that returns a DOM Node.
 * It is wrapped in a reactive effect so that whenever any signal it reads
 * changes, the template re-runs and updates the DOM by replacing its root node.
 */

import { effect } from "@nebula/reactivity";
import { onCleanup } from "@nebula/runtime";
import { Debug } from "@nebula/shared";

/**
 * A reactive template function.
 * It is re‑executed whenever any signal it reads changes.
 */
export type TemplateFn = () => Node;

/**
 * Wraps a template function in a reactive effect.
 *
 * The template must return a single root Node.
 * On each update, the previous root is replaced in the DOM.
 *
 * @param fn - A function that returns the current DOM tree for the template.
 * @returns The initial DOM node produced by the template.
 */
export function template(fn: TemplateFn): Node {
    Debug.emit("template:create", {
        templateFn: fn
    });

    let current: Node | null = null;

    const stop = effect(() => {
        const next = fn();

        Debug.emit("template:update", {
            templateFn: fn,
            next,
            current
        });

        if (current == null) {
            // First render
            Debug.emit("template:mount", {
                templateFn: fn,
                node: next
            });
            current = next;
        } else if (next !== current) {
            // Replace DOM node
            const parent = current.parentNode;

            Debug.emit("template:replace", {
                templateFn: fn,
                oldNode: current,
                newNode: next,
                parent
            });

            if (parent) {
                parent.replaceChild(next, current);
            }
            
            current = next;
        }
    });

    onCleanup(() => {
        Debug.emit("template:dispose", {
            templateFn: fn,
            node: current
        });
        stop();
    });

    return current!;
}