import type { TemplateFn } from "./template";

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
    /**
     * Condition that controls whether the `children` or `fallback` is rendered.
     * Can be a raw value or a function (e.g. a signal getter).
     */
    when: MaybeAccessor<T>;
    /**
     * Content to render when `when` is truthy.
     * Can be a Node or a function returning a Node.
     */
    children: Node | (() => Node);
    /**
     * Optional content to render when `when` is falsy.
     * Can be a Node or a function returning a Node.
     */
    fallback?: Node | (() => Node);
}

/**
 * Resolves a value that may be a function (accessor) or a raw value.
 *
 * @param value - The value or accessor.
 * @returns The resolved value.
 */
function resolve<T>(value: MaybeAccessor<T>): T {
    return typeof value === "function" ? (value as () => T)() : value;
}

/**
 * Normalizes a Node or a function returning a Node into a Node.
 *
 * @param value - The Node or factory function.
 * @returns The resulting Node.
 */
function resolveNode(value: Node | (() => Node)): Node {
    return typeof value === "function" ? (value as () => Node)() : value;
}

/**
 * Conditionally renders `children` or `fallback` based on `when`.
 *
 * This component returns a `TemplateFn`, so it participates in the
 * reactive template system and will re‑evaluate whenever any signals
 * used inside `when`, `children`, or `fallback` change.
 *
 * @param props - The `Show` component props.
 * @returns A reactive template function.
 */
export function Show<T = any>(props: ShowProps<T>): TemplateFn {
    return () => {
        const condition = resolve(props.when);

        if (condition) {
            return resolveNode(props.children);
        }

        if (props.fallback) {
            return resolveNode(props.fallback);
        }

        // Render an empty text node when nothing else is provided.
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
 *
 * @param props - The `Match` props.
 * @returns The props unchanged (the Switch will interpret them).
 */
export function Match<T = any>(props: MatchProps<T>): MatchProps<T> {
    return props;
}

/**
 * Props for the `Switch` control‑flow component.
 */
export interface SwitchProps<T = any> {
    /**
     * Optional value to compare against each Match's `when`.
     * If omitted, each Match's `when` is treated as a boolean condition.
     */
    value?: MaybeAccessor<T>;

    /**
     * The Match branches inside this Switch.
     * In JSX, this will be an array of MatchProps.
     */
    children: any;

    /**
     * Optional fallback rendered when no Match branch matches.
     */
    fallback?: Node | (() => Node);
}

/**
 * Renders the first matching `<Match>` branch.
 *
 * If `value` is provided:
 *   - Each Match's `when` is compared to `value`.
 *
 * If `value` is omitted:
 *   - Each Match's `when` is treated as a boolean condition.
 *
 * @param props - The `Switch` component props.
 * @returns A reactive template function.
 */
export function Switch<T = any>(props: SwitchProps<T>): TemplateFn {
    return () => {
        const children = Array.isArray(props.children)
            ? props.children
            : [props.children];

        const value = props.value !== undefined
            ? resolve(props.value)
            : undefined;

        for (const child of children) {
            // Skip anything that isn't a Match
            if (!child || typeof child !== "object" || !("when" in child)) {
                continue;
            }

            const match = child as MatchProps<T>;
            const cond = resolve(match.when);

            if (value !== undefined) {
                // Value-based switch
                if (cond === value) {
                    return resolveNode(match.children);
                }
            } else {
                // Boolean switch
                if (cond) {
                    return resolveNode(match.children);
                }
            }
        }

        // No match found → fallback
        if (props.fallback) {
            return resolveNode(props.fallback);
        }

        return document.createTextNode("");
    };
}
