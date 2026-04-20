import type { Signal } from "@terajs/reactivity";
import { getActiveSignals } from "@terajs/reactivity";
import type { ReactiveMetadata } from "@terajs/shared";

export type AIActionsParameterType = "string" | "number" | "boolean" | "object" | "array";

/**
 * Declarative action schema exposed to AI integrations.
 */
export type AIActionsSchema = Record<
  string,
  {
    description: string;
    params?: Record<string, { type: AIActionsParameterType; required?: boolean; description?: string }>;
  }
>;

/**
 * Validated action definition returned by {@link defineAIActions}.
 */
export type AIActionsDefinition<T extends AIActionsSchema> = {
  schema: T;
  validate(actionName: keyof T, payload: Record<string, unknown>): boolean;
};

export type AIChatbotRole = "system" | "user" | "assistant";

/**
 * Conversation item sent to a chatbot transport.
 */
export type AIChatbotMessage = {
  role: AIChatbotRole;
  content: string;
};

export type AIChatbotMetadataValue = string | number | boolean | null;

/**
 * Normalized request payload emitted by {@link createAIChatbot}.
 */
export type AIChatbotRequest<T extends AIActionsSchema = AIActionsSchema> = {
  "@context": "https://schema.org";
  "@type": "TerajsChatbotRequest";
  generatedAt: string;
  message: string;
  conversation: AIChatbotMessage[];
  actions: T;
  state?: AIStateSnapshot;
  metadata?: Record<string, AIChatbotMetadataValue>;
};

type AIChatbotFetchResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type AIChatbotFetch = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
    credentials: "same-origin" | "omit";
  }
) => Promise<AIChatbotFetchResponse>;

/**
 * Chatbot factory options with conservative transport defaults.
 */
export type AIChatbotOptions<T extends AIActionsSchema = AIActionsSchema> = {
  endpoint: string;
  actions?: T | AIActionsDefinition<T>;
  enabled?: boolean;
  includeStateSnapshot?: boolean;
  signals?: Signal<unknown>[];
  allowExternalEndpoint?: boolean;
  origin?: string;
  headers?: Record<string, string>;
  fetch?: AIChatbotFetch;
};

export type AIChatbotRequestOptions = {
  conversation?: AIChatbotMessage[];
  metadata?: Record<string, AIChatbotMetadataValue>;
  signals?: Signal<unknown>[];
};

/**
 * Result returned by a chatbot transport call.
 */
export type AIChatbotResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

/**
 * High-level chatbot helper built on top of Terajs AI primitives.
 */
