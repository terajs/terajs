import { shortJson } from "./inspector/shared.js";
import type { SafeDocumentDiagnostic } from "./documentContext.js";
import type { SafeDocumentContext } from "./documentContext.js";

export interface AIAssistantRequest {
  prompt: string;
  snapshot: unknown;
  sanity: unknown;
  events: unknown[];
  document?: SafeDocumentContext | null;
  documentDiagnostics?: SafeDocumentDiagnostic[];
}

export interface AIAssistantOptionsInput {
  enabled?: boolean;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

export interface NormalizedAIAssistantOptions {
  enabled: boolean;
  endpoint: string | null;
  model: string;
  timeoutMs: number;
}

export type AIAssistantHook = (request: AIAssistantRequest) => Promise<unknown> | unknown;
export type AIAssistantProviderKind = "global-hook" | "http-endpoint";
export type AIAssistantFallbackPath = "none" | "global-hook-over-endpoint";

export interface AIAssistantTelemetry {
  provider: AIAssistantProviderKind;
  durationMs: number;
  httpStatus: number | null;
  delivery: "one-shot";
  fallbackPath: AIAssistantFallbackPath;
  model: string;
  endpoint: string | null;
}

export interface AIAssistantResolvedResponse {
  text: string;
  telemetry: AIAssistantTelemetry;
}

export interface AIAssistantRequestFailure extends Error {
  telemetry: AIAssistantTelemetry;
  kind: "timeout" | "http-error" | "request-failed" | "unconfigured";
}

export function normalizeAIAssistantOptions(options?: AIAssistantOptionsInput): NormalizedAIAssistantOptions {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : null;

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : "terajs-assistant";

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : 12000;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

export async function resolveAIAssistantResponse(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<string> {
  const result = await resolveAIAssistantResponseDetailed(request, options);
  return result.text;
}

export async function resolveAIAssistantResponseDetailed(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<AIAssistantResolvedResponse> {
  const globalHook = getGlobalAIAssistantHook();
  if (globalHook) {
    const startedAt = Date.now();
    try {
      const response = await globalHook(request);
      return {
        text: extractAIAssistantResponseText(response),
        telemetry: createAIAssistantTelemetry(options, "global-hook", Date.now() - startedAt, null)
      };
    } catch (error) {
      throw createAIAssistantRequestFailure(
        error instanceof Error ? error.message : "AI request failed.",
        createAIAssistantTelemetry(options, "global-hook", Date.now() - startedAt, null),
        "request-failed"
      );
    }
  }

  if (!options.endpoint) {
    throw createAIAssistantRequestFailure(
      "No AI assistant provider is configured. Set devtools.ai.endpoint or provide window.__TERAJS_AI_ASSISTANT__. ",
      createAIAssistantTelemetry(options, "http-endpoint", 0, null),
      "unconfigured"
    );
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs);

  try {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        prompt: request.prompt,
        snapshot: request.snapshot,
        sanity: request.sanity,
        events: request.events,
        document: request.document ?? undefined,
        documentDiagnostics: request.documentDiagnostics ?? undefined
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw createAIAssistantRequestFailure(
        `AI endpoint returned ${response.status}.`,
        createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, response.status),
        "http-error"
      );
    }

    const rawText = await response.text();
    const telemetry = createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, response.status);
    if (!rawText.trim()) {
      return {
        text: "AI endpoint returned an empty response body.",
        telemetry
      };
    }

    try {
      const parsed = JSON.parse(rawText) as unknown;
      return {
        text: extractAIAssistantResponseText(parsed),
        telemetry
      };
    } catch {
      return {
        text: rawText,
        telemetry
      };
    }
  } catch (error) {
    if (isAIAssistantRequestFailure(error)) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw createAIAssistantRequestFailure(
        `AI request timed out after ${options.timeoutMs}ms.`,
        createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, null),
        "timeout"
      );
    }

    throw createAIAssistantRequestFailure(
      error instanceof Error ? error.message : "AI request failed.",
      createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, null),
      "request-failed"
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function isAIAssistantRequestFailure(value: unknown): value is AIAssistantRequestFailure {
  if (!(value instanceof Error)) {
    return false;
  }

  const candidate = value as Partial<AIAssistantRequestFailure>;
  return (
    typeof candidate.kind === "string"
    && typeof candidate.telemetry?.provider === "string"
    && typeof candidate.telemetry?.durationMs === "number"
  );
}

export function describeInspectorSnapshot(value: unknown): string {
  if (value === undefined || value === null) {
    return "not captured";
  }

  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) {
    return "not captured";
  }

  return shortJson(value);
}

export function prettyJson(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unserializable]";
  }
}

export function getGlobalAIAssistantHook(): AIAssistantHook | null {
  if (typeof globalThis !== "object" || globalThis === null) {
    return null;
  }

  const maybeHook = (globalThis as typeof globalThis & {
    __TERAJS_AI_ASSISTANT__?: unknown;
  }).__TERAJS_AI_ASSISTANT__;

  return typeof maybeHook === "function" ? maybeHook as AIAssistantHook : null;
}

function createAIAssistantTelemetry(
  options: NormalizedAIAssistantOptions,
  provider: AIAssistantProviderKind,
  durationMs: number,
  httpStatus: number | null
): AIAssistantTelemetry {
  return {
    provider,
    durationMs,
    httpStatus,
    delivery: "one-shot",
    fallbackPath: provider === "global-hook" && options.endpoint ? "global-hook-over-endpoint" : "none",
    model: options.model,
    endpoint: options.endpoint
  };
}

function createAIAssistantRequestFailure(
  message: string,
  telemetry: AIAssistantTelemetry,
  kind: AIAssistantRequestFailure["kind"]
): AIAssistantRequestFailure {
  const error = new Error(message) as AIAssistantRequestFailure;
  error.name = "AIAssistantRequestError";
  error.telemetry = telemetry;
  error.kind = kind;
  return error;
}

function extractAIAssistantResponseText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "AI assistant returned an empty string.";
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;

    const direct = payload.response ?? payload.content ?? payload.answer ?? payload.output_text;
    if (typeof direct === "string" && direct.trim().length > 0) {
      return direct;
    }

    const choices = payload.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const message = first?.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (typeof content === "string" && content.trim().length > 0) {
        return content;
      }

      const text = first?.text;
      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  return shortJson(value);
}
