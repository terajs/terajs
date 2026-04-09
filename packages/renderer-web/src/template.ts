/**
 * @file template.ts
 * @description
 * Terajs's reactive template wrapper.
 *
 * A TemplateFn is a function that returns a DOM Node.
 * It is wrapped in a reactive effect so that whenever any signal it reads
 * changes, the template re-runs and updates the DOM by replacing its root node.
 */

import { effect, getCurrentEffect } from "@terajs/reactivity";
import { getCurrentContext, onCleanup } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { addNodeCleanup, removeNodeCleanup, disposeNodeTree } from "./dom";

/**
 * A reactive template function.
 * It is re-executed whenever any signal it reads changes.
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
    const boundary = getCurrentContext()?.errorBoundary;
    const ownerName = getCurrentContext()?.name;
    const isNestedTemplate = !!getCurrentEffect();

    let stop: () => void;
    const cleanup = () => stop?.();

    stop = effect(() => {
        let next: Node;

        try {
            next = fn();
        } catch (error) {
            if (boundary) {
                boundary({
                    error,
                    phase: "template",
                    componentName: ownerName
                });
                return;
            }

            throw error;
        }

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
            if (!isNestedTemplate) {
                addNodeCleanup(current, cleanup);
            }
        } else if (next !== current) {
            // Replace DOM node
            const parent = current.parentNode;
            const oldNode = current;

            Debug.emit("template:replace", {
                templateFn: fn,
                oldNode,
                newNode: next,
                parent
            });

            if (!isNestedTemplate) {
                removeNodeCleanup(oldNode, cleanup);
            }

            if (parent) {
                parent.replaceChild(next, oldNode);
            }

            current = next;
            if (!isNestedTemplate) {
                addNodeCleanup(current, cleanup);
            }

            if (!isNestedTemplate) {
                queueMicrotask(() => {
                    disposeNodeTree(oldNode);
                });
            }
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
