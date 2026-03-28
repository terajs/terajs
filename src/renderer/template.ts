import { effect } from "../reactivity/effect";
import { onCleanup } from "./context";

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
    let current: Node | null = null;

    const stop = effect(() => {
        const next = fn();

        if (current == null) {
            // First render
            current = next;
        } else if (next !== current) {
            // Replace DOM node
            const parent = current.parentNode;
            if (parent) parent.replaceChild(next, current);
            current = next;
        }
    });

    onCleanup(stop);

    return current!;
}

