import { analyzeSafeDocumentContext, type SafeDocumentContext } from "../../../documentContext.js";
import type { AIAssistantStructuredResponse } from "../../../aiHelpers.js";
import { renderAIDiagnosticsPanel, type AIDiagnosticsSectionKey } from "../../../panels/diagnosticsPanels.js";
import type { DevtoolsEvent } from "../../../app.js";

export interface ShadowAIAreaState {
  events: DevtoolsEvent[];
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiLikelyCause: string | null;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  activeAIRequestTarget: "configured" | "vscode" | null;
  aiPrompt: string | null;
  aiAssistantEnabled: boolean;
  aiAssistantEndpoint: string | null;
  aiAssistantModel: string;
  aiAssistantTimeoutMs: number;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
}

export function renderShadowAIArea(
  state: ShadowAIAreaState,
  documentContext: SafeDocumentContext | null
): string {
  return renderAIDiagnosticsPanel({
    ...state,
    documentContext,
    documentDiagnostics: analyzeSafeDocumentContext(documentContext)
  });
}