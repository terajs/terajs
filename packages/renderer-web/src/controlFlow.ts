import type { TemplateFn } from "./template";
import { Debug } from "@nebula/shared";

/**
 * A value or a function that returns a value.
 * Used to allow both raw values and signal getters.
 */
export type MaybeAccessor<T> = T | (() => T);

/**
 * Props for the `Show` control‑flow component.
 *
 * @typeParam T - The type of the condition value.
 */
export interface ShowProps<T = any> {
    /** Condition controlling whether children or fallback is rendered. */
    when: MaybeAccessor<T>;

    /** Content rendered when `when` is truthy. */
    children: Node | (() => Node);

    /** Optional fallback when `when` is falsy. */
    fallback?: Node | (() => Node);
}

/** Resolve a raw value or accessor. */
function resolve<T>(value: MaybeAccessor<T>): T {
    return typeof value === "function" ? (value as () => T)() : value;
}

/** Resolve a Node or Node factory. */
function resolveNode(value: Node | (() => Node)): Node {
    return typeof value === "function" ? (value as () => Node)() : value;
}

/**
 * Conditionally renders `children` or `fallback` based on `when`.
 *
 * @param props - The `Show` component props.
 * @returns A reactive template function.
 */
export function Show<T = any>(props: ShowProps<T>): TemplateFn {
    Debug.emit("template:create", {
        type: "Show",
        props
    });

    return () => {
        const condition = resolve(props.when);

        Debug.emit("template:update", {
            type: "Show",
            condition
        });

        if (condition) {
            Debug.emit("template:branch", {
                type: "Show",
                branch: "children"
            });
            return resolveNode(props.children);
        }

        if (props.fallback) {
            Debug.emit("template:fallback", {
                type: "Show"
            });
            return resolveNode(props.fallback);
        }

        Debug.emit("template:empty", { type: "Show" });
        return document.createTextNode("");
    };
}

/**
 * Props for a `Match` branch inside a `Switch`.
 */
export interface MatchProps<T = any> {
    /** Condition for this branch. */
    when: MaybeAccessor<T>;

    /** Content rendered when this branch matches. */
    children: Node | (() => Node);
}

/**
 * A `Match` component is not rendered directly.
 * It is consumed by a parent `<Switch>`.
 */
export function Match<T = any>(props: MatchProps<T>): MatchProps<T> {
    return props;
}

/**
 * Props for the `Switch` control‑flow component.
 */
export interface SwitchProps<T = any> {
    /** Optional value to compare against each Match's `when`. */
    value?: MaybeAccessor<T>;

    /** The Match branches inside this Switch. */
    children: any;

    /** Optional fallback when no Match matches. */
    fallback?: Node | (() => Node);
}

/**
 * Renders the first matching `<Match>` branch.
 *
 * @param props - The `Switch` component props.
 * @returns A reactive template function.
 */
export function Switch<T = any>(props: SwitchProps<T>): TemplateFn {
    Debug.emit("template:create", {
        type: "Switch",
        props
    });

    return () => {
        const children = Array.isArray(props.children)
            ? props.children
            : [props.children];

        const value = props.value !== undefined
            ? resolve(props.value)
            : undefined;

        Debug.emit("template:update", {
            type: "Switch",
            value
        });

        for (const child of children) {
            if (!child || typeof child !== "object" || !("when" in child)) {
                continue;
            }

            const match = child as MatchProps<T>;
            const cond = resolve(match.when);

            if (value !== undefined) {
                if (cond === value) {
                    Debug.emit("template:branch", {
                        type: "Switch",
                        branch: "match",
                        match
                    });
                    return resolveNode(match.children);
                }
            } else {
                if (cond) {
                    Debug.emit("template:branch", {
                        type: "Switch",
                        branch: "match",
                        match
                    });
                    return resolveNode(match.children);
                }
            }
        }

        if (props.fallback) {
            Debug.emit("template:fallback", {
                type: "Switch"
            });
            return resolveNode(props.fallback);
        }

        Debug.emit("template:empty", { type: "Switch" });
        return document.createTextNode("");
    };
}