import type { Signal } from "@terajs/reactivity";
import { getActiveSignals } from "@terajs/reactivity";
import type { ReactiveMetadata } from "@terajs/shared";

export type AIActionsParameterType = "string" | "number" | "boolean" | "object" | "array";

export type AIActionsSchema = Record<
  string,
  {
    description: string;
    params?: Record<string, { type: AIActionsParameterType; required?: boolean; description?: string }>;
  }
>;

export type AIActionsDefinition<T extends AIActionsSchema> = {
  schema: T;
  validate(actionName: keyof T, payload: Record<string, unknown>): boolean;
};

function isAllowedParamType(value: unknown, type: AIActionsParameterType): boolean {
  if (type === "array") {
    return Array.isArray(value);
  }

  if (type === "object") {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  return typeof value === type;
}

export function defineAIActions<T extends AIActionsSchema>(schema: T): AIActionsDefinition<T> {
  for (const [actionName, action] of Object.entries(schema)) {
    if (!action.description || action.description.trim().length === 0) {
      throw new Error(`AIActions schema for '${actionName}' must include a non-empty description.`);
    }
  }

  return {
    schema,
    validate(actionName: keyof T, payload: Record<string, unknown>): boolean {
      const action = schema[actionName as string];
      if (!action) {
        return false;
      }

      if (!action.params) {
        return Object.keys(payload).length === 0;
      }

      for (const [paramName, paramSchema] of Object.entries(action.params)) {
        const value = payload[paramName];

        if (value === undefined) {
          if (paramSchema.required) {
            return false;
          }
          continue;
        }

        if (!isAllowedParamType(value, paramSchema.type)) {
          return false;
        }
      }

      return true;
    }
  };
}

function isSensitiveKey(key?: string): boolean {
  if (!key) return false;
  return /pass(word)?|secret|token|credential|api(key)?|auth|private/i.test(key);
}

function normalizeSignalValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeSignalValue(item, seen));
  }

  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);
    const normalized: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      const sanitized = normalizeSignalValue(item, seen);
      if (sanitized !== undefined) {
        normalized[key] = sanitized;
      }
    }

    return normalized;
  }

  return undefined;
}

export type AIStateSnapshot = {
  "@context": string;
  "@type": "TerajsStateSnapshot";
  generatedAt: string;
  signals: Array<{
    "@type": "Signal";
    id: string;
    scope: string;
    type: string;
    key?: string;
    value: unknown;
  }>;
};

export function captureStateSnapshot(signals?: Signal<unknown>[]): AIStateSnapshot {
  const resolvedSignals = signals ?? getActiveSignals();
  const normalizedSignals: Array<{
    "@type": "Signal";
    id: string;
    scope: string;
    type: string;
    key?: string;
    value: unknown;
  }> = resolvedSignals
    .map((signal) => {
      const meta = signal._meta as ReactiveMetadata;
      if (!meta || isSensitiveKey(meta.key)) {
        return null;
      }

      const rawValue = signal();
      const value = normalizeSignalValue(rawValue);
      if (value === undefined) {
        return null;
      }

      return {
        "@type": "Signal" as const,
        id: meta.rid,
        scope: meta.scope,
        type: meta.type,
        ...(meta.key ? { key: meta.key } : {}),
        value
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    "@context": "https://schema.org",
    "@type": "TerajsStateSnapshot",
    generatedAt: new Date().toISOString(),
    signals: normalizedSignals
  };
}
