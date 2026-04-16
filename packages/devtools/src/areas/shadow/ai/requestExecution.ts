import { captureStateSnapshot } from "@terajs/adapter-ai";
import { getDebugListenerCount } from "@terajs/shared";
import { buildAIPrompt } from "../../../aiPrompt.js";
import {
  getGlobalAIAssistantHook,
  isAIAssistantRequestFailure,
  resolveAIAssistantResponseDetailed,
  type AIAssistantProviderKind,
  type AIAssistantRequestFailure,
  type AIAssistantResolvedResponse,
  type AIAssistantStructuredResponse,
  type NormalizedAIAssistantOptions
} from "../../../aiHelpers.js";
import { analyzeSafeDocumentContext, type SafeDocumentContext } from "../../../documentContext.js";
import { resolveExtensionAIAssistantResponseDetailed } from "../../../providers/extensionBridge.js";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "../../../sanity.js";
import type { AIDiagnosticsSectionKey } from "../../../panels/diagnosticsPanels.js";
import type { DevtoolsEvent } from "../../../app.js";

interface ShadowAIActionsState {
  events: DevtoolsEvent[];
  aiPrompt: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  activeAIRequestTarget: "configured" | "vscode" | null;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
}

interface ShadowAIActionsDependencies {
  state: ShadowAIActionsState;
  aiOptions: NormalizedAIAssistantOptions;
  aiRequestTokenRef: { current: number };
  readDocumentContext: () => SafeDocumentContext | null;
  emitDevtoolsEvent: (event: DevtoolsEvent) => void;
  render: () => void;
}

interface PreparedAIAssistantRequest {
  prompt: string;
  snapshot: ReturnType<typeof captureStateSnapshot>;
  sanity: ReturnType<typeof computeSanityMetrics>;
  recentEvents: DevtoolsEvent[];
  documentContext: SafeDocumentContext | null;
  documentDiagnostics: ReturnType<typeof analyzeSafeDocumentContext>;
  baseTelemetryPayload: {
    model: string;
    endpoint: string | null;
    promptChars: number;
    signalCount: number;
    recentEventCount: number;
    documentMetaCount: number;
    documentLinkCount: number;
    documentDiagnosticCount: number;
  };
}

export function requestConfiguredAIAssistant(dependencies: ShadowAIActionsDependencies): boolean {
  const prepared = prepareAIAssistantRequest(dependencies, { resetAssistantOutput: true });
  if (!prepared) {
    return true;
  }

  const hasGlobalHook = getGlobalAIAssistantHook() !== null;
  if (!hasGlobalHook && !dependencies.aiOptions.endpoint) {
    dependencies.emitDevtoolsEvent({
      type: "ai:assistant:skipped",
      timestamp: Date.now(),
      level: "warn",
      payload: {
        ...prepared.baseTelemetryPayload,
        reason: "unconfigured"
      }
    });
    dependencies.state.aiStatus = "idle";
    dependencies.state.activeAIRequestTarget = null;
    dependencies.render();
    return true;
  }

  return runAIAssistantRequest(dependencies, prepared, {
    provider: hasGlobalHook ? "global-hook" : "http-endpoint",
    requestModel: dependencies.aiOptions.model,
    requestEndpoint: dependencies.aiOptions.endpoint,
    fallbackPath: hasGlobalHook && dependencies.aiOptions.endpoint ? "global-hook-over-endpoint" : "none",
    execute: () => resolveAIAssistantResponseDetailed({
      prompt: prepared.prompt,
      snapshot: prepared.snapshot,
      sanity: prepared.sanity,
      events: prepared.recentEvents,
      document: prepared.documentContext,
      documentDiagnostics: prepared.documentDiagnostics
    }, dependencies.aiOptions)
  });
}

export function requestExtensionAIAssistant(dependencies: ShadowAIActionsDependencies): boolean {
  const prepared = prepareAIAssistantRequest(dependencies, { resetAssistantOutput: true });
  if (!prepared) {
    return true;
  }

  return runAIAssistantRequest(dependencies, prepared, {
    provider: "vscode-extension",
    requestModel: "VS Code AI/Copilot",
    requestEndpoint: "VS Code extension live attach",
    fallbackPath: "none",
    skippedReason: "extension-unavailable",
    execute: () => resolveExtensionAIAssistantResponseDetailed({
      prompt: prepared.prompt,
      snapshot: prepared.snapshot,
      sanity: prepared.sanity,
      events: prepared.recentEvents,
      document: prepared.documentContext,
      documentDiagnostics: prepared.documentDiagnostics
    }, dependencies.aiOptions)
  });
}

export function copyAIDebugPrompt(dependencies: ShadowAIActionsDependencies): boolean {
  const prepared = prepareAIAssistantRequest(dependencies, { resetAssistantOutput: false });
  if (!prepared) {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(prepared.prompt).catch(() => {});
  }

  dependencies.render();
  return true;
}

