import type { IRBindingHint } from "@terajs/compiler";
import type { Ref, Signal } from "@terajs/reactivity";

import { emitRendererDebug } from "./debug.js";

const SIMPLE_PATH_RE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
const SIMPLE_IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
const RESERVED_LITERAL_RE = /^(?:true|false|null|undefined|NaN|Infinity)$/;
const expressionEvaluatorCache = new Map<string, (ctx: any, event: Event | undefined) => any>();

export function isDirectBindingSource(value: unknown): value is Signal<unknown> | Ref<unknown> {
  return (typeof value === "function" && value !== null && "_dep" in value && "_value" in value)
    || (typeof value === "object" && value !== null && "_sig" in value);
}

export function resolveDirectTextSource(ctx: any, expr: string): any {
  const normalized = expr.trim();
  if (!SIMPLE_IDENTIFIER_RE.test(normalized) || RESERVED_LITERAL_RE.test(normalized)) {
    return undefined;
  }

  return ctx?.[normalized];
}

export function resolveHintedDirectSource(ctx: any, binding: IRBindingHint): any {
  if (binding.segments.length !== 1) {
    return undefined;
  }

  return ctx?.[binding.segments[0]];
}

export function resolveHintedPath(ctx: any, binding: IRBindingHint, invokeFinal: boolean): any {
  return resolvePathSegments(ctx, binding.segments, invokeFinal);
}

export function resolveExpr(ctx: any, expr: string): any {
  const normalized = expr.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  if (isSimplePath(normalized)) {
    return resolveSimplePath(ctx, normalized, true);
  }

  return evaluateExpression(ctx, normalized, undefined);
}

export function resolveEventHandler(ctx: any, expr: string): EventListener | undefined {
  const normalized = expr.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  if (isSimplePath(normalized)) {
    const handler = resolveSimplePath(ctx, normalized, false);
    return typeof handler === "function" ? handler as EventListener : undefined;
  }

  return (event: Event) => {
    evaluateExpression(ctx, normalized, event);
  };
}

function isSimplePath(expr: string): boolean {
  return SIMPLE_PATH_RE.test(expr) && !RESERVED_LITERAL_RE.test(expr);
}

function resolveSimplePath(ctx: any, expr: string, invokeFinal: boolean): any {
  if (!ctx) {
    return undefined;
  }

  return resolvePathSegments(ctx, expr.split("."), invokeFinal);
}

function resolvePathSegments(ctx: any, parts: string[], invokeFinal: boolean): any {
  if (!ctx) {
    return undefined;
  }

  let current: any = ctx;

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

function evaluateExpression(ctx: any, expr: string, event: Event | undefined): any {
  const evaluator = getExpressionEvaluator(expr);

  try {
    return evaluator(ctx, event);
  } catch (error) {
    emitRendererDebug("error:renderer", () => ({
      message: `Failed to evaluate expression '${expr}'`,
      expression: expr,
      error,
    }));
    return undefined;
  }
}

function getExpressionEvaluator(expr: string): (ctx: any, event: Event | undefined) => any {
  const cached = expressionEvaluatorCache.get(expr);

  if (cached) {
    return cached;
  }

  const evaluator = new Function(
    "$ctx",
    "$event",
    [
      "const scope = $ctx ?? {};",
      "with (scope) {",
      `  return (${expr});`,
      "}",
    ].join("\n"),
  ) as (ctx: any, event: Event | undefined) => any;

  expressionEvaluatorCache.set(expr, evaluator);
  return evaluator;
}