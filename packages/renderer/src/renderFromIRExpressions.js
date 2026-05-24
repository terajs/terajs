import { emitRendererDebug } from "./debug.js";
const SIMPLE_PATH_RE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
const SIMPLE_IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
const RESERVED_LITERAL_RE = /^(?:true|false|null|undefined|NaN|Infinity)$/;
export const EXPRESSION_UNWRAP_LOCALS = Symbol.for("@terajs/expression-unwrap-locals");
const expressionEvaluatorCache = new Map();
const expressionScopeCache = new WeakMap();
export function isDirectBindingSource(value) {
    return (typeof value === "function" && value !== null && "_dep" in value && "_value" in value)
        || (typeof value === "object" && value !== null && "_sig" in value);
}
export function resolveDirectTextSource(ctx, expr) {
    const normalized = expr.trim();
    if (!SIMPLE_IDENTIFIER_RE.test(normalized) || RESERVED_LITERAL_RE.test(normalized)) {
        return undefined;
    }
    return ctx?.[normalized];
}
export function resolveHintedDirectSource(ctx, binding) {
    if (binding.segments.length !== 1) {
        return undefined;
    }
    return ctx?.[binding.segments[0]];
}
export function resolveHintedPath(ctx, binding, invokeFinal) {
    return resolvePathSegments(ctx, binding.segments, invokeFinal);
}
export function resolveExpr(ctx, expr) {
    const normalized = expr.trim();
    if (normalized.length === 0) {
        return undefined;
    }
    if (isSimplePath(normalized)) {
        return resolveSimplePath(ctx, normalized, true);
    }
    return evaluateExpression(ctx, normalized, undefined);
}
export function resolveEventHandler(ctx, expr) {
    const normalized = expr.trim();
    if (normalized.length === 0) {
        return undefined;
    }
    if (isSimplePath(normalized)) {
        const handler = resolveSimplePath(ctx, normalized, false);
        return typeof handler === "function" ? handler : undefined;
    }
    return (event) => {
        evaluateExpression(ctx, normalized, event);
    };
}
function isSimplePath(expr) {
    return SIMPLE_PATH_RE.test(expr) && !RESERVED_LITERAL_RE.test(expr);
}
function resolveSimplePath(ctx, expr, invokeFinal) {
    if (!ctx) {
        return undefined;
    }
    return resolvePathSegments(ctx, expr.split("."), invokeFinal);
}
function resolvePathSegments(ctx, parts, invokeFinal) {
    if (!ctx) {
        return undefined;
    }
    let current = ctx;
    for (let index = 0; index < parts.length; index += 1) {
        if (current == null) {
            return undefined;
        }
        const value = current[parts[index]];
        const isLast = index === parts.length - 1;
        current = typeof value === "function" && (invokeFinal || !isLast) ? value() : value;
    }
    return current;
}
function evaluateExpression(ctx, expr, event) {
    const evaluator = getExpressionEvaluator(expr);
    try {
        return evaluator(getExpressionScope(ctx), event);
    }
    catch (error) {
        emitRendererDebug("error:renderer", () => ({
            message: `Failed to evaluate expression '${expr}'`,
            expression: expr,
            error,
        }));
        return undefined;
    }
}
function getExpressionEvaluator(expr) {
    const cached = expressionEvaluatorCache.get(expr);
    if (cached) {
        return cached;
    }
    const evaluator = new Function("$ctx", "$event", [
        "const scope = $ctx ?? {};",
        "with (scope) {",
        `  return (${expr});`,
        "}",
    ].join("\n"));
    expressionEvaluatorCache.set(expr, evaluator);
    return evaluator;
}
function getExpressionScope(ctx) {
    if (!ctx || typeof ctx !== "object") {
        return ctx;
    }
    const unwrapLocals = ctx[EXPRESSION_UNWRAP_LOCALS];
    if (!(unwrapLocals instanceof Set) || unwrapLocals.size === 0) {
        return ctx;
    }
    const cached = expressionScopeCache.get(ctx);
    if (cached) {
        return cached;
    }
    const scope = new Proxy(ctx, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (typeof property === "string" && unwrapLocals.has(property) && typeof value === "function" && value !== null && "_dep" in value && "_value" in value) {
                return value();
            }
            return value;
        },
        has(target, property) {
            return Reflect.has(target, property);
        },
    });
    expressionScopeCache.set(ctx, scope);
    return scope;
}