function prepareAIAssistantRequest(
  dependencies: ShadowAIActionsDependencies,
  options: {
    resetAssistantOutput: boolean;
  }
): PreparedAIAssistantRequest | null {
  const snapshot = captureStateSnapshot();
  const documentContext = dependencies.readDocumentContext();
  const documentDiagnostics = analyzeSafeDocumentContext(documentContext);
  const recentEvents = dependencies.state.events.slice(-120);
  const sanity = computeSanityMetrics(dependencies.state.events, {
    ...DEFAULT_SANITY_THRESHOLDS,
    debugListenerCount: getDebugListenerCount()
  });

  dependencies.state.aiPrompt = buildAIPrompt({
    document: documentContext,
    documentDiagnostics,
    snapshot,
    sanity,
    events: dependencies.state.events
  });
  dependencies.state.aiError = null;
  if (options.resetAssistantOutput) {
    dependencies.state.aiResponse = null;
    dependencies.state.aiStructuredResponse = null;
  }

  const prompt = dependencies.state.aiPrompt;
  if (!prompt) {
    dependencies.state.aiStatus = "error";
    dependencies.state.activeAIRequestTarget = null;
    dependencies.state.aiError = "Unable to generate an AI prompt for the current state.";
    dependencies.render();
    return null;
  }

  return {
    prompt,
    snapshot,
    sanity,
    recentEvents,
    documentContext,
    documentDiagnostics,
    baseTelemetryPayload: {
      model: dependencies.aiOptions.model,
      endpoint: dependencies.aiOptions.endpoint,
      promptChars: prompt.length,
      signalCount: snapshot.signals.length,
      recentEventCount: recentEvents.length,
      documentMetaCount: documentContext?.metaTags.length ?? 0,
      documentLinkCount: documentContext?.linkTags.length ?? 0,
      documentDiagnosticCount: documentDiagnostics.length
    }
  };
}

function runAIAssistantRequest(
  dependencies: ShadowAIActionsDependencies,
  prepared: PreparedAIAssistantRequest,
  config: {
    provider: AIAssistantProviderKind;
    requestModel: string;
    requestEndpoint: string | null;
    fallbackPath: string;
    skippedReason?: string;
    execute: () => Promise<AIAssistantResolvedResponse>;
  }
): boolean {
  if (!dependencies.aiOptions.enabled) {
    dependencies.emitDevtoolsEvent({
      type: "ai:assistant:skipped",
      timestamp: Date.now(),
      level: "warn",
      payload: {
        ...prepared.baseTelemetryPayload,
        reason: "disabled"
      }
    });
    dependencies.state.aiStatus = "idle";
    dependencies.state.activeAIRequestTarget = null;
    dependencies.render();
    return true;
  }

  const token = ++dependencies.aiRequestTokenRef.current;
  dependencies.emitDevtoolsEvent({
    type: "ai:assistant:request",
    timestamp: Date.now(),
    level: "info",
    payload: {
      requestId: token,
      provider: config.provider,
      delivery: "one-shot",
      fallbackPath: config.fallbackPath,
      ...prepared.baseTelemetryPayload,
      model: config.requestModel,
      endpoint: config.requestEndpoint
    }
  });
  dependencies.state.aiStatus = "loading";
  dependencies.state.activeAIRequestTarget = config.provider === "vscode-extension" ? "vscode" : "configured";
  dependencies.render();

  void config.execute().then((response) => {
    if (token !== dependencies.aiRequestTokenRef.current) {
      return;
    }

    dependencies.state.aiStatus = "ready";
  dependencies.state.activeAIRequestTarget = null;
    dependencies.state.aiResponse = response.text;
    dependencies.state.aiStructuredResponse = response.structured;
    dependencies.state.aiError = null;
    dependencies.emitDevtoolsEvent({
      type: "ai:assistant:success",
      timestamp: Date.now(),
      level: "info",
      payload: {
        requestId: token,
        provider: response.telemetry.provider,
        delivery: response.telemetry.delivery,
        fallbackPath: response.telemetry.fallbackPath,
        model: response.telemetry.model,
        endpoint: response.telemetry.endpoint,
        durationMs: response.telemetry.durationMs,
        statusCode: response.telemetry.httpStatus,
        responseChars: response.text.length
      }
    });
    dependencies.render();
  }).catch((error) => {
    if (token !== dependencies.aiRequestTokenRef.current) {
      return;
    }

    const failure = isAIAssistantRequestFailure(error)
      ? error
      : null;
    dependencies.state.aiStatus = "error";
    dependencies.state.activeAIRequestTarget = null;
    dependencies.state.aiError = error instanceof Error ? error.message : "AI request failed.";
    dependencies.state.aiResponse = null;
    dependencies.state.aiStructuredResponse = null;
    dependencies.emitDevtoolsEvent({
      type: "ai:assistant:error",
      timestamp: Date.now(),
      level: "error",
      payload: {
        requestId: token,
        provider: failure?.telemetry.provider ?? config.provider,
        delivery: failure?.telemetry.delivery ?? "one-shot",
        fallbackPath: failure?.telemetry.fallbackPath ?? config.fallbackPath,
        model: failure?.telemetry.model ?? config.requestModel,
        endpoint: failure?.telemetry.endpoint ?? config.requestEndpoint,
        durationMs: failure?.telemetry.durationMs ?? 0,
        statusCode: failure?.telemetry.httpStatus ?? null,
        errorKind: failure?.kind ?? (config.skippedReason ?? "request-failed"),
        message: error instanceof Error ? error.message : "AI request failed."
      }
    });
    dependencies.render();
  });

  return true;
}