export type AIChatbot<T extends AIActionsSchema = AIActionsSchema> = {
  endpoint: string;
  schema: T;
  isEnabled(): boolean;
  validateAction(actionName: keyof T, payload: Record<string, unknown>): boolean;
  captureSnapshot(signals?: Signal<unknown>[]): AIStateSnapshot | null;
  buildRequest(message: string, options?: AIChatbotRequestOptions): AIChatbotRequest<T>;
  sendMessage(message: string, options?: AIChatbotRequestOptions): Promise<AIChatbotResult>;
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

/**
 * Defines a typed AI action schema with runtime payload validation.
 */
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

/**
 * Sanitized signal snapshot exported for AI and tooling integrations.
 */
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

/**
 * Captures a sanitized signal snapshot, filtering sensitive keyed values.
 */
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

function isAIChatbotRole(value: unknown): value is AIChatbotRole {
  return value === "system" || value === "user" || value === "assistant";
}

function normalizeConversation(conversation?: AIChatbotMessage[]): AIChatbotMessage[] {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation
    .filter((entry) => isAIChatbotRole(entry?.role) && typeof entry?.content === "string")
    .map((entry) => ({ role: entry.role, content: entry.content.trim() }))
    .filter((entry) => entry.content.length > 0);
}

function normalizeMetadata(
  metadata?: Record<string, AIChatbotMetadataValue>
): Record<string, AIChatbotMetadataValue> | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const normalizedEntries = Object.entries(metadata).filter(([, value]) => {
    return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  });

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function resolveChatbotEndpoint(endpoint: string): string {
  const normalizedEndpoint = endpoint.trim();

  if (normalizedEndpoint.length === 0) {
    throw new Error("AI chatbot endpoint must be a non-empty string.");
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(normalizedEndpoint) && !isAbsoluteHttpUrl(normalizedEndpoint)) {
    throw new Error("AI chatbot endpoint must use a relative URL or an http(s) URL.");
  }

  return normalizedEndpoint;
}

function resolveOrigin(origin?: string): string | null {
  if (typeof origin === "string" && origin.trim().length > 0) {
    return origin.trim();
  }

  const locationOrigin = (globalThis as { location?: { origin?: string } }).location?.origin;
  return typeof locationOrigin === "string" && locationOrigin.length > 0 ? locationOrigin : null;
}

function assertSafeEndpoint(endpoint: string, allowExternalEndpoint: boolean, origin?: string): void {
  if (!isAbsoluteHttpUrl(endpoint) || allowExternalEndpoint) {
    return;
  }

  const currentOrigin = resolveOrigin(origin);
  if (!currentOrigin) {
    throw new Error("AI chatbot endpoint must be relative or same-origin unless allowExternalEndpoint is true.");
  }

  if (new URL(endpoint).origin !== currentOrigin) {
    throw new Error("AI chatbot endpoint must be relative or same-origin unless allowExternalEndpoint is true.");
  }
}

function resolveFetchImplementation(fetchImplementation?: AIChatbotFetch): AIChatbotFetch {
  if (typeof fetchImplementation === "function") {
    return fetchImplementation;
  }

  const globalFetch = (globalThis as { fetch?: unknown }).fetch;
  if (typeof globalFetch === "function") {
    return globalFetch as AIChatbotFetch;
  }

  throw new Error("AI chatbot sendMessage requires a fetch implementation.");
}

function isAIActionsDefinition<T extends AIActionsSchema>(
  value: T | AIActionsDefinition<T>
): value is AIActionsDefinition<T> {
  return typeof (value as { validate?: unknown })?.validate === "function";
}

function resolveAIActionsDefinition<T extends AIActionsSchema>(
  actions?: T | AIActionsDefinition<T>
): AIActionsDefinition<T> {
  if (!actions) {
    return defineAIActions({} as T);
  }

  return isAIActionsDefinition(actions) ? actions : defineAIActions(actions);
}

function captureConfiguredSnapshot(
  includeStateSnapshot: boolean,
  configuredSignals?: Signal<unknown>[],
  requestSignals?: Signal<unknown>[]
): AIStateSnapshot | null {
  if (Array.isArray(requestSignals)) {
    return captureStateSnapshot(requestSignals);
  }

  if (!includeStateSnapshot || !Array.isArray(configuredSignals)) {
    return null;
  }

  return captureStateSnapshot(configuredSignals);
}

async function readChatbotResponseBody(response: AIChatbotFetchResponse): Promise<unknown> {
  const body = await response.text();

  if (body.length === 0) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

/**
 * Creates a production-safe chatbot helper with same-origin transport defaults,
 * explicit external endpoint opt-in, and optional sanitized state snapshots.
 */
export function createAIChatbot<T extends AIActionsSchema = AIActionsSchema>(
  options: AIChatbotOptions<T>
): AIChatbot<T> {
  const endpoint = resolveChatbotEndpoint(options.endpoint);
  const actions = resolveAIActionsDefinition(options.actions);
  const includeStateSnapshot = options.includeStateSnapshot === true;
  const configuredSignals = options.signals;
  const headers = {
    "content-type": "application/json",
    ...options.headers
  };

  const buildRequest = (message: string, requestOptions: AIChatbotRequestOptions = {}): AIChatbotRequest<T> => {
    const normalizedMessage = message.trim();
    if (normalizedMessage.length === 0) {
      throw new Error("AI chatbot message must be a non-empty string.");
    }

    const state = captureConfiguredSnapshot(includeStateSnapshot, configuredSignals, requestOptions.signals);
    const metadata = normalizeMetadata(requestOptions.metadata);

    return {
      "@context": "https://schema.org",
      "@type": "TerajsChatbotRequest",
      generatedAt: new Date().toISOString(),
      message: normalizedMessage,
      conversation: normalizeConversation(requestOptions.conversation),
      actions: actions.schema,
      ...(state ? { state } : {}),
      ...(metadata ? { metadata } : {})
    };
  };

  return {
    endpoint,
    schema: actions.schema,
    isEnabled(): boolean {
      return options.enabled !== false;
    },
    validateAction(actionName: keyof T, payload: Record<string, unknown>): boolean {
      return actions.validate(actionName, payload);
    },
    captureSnapshot(signals?: Signal<unknown>[]): AIStateSnapshot | null {
      return captureConfiguredSnapshot(includeStateSnapshot, configuredSignals, signals);
    },
    buildRequest,
    async sendMessage(message: string, requestOptions?: AIChatbotRequestOptions): Promise<AIChatbotResult> {
      if (options.enabled === false) {
        throw new Error("AI chatbot is disabled.");
      }

      assertSafeEndpoint(endpoint, options.allowExternalEndpoint === true, options.origin);

      const response = await resolveFetchImplementation(options.fetch)(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(buildRequest(message, requestOptions)),
        credentials: options.allowExternalEndpoint === true ? "omit" : "same-origin"
      });

      const data = await readChatbotResponseBody(response);

      if (!response.ok) {
        throw new Error(`AI chatbot request failed with status ${response.status}.`);
      }

      return {
        ok: response.ok,
        status: response.status,
        data
      };
    }
  };
}
