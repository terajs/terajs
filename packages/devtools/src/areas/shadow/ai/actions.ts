import {
  type AIAssistantStructuredResponse,
  type NormalizedAIAssistantOptions
} from "../../../aiHelpers.js";
import { type SafeDocumentContext } from "../../../documentContext.js";
import {
  type AIDiagnosticsSectionKey,
  type AIDocumentContextView,
  type AIAnalysisOutputView,
  type AISessionModeView
} from "../../../panels/diagnosticsPanels.js";
import {
  connectVsCodeDevtoolsBridge,
  disconnectVsCodeDevtoolsBridge,
  retryVsCodeDevtoolsBridgeConnection,
} from "../../../ideBridgeAutoAttach.js";
import type { DevtoolsEvent } from "../../../app.js";
import {
  copyAIDebugPrompt,
  requestConfiguredAIAssistant,
  requestExtensionAIAssistant,
} from "./requestExecution.js";

interface ShadowAIActionsState {
  events: DevtoolsEvent[];
  aiPrompt: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  activeAIRequestTarget: "configured" | "vscode" | null;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
  activeAIDocumentContextView: AIDocumentContextView;
  activeAISessionModeView: AISessionModeView;
  activeAIAnalysisOutputView: AIAnalysisOutputView;
}

interface ShadowAIActionsDependencies {
  target: HTMLElement;
  state: ShadowAIActionsState;
  aiOptions: NormalizedAIAssistantOptions;
  aiRequestTokenRef: { current: number };
  readDocumentContext: () => SafeDocumentContext | null;
  emitDevtoolsEvent: (event: DevtoolsEvent) => void;
  render: () => void;
}

export function handleShadowAIAreaClick({
  target,
  state,
  aiOptions,
  aiRequestTokenRef,
  readDocumentContext,
  emitDevtoolsEvent,
  render
}: ShadowAIActionsDependencies): boolean {
  const aiSection = target.closest<HTMLElement>("[data-ai-section]")?.dataset.aiSection;
  if (isAIDiagnosticsSectionKey(aiSection) && aiSection !== state.activeAIDiagnosticsSection) {
    state.activeAIDiagnosticsSection = aiSection;
    render();
    return true;
  }

  const documentContextView = target.closest<HTMLElement>("[data-ai-document-context-view]")?.dataset.aiDocumentContextView;
  if (isAIDocumentContextView(documentContextView) && documentContextView !== state.activeAIDocumentContextView) {
    state.activeAIDocumentContextView = documentContextView;
    render();
    return true;
  }

  const sessionModeView = target.closest<HTMLElement>("[data-ai-session-mode-view]")?.dataset.aiSessionModeView;
  if (isAISessionModeView(sessionModeView) && sessionModeView !== state.activeAISessionModeView) {
    state.activeAISessionModeView = sessionModeView;
    render();
    return true;
  }

  const analysisOutputView = target.closest<HTMLElement>("[data-ai-analysis-output-view]")?.dataset.aiAnalysisOutputView;
  if (isAIAnalysisOutputView(analysisOutputView) && analysisOutputView !== state.activeAIAnalysisOutputView) {
    state.activeAIAnalysisOutputView = analysisOutputView;
    render();
    return true;
  }

  const requestDependencies = {
    state,
    aiOptions,
    aiRequestTokenRef,
    readDocumentContext,
    emitDevtoolsEvent,
    render
  };

  if (state.aiStatus === "loading") {
    if (target.closest("[data-action='ask-ai']") || target.closest("[data-action='ask-vscode-ai']")) {
      return true;
    }
  }

  if (target.closest("[data-action='ask-ai']")) {
    return requestConfiguredAIAssistant(requestDependencies);
  }

  if (target.closest("[data-action='ask-vscode-ai']")) {
    return requestExtensionAIAssistant(requestDependencies);
  }

  if (target.closest("[data-action='connect-vscode-bridge']")) {
    connectVsCodeDevtoolsBridge();
    render();
    return true;
  }

  if (target.closest("[data-action='retry-vscode-bridge']")) {
    retryVsCodeDevtoolsBridgeConnection();
    render();
    return true;
  }

  if (target.closest("[data-action='disconnect-vscode-bridge']")) {
    disconnectVsCodeDevtoolsBridge();
    render();
    return true;
  }

  if (target.closest("[data-action='copy-debugging-prompt']")) {
    return copyAIDebugPrompt(requestDependencies);
  }

  return false;
}

function isAIDiagnosticsSectionKey(value: unknown): value is AIDiagnosticsSectionKey {
  return value === "session-mode"
    || value === "analysis-output"
    || value === "prompt-inputs"
    || value === "code-references"
    || value === "provider-telemetry"
    || value === "metadata-checks"
    || value === "document-context";
}

function isAIDocumentContextView(value: unknown): value is AIDocumentContextView {
  return value === "overview" || value === "meta-tags" || value === "head-links";
}

function isAISessionModeView(value: unknown): value is AISessionModeView {
  return value === "overview" || value === "coverage";
}

function isAIAnalysisOutputView(value: unknown): value is AIAnalysisOutputView {
  return value === "overview"
    || value === "likely-causes"
    || value === "code-references"
    || value === "next-checks"
    || value === "suggested-fixes"
    || value === "raw-text";
}