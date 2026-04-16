import {
  type AIAssistantStructuredResponse,
  type NormalizedAIAssistantOptions
} from "../../../aiHelpers.js";
import { type SafeDocumentContext } from "../../../documentContext.js";
import type { AIDiagnosticsSectionKey } from "../../../panels/diagnosticsPanels.js";
import { revealExtensionLiveSession } from "../../../providers/extensionBridge.js";
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

  if (target.closest("[data-action='open-vscode-session']")) {
    void revealExtensionLiveSession().catch(() => {});
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