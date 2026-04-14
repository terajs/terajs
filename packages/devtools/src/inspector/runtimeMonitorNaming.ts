import { getReactiveByRid } from "@terajs/shared";

export type RuntimeMonitorKind = "computed" | "watch" | "watchEffect" | "effect";

export interface RuntimeMonitorNamingUtils {
  readString(record: Record<string, unknown> | undefined, key: string): string | undefined;
}

export function formatRuntimeMonitorKind(kind: RuntimeMonitorKind): string {
  if (kind === "watchEffect") {
    return "watchEffect";
  }

  return kind;
}

export function formatRuntimeMonitorKindLabel(kind: RuntimeMonitorKind): string {
  if (kind === "watchEffect") {
    return "watch effect";
  }

  return kind;
}

export function sanitizeRuntimeMonitorName(name: string, kind: RuntimeMonitorKind): string {
  if (!isInternalRuntimeIdentifier(name, kind)) {
    return name;
  }

  return formatRuntimeMonitorKind(kind);
}

export function buildRuntimeMonitorEntryId(kind: RuntimeMonitorKind, rid: string | undefined, name: string): string {
  if (rid) {
    const simplified = simplifyRuntimeRid(rid, name);
    if (!isInternalRuntimeIdentifier(simplified, kind)) {
      return `${kind}:${rid}`;
    }
  }

  return `${kind}:${name}`;
}

export function isInternalRuntimeIdentifier(value: string, kind: RuntimeMonitorKind): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  const compact = normalized.replace(/\s+/g, "");
  const normalizedKind = formatRuntimeMonitorKind(kind).toLowerCase();
  if (compact === normalizedKind) {
    return true;
  }

  return /^(effect|watch|watcheffect|computed)([#:_-]?\d+)?$/.test(compact);
}

export function deriveRuntimeComputedName(rid: string): string {
  const info = getReactiveByRid(rid);
  const keyedName = info?.meta.key;
  if (typeof keyedName === "string" && keyedName.trim().length > 0) {
    return normalizeRuntimeName(keyedName, "computed");
  }

  const simplified = normalizeRuntimeName(simplifyRuntimeRid(rid, "computed"), "computed");
  return isInternalRuntimeIdentifier(simplified, "computed") ? "computed" : simplified;
}

export function simplifyRuntimeRid(rid: string, fallback: string): string {
  const pivot = rid.lastIndexOf(".");
  if (pivot >= 0 && pivot < rid.length - 1) {
    const suffix = rid.slice(pivot + 1);
    return suffix.length > 0 ? suffix : fallback;
  }

  return rid || fallback;
}

export function readRuntimeFunctionHint(value: unknown): string | undefined {
  if (typeof value !== "function") {
    return undefined;
  }

  const directName = value.name.trim();
  if (directName.length > 0 && directName !== "anonymous") {
    return directName;
  }

  const raw = Function.prototype.toString.call(value).replace(/\s+/g, " ").trim();
  const arrowPivot = raw.indexOf("=>");
  if (arrowPivot >= 0 && arrowPivot < raw.length - 2) {
    const expression = raw.slice(arrowPivot + 2).trim();
    if (expression.startsWith("{")) {
      return undefined;
    }

    const normalized = expression;
    if (normalized.length > 0 && isRuntimeExpressionHint(normalized)) {
      return normalized.length > 64 ? `${normalized.slice(0, 64)}...` : normalized;
    }
  }

  return undefined;
}

export function normalizeRuntimeName(raw: string, fallback: string): string {
  let value = raw.trim();
  if (value.length === 0) {
    return fallback;
  }

  value = value.replace(/^return\s+/, "");
  value = value.replace(/\s+/g, " ");
  value = value.replace(/^async\s+/, "");
  value = value.replace(/\?\.value\b/g, "");
  value = value.replace(/\.value\b/g, "");
  value = value.replace(/[;]+$/, "");

  if (value.startsWith("{") && value.endsWith("}")) {
    value = value.slice(1, -1).trim();
  }

  if (value.startsWith("(") && value.endsWith(")")) {
    value = value.slice(1, -1).trim();
  }

  const genericNames = new Set(["effect", "effectFn", "runner", "callback", "source", "fn", "value", "watch", "watchEffect"]);
  if (genericNames.has(value)) {
    return fallback;
  }

  if (value.length > 56) {
    return `${value.slice(0, 56)}...`;
  }

  return value || fallback;
}

export function normalizeRuntimeObservedName(raw: string, fallback: string): string {
  const normalized = normalizeRuntimeName(raw, fallback)
    .replace(/(?:\?\.|\.)(?:value|get\(\))$/, "")
    .replace(/\(\)$/, "")
    .trim();

  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(normalized)) {
    return normalized || fallback;
  }

  const segments = normalized.split(".");
  return segments[segments.length - 1] || fallback;
}

export function readRuntimeExplicitName(
  payload: Record<string, unknown>,
  utils: RuntimeMonitorNamingUtils
): string | undefined {
  return utils.readString(payload, "debugName") ?? utils.readString(payload, "name");
}

export function humanizeRuntimeMonitorEventType(type: string): string {
  const known: Record<string, string> = {
    "computed:create": "created",
    "computed:recomputed": "recomputed",
    "effect:create": "created",
    "effect:cleanup": "cleanup",
    "effect:run": "ran",
    "effect:schedule": "scheduled",
    "effect:dispose": "disposed",
    "effect:cleanup:register": "cleanup registered",
    "effect:getCurrent": "current effect checked",
    "watch:create": "watch created",
    "watch:source": "source evaluated",
    "watch:callback": "callback ran",
    "watch:cleanup": "cleanup registered",
    "watch:stop": "watch stopped",
    "watchEffect:create": "watchEffect created",
    "watchEffect:run": "watchEffect ran",
    "watchEffect:cleanup": "watchEffect cleanup",
    "watchEffect:stop": "watchEffect stopped"
  };

  return known[type] ?? type.replaceAll(":", " ");
}

function isRuntimeExpressionHint(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return false;
  }

  if (/[;{}]/.test(normalized)) {
    return false;
  }

  const lower = normalized.toLowerCase();
  return !lower.startsWith("const ")
    && !lower.startsWith("let ")
    && !lower.startsWith("var ")
    && !lower.startsWith("return ")
    && !lower.includes("debug.emit(")
    && !lower.includes("=>");
}