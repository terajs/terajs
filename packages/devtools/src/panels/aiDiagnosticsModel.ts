import { getGlobalAIAssistantHook, type AIAssistantStructuredResponse } from "../aiHelpers.js";
import { type SafeDocumentContext, type SafeDocumentDiagnostic } from "../documentContext.js";
import { type DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { shortJson } from "../inspector/shared.js";
import { getExtensionAIAssistantBridge } from "../providers/extensionBridge.js";

/** Active detail section for the AI diagnostics workspace. */
export type AIDiagnosticsSectionKey =
  | "session-mode"
  | "analysis-output"
  | "prompt-inputs"
  | "code-references"
  | "provider-telemetry"
  | "metadata-checks"
  | "document-context";

/** Active sub-view for the document context detail area. */
export type AIDocumentContextView = "overview" | "meta-tags" | "head-links";

/** Active sub-view for the Session Mode detail area. */
export type AISessionModeView = "overview" | "coverage";

/** Active sub-view for the structured AI analysis detail area. */
export type AIAnalysisOutputView = "overview" | "likely-causes" | "code-references" | "next-checks" | "suggested-fixes" | "raw-text";

/** Default section shown when the diagnostics workspace first opens. */
export const DEFAULT_AI_DIAGNOSTICS_SECTION: AIDiagnosticsSectionKey = "analysis-output";

/** Default document context sub-view shown when its detail area opens. */
export const DEFAULT_AI_DOCUMENT_CONTEXT_VIEW: AIDocumentContextView = "overview";

/** Default Session Mode sub-view shown when its detail area opens. */
export const DEFAULT_AI_SESSION_MODE_VIEW: AISessionModeView = "overview";

/** Default structured AI analysis sub-view shown when a response is available. */
export const DEFAULT_AI_ANALYSIS_OUTPUT_VIEW: AIAnalysisOutputView = "overview";

export interface AIDiagnosticsStateLike {
  events: DevtoolsEventLike[];
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  aiStatus: "idle" | "loading" | "ready" | "error";
  activeAIRequestTarget: "configured" | "vscode" | null;
  aiLikelyCause: string | null;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  aiPrompt: string | null;
  aiAssistantEnabled: boolean;
  aiAssistantEndpoint: string | null;
  aiAssistantModel: string;
  aiAssistantTimeoutMs: number;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
  activeAIDocumentContextView: AIDocumentContextView;
  activeAISessionModeView: AISessionModeView;
  activeAIAnalysisOutputView: AIAnalysisOutputView;
  documentContext?: SafeDocumentContext | null;
  documentDiagnostics?: SafeDocumentDiagnostic[];
}

export interface AIPromptInputSummary {
  label: string;
  summary: string;
  severity: "info" | "warn" | "error";
}

export interface AIAssistantRequestSummary {
  requestId: number | null;
  provider: string;
  delivery: string;
  fallbackPath: string;
  promptChars: number | null;
  signalCount: number | null;
  recentEventCount: number | null;
}

export interface AIAssistantOutcomeSummary {
  type: "success" | "error" | "skipped";
  provider: string;
  delivery: string;
  fallbackPath: string;
  durationMs: number | null;
  statusCode: number | null;
  message: string | null;
  errorKind: string | null;
  skippedReason: string | null;
}

export interface AIAssistantTelemetrySummary {
  requestCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  lastRequest: AIAssistantRequestSummary | null;
  lastOutcome: AIAssistantOutcomeSummary | null;
}

export interface AIProviderDetails {
  label: string;
  hasGlobalHook: boolean;
  hasEndpoint: boolean;
  hasExtensionBridge: boolean;
  activePath: string;
  detail: string;
  builtInModel: string;
}

export function hasInspectableAIValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

function summarizeAIPromptIssue(event: DevtoolsEventLike): string {
  const payload = event.payload;
  if (!payload) {
    return event.type;
  }

  if (event.type === "queue:fail") {
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    const attempts = typeof payload.attempts === "number" ? payload.attempts : undefined;
    const error = typeof payload.error === "string" ? payload.error : "unknown error";
    const attemptsSuffix = attempts === undefined
      ? ""
      : ` after ${attempts} attempt${attempts === 1 ? "" : "s"}`;

    return `Queue mutation ${type} failed${attemptsSuffix}: ${error}`;
  }

  if (event.type === "queue:conflict") {
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    const decision = typeof payload.decision === "string" ? payload.decision : "replace";
    return `Queue conflict for ${type} resolved as ${decision}`;
  }

  if (event.type === "queue:skip:missing-handler") {
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    return `Queue handler missing for mutation type ${type}`;
  }

  if (event.type === "hub:error") {
    const transport = typeof payload.transport === "string" ? payload.transport : "hub";
    const message = typeof payload.message === "string" ? payload.message : "unknown error";
    return `Realtime ${transport} transport error: ${message}`;
  }

  if (event.type === "hub:disconnect") {
    const transport = typeof payload.transport === "string" ? payload.transport : "hub";
    const reason = typeof payload.reason === "string" ? payload.reason : "connection closed";
    return `Realtime ${transport} disconnected: ${reason}`;
  }

  if (typeof payload.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  if (typeof payload.likelyCause === "string" && payload.likelyCause.length > 0) {
    return payload.likelyCause;
  }

  return shortJson(payload).slice(0, 220);
}

function isAIPromptIssueEvent(event: DevtoolsEventLike): boolean {
  if (event.type.startsWith("ai:assistant:")) {
    return false;
  }

  return (
    event.level === "warn"
    || event.level === "error"
    || event.type.startsWith("error:")
    || event.type.includes("warn")
    || event.type.includes("hydration")
    || event.type === "hub:error"
    || event.type === "hub:disconnect"
    || event.type === "queue:fail"
    || event.type === "queue:conflict"
    || event.type === "queue:skip:missing-handler"
  );
}

export function collectAIPromptInputs(state: AIDiagnosticsStateLike): AIPromptInputSummary[] {
  const inputs: AIPromptInputSummary[] = [];
  const seen = new Set<string>();

  for (const diagnostic of state.documentDiagnostics ?? []) {
    const key = `Document diagnostic:${diagnostic.id}`;
    seen.add(key);
    inputs.push({
      label: `document:${diagnostic.id}`,
      summary: diagnostic.detail ?? diagnostic.message,
      severity: diagnostic.severity
    });

    if (inputs.length >= 6) {
      return inputs;
    }
  }

  if (state.aiError) {
    const key = `Assistant error:${state.aiError}`;
    seen.add(key);
    inputs.push({
      label: "Assistant error",
      summary: state.aiError,
      severity: "error"
    });
  }

  if (state.aiLikelyCause) {
    const key = `Likely cause:${state.aiLikelyCause}`;
    seen.add(key);
    inputs.push({
      label: "Likely cause",
      summary: state.aiLikelyCause,
      severity: "warn"
    });
  }

  for (let index = state.events.length - 1; index >= 0 && inputs.length < 6; index -= 1) {
    const event = state.events[index];
    if (!isAIPromptIssueEvent(event)) {
      continue;
    }

    const summary = summarizeAIPromptIssue(event);
    const key = `${event.type}:${summary}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    inputs.push({
      label: event.type,
      summary,
      severity: event.level === "error" || event.type.startsWith("error:") ? "error" : "warn"
    });
  }

  return inputs;
}

function readStringPayload(payload: Record<string, unknown> | undefined, key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function readNumberPayload(payload: Record<string, unknown> | undefined, key: string): number | null {
  const value = payload?.[key];
  return typeof value === "number" ? value : null;
}

export function collectAIAssistantTelemetry(events: DevtoolsEventLike[]): AIAssistantTelemetrySummary {
  const summary: AIAssistantTelemetrySummary = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    lastRequest: null,
    lastOutcome: null
  };

  for (const event of events) {
    const payload = event.payload;

    if (event.type === "ai:assistant:request") {
      summary.requestCount += 1;
      summary.lastRequest = {
        requestId: readNumberPayload(payload, "requestId"),
        provider: readStringPayload(payload, "provider") ?? "unknown",
        delivery: readStringPayload(payload, "delivery") ?? "one-shot",
        fallbackPath: readStringPayload(payload, "fallbackPath") ?? "none",
        promptChars: readNumberPayload(payload, "promptChars"),
        signalCount: readNumberPayload(payload, "signalCount"),
        recentEventCount: readNumberPayload(payload, "recentEventCount")
      };
      continue;
    }

    if (event.type === "ai:assistant:success") {
      summary.successCount += 1;
      summary.lastOutcome = {
        type: "success",
        provider: readStringPayload(payload, "provider") ?? "unknown",
        delivery: readStringPayload(payload, "delivery") ?? "one-shot",
        fallbackPath: readStringPayload(payload, "fallbackPath") ?? "none",
        durationMs: readNumberPayload(payload, "durationMs"),
        statusCode: readNumberPayload(payload, "statusCode"),
        message: null,
        errorKind: null,
        skippedReason: null
      };
      continue;
    }

    if (event.type === "ai:assistant:error") {
      summary.errorCount += 1;
      summary.lastOutcome = {
        type: "error",
        provider: readStringPayload(payload, "provider") ?? "unknown",
        delivery: readStringPayload(payload, "delivery") ?? "one-shot",
        fallbackPath: readStringPayload(payload, "fallbackPath") ?? "none",
        durationMs: readNumberPayload(payload, "durationMs"),
        statusCode: readNumberPayload(payload, "statusCode"),
        message: readStringPayload(payload, "message"),
        errorKind: readStringPayload(payload, "errorKind"),
        skippedReason: null
      };
      continue;
    }

    if (event.type === "ai:assistant:skipped") {
      summary.skippedCount += 1;
      summary.lastOutcome = {
        type: "skipped",
        provider: "none",
        delivery: "one-shot",
        fallbackPath: "none",
        durationMs: null,
        statusCode: null,
        message: null,
        errorKind: null,
        skippedReason: readStringPayload(payload, "reason")
      };
    }
  }

  return summary;
}

export function formatAIAssistantProvider(provider: string): string {
  if (provider === "global-hook") {
    return "Global hook";
  }

  if (provider === "http-endpoint") {
    return "HTTP endpoint";
  }

  if (provider === "vscode-extension") {
    return "VS Code AI bridge";
  }

  return provider;
}

export function formatAIAssistantFallbackPath(fallbackPath: string): string {
  if (fallbackPath === "global-hook-over-endpoint") {
    return "Global hook preferred over configured endpoint";
  }

  return "None";
}

export function formatAIAssistantOutcome(outcome: AIAssistantOutcomeSummary): string {
  if (outcome.type === "success") {
    return "Success";
  }

  if (outcome.type === "error") {
    return outcome.errorKind ? `Failed (${outcome.errorKind})` : "Failed";
  }

  if (outcome.skippedReason === "disabled") {
    return "Skipped (assistant disabled)";
  }

  if (outcome.skippedReason === "unconfigured") {
    return "Skipped (no provider configured)";
  }

  return "Skipped";
}

export function resolveAIProviderDetails(state: AIDiagnosticsStateLike): AIProviderDetails {
  const hasGlobalHook = getGlobalAIAssistantHook() !== null;
  const hasEndpoint = typeof state.aiAssistantEndpoint === "string" && state.aiAssistantEndpoint.length > 0;
  const hasExtensionBridge = getExtensionAIAssistantBridge() !== null;
  const builtInModel = hasExtensionBridge
    ? "VS Code AI/Copilot via attached extension bridge."
    : "None. Apps provide the assistant hook or endpoint.";

  if (!state.aiAssistantEnabled) {
    return {
      label: "Disabled",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: "Assistant calls disabled",
      detail: hasExtensionBridge
        ? "DevTools can still assemble prompts, but it will not send them to the attached extension bridge or any app-configured provider until devtools.ai.enabled is turned back on."
        : "DevTools can still assemble prompts, but it will not send them until devtools.ai.enabled is turned back on.",
      builtInModel
    };
  }

  if (hasGlobalHook && hasExtensionBridge) {
    return {
      label: "Local hook + VS Code bridge",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: "window.__TERAJS_AI_ASSISTANT__",
      detail: hasEndpoint
        ? "A local in-page assistant hook and configured endpoint are both available, while the attached extension provides the primary VS Code live bridge for this workflow."
        : "A local in-page assistant hook is available, while the attached extension provides the primary VS Code live bridge for this workflow.",
      builtInModel
    };
  }

  if (hasGlobalHook && hasEndpoint) {
    return {
      label: "Global hook",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: "window.__TERAJS_AI_ASSISTANT__",
      detail: "A local in-page assistant hook is active and takes precedence over the configured endpoint while it is present.",
      builtInModel
    };
  }

  if (hasGlobalHook) {
    return {
      label: "Global hook",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: "window.__TERAJS_AI_ASSISTANT__",
      detail: "The app is providing its own local assistant bridge through a global hook.",
      builtInModel
    };
  }

  if (hasEndpoint && hasExtensionBridge) {
    return {
      label: "HTTP endpoint + VS Code bridge",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: state.aiAssistantEndpoint as string,
      detail: "A configured assistant endpoint is available, while Ask Copilot sends the same sanitized payload directly through the attached local extension bridge.",
      builtInModel
    };
  }

  if (hasEndpoint) {
    return {
      label: "HTTP endpoint",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: state.aiAssistantEndpoint as string,
      detail: "DevTools will POST the assembled prompt, snapshot, sanity metrics, and recent events to the configured endpoint.",
      builtInModel
    };
  }

  if (hasExtensionBridge) {
    return {
      label: "VS Code AI bridge",
      hasGlobalHook,
      hasEndpoint,
      hasExtensionBridge,
      activePath: "window.__TERAJS_VSCODE_AI_ASSISTANT__",
      detail: "The attached live extension can run the same sanitized diagnostics bundle directly through VS Code AI/Copilot, even when the page itself does not expose a hook or endpoint.",
      builtInModel
    };
  }

  return {
    label: "Prompt-only",
    hasGlobalHook,
    hasEndpoint,
    hasExtensionBridge,
    activePath: "Copyable prompt only",
    detail: "No assistant provider is configured yet, so this panel can build and copy a rich prompt but cannot query a model on its own.",
    builtInModel
  };
}