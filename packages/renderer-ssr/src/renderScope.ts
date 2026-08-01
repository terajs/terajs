export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveExpr(
  scope: Record<string, unknown>,
  expr: string
): unknown {
  if (expr in scope) {
    const value = scope[expr];
    return typeof value === "function" ? value() : value;
  }

  const parts = expr.split(".");
  let current: unknown = scope;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    const value = (current as Record<string, unknown>)[part];
    current = typeof value === "function" ? value() : value;
  }

  return current;
}
