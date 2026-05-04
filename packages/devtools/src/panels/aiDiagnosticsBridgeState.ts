import type { SafeDocumentContext } from "../documentContext.js";
import { getDevtoolsIdeBridgeStatus, type DevtoolsIdeBridgeStatus } from "../ideBridgeAutoAttach.js";
import type { AIDiagnosticsStateLike, AIProviderDetails } from "./aiDiagnosticsModel.js";

export interface AIDiagnosticsBridgeState {
  ideBridgeStatus: DevtoolsIdeBridgeStatus;
  canQueryExtensionAssistant: boolean;
  canConnectExtensionBridge: boolean;
  canRetryExtensionBridge: boolean;
  canDisconnectExtensionBridge: boolean;
  vscodeRequestPending: boolean;
  debuggingPromptStatusLabel: string;
  extensionBridgeStatusLabel: string;
  extensionActionLabel: string;
  bridgeConnectActionLabel: string;
  debuggingPromptHint: string;
  extensionActionHint: string;
  ideBridgeHint: string;
  analysisSummary: string;
  integrationWarnings: string[];
}

interface BuildAIDiagnosticsBridgeStateOptions {
  state: AIDiagnosticsStateLike;
  providerDetails: AIProviderDetails;
  componentAIMetadataCount: number;
  routeAIMetadataCount: number;
  mountedAIPreviewCount: number;
  documentContext: SafeDocumentContext | null;
}

export function buildAIDiagnosticsBridgeState(
  options: BuildAIDiagnosticsBridgeStateOptions
): AIDiagnosticsBridgeState {
  const {
    state,
    providerDetails,
    componentAIMetadataCount,
    routeAIMetadataCount,
    mountedAIPreviewCount,
    documentContext
  } = options;
  const ideBridgeStatus = getDevtoolsIdeBridgeStatus();
  const canQueryExtensionAssistant = state.aiAssistantEnabled && providerDetails.hasExtensionBridge;
  const canConnectExtensionBridge = state.aiAssistantEnabled && ideBridgeStatus.mode === "available";
  const canRetryExtensionBridge = state.aiAssistantEnabled && (ideBridgeStatus.mode === "recovering" || ideBridgeStatus.mode === "error");
  const canDisconnectExtensionBridge = ideBridgeStatus.mode === "connecting" || ideBridgeStatus.mode === "connected";
  const vscodeRequestPending = state.aiStatus === "loading" && state.activeAIRequestTarget === "vscode";
  const debuggingPromptStatusLabel = state.aiPrompt
    ? "Debugging prompt ready"
    : "Copy debugging prompt available";
  const extensionBridgeStatusLabel = providerDetails.hasExtensionBridge
    ? "Connected and ready"
    : ideBridgeStatus.mode === "connected"
    ? "VS Code bridge connected"
    : ideBridgeStatus.mode === "connecting"
    ? "Connecting to VS Code bridge"
    : ideBridgeStatus.mode === "available"
    ? "VS Code receiver available"
    : ideBridgeStatus.mode === "recovering"
    ? "VS Code bridge needs retry"
    : ideBridgeStatus.mode === "error"
    ? "VS Code bridge error"
    : ideBridgeStatus.mode === "discovering"
    ? "Searching for VS Code receiver"
    : "VS Code bridge disabled";
  const extensionActionLabel = vscodeRequestPending ? "Asking Copilot..." : "Ask Copilot";
  const bridgeConnectActionLabel = ideBridgeStatus.mode === "connecting"
    ? "Connecting..."
    : canRetryExtensionBridge
    ? "Retry VS Code Bridge"
    : "Connect VS Code Bridge";
  const debuggingPromptHint = canQueryExtensionAssistant
    ? "Ask Copilot sends the current sanitized bundle directly through the attached extension bridge, and the connected VS Code window is ready for direct agent inspection of the same snapshot. Use the prompt panel copy control when you need the same payload for manual use."
    : canConnectExtensionBridge
    ? "A local VS Code receiver is available. Connect the bridge to stream the current sanitized diagnostics bundle directly into the editor, or copy the same bundle from the prompt panel for manual use."
    : canRetryExtensionBridge
    ? "The last VS Code bridge attempt failed. Retry the bridge when the local receiver is healthy again, or copy the sanitized prompt from the prompt panel for manual use."
    : "Use the prompt panel copy control to package the current sanitized bundle so you can paste it into your own agent, ticket, or debugging chat while you attach the VS Code bridge.";
  const extensionActionHint = "The bridge is connected and ready. Ask Copilot sends the same sanitized diagnostics bundle straight through the attached extension bridge.";
  const ideBridgeHint = providerDetails.hasExtensionBridge
    ? "The local extension bridge is attached and ready. It can receive sanitized session updates plus AI diagnostics requests from this page."
    : ideBridgeStatus.lastError
    ? `Last bridge error: ${ideBridgeStatus.lastError}`
    : ideBridgeStatus.mode === "available"
    ? "The page found a live VS Code receiver but is waiting for an explicit connection."
    : ideBridgeStatus.mode === "discovering"
    ? "DevTools is polling for a localhost-only VS Code live receiver manifest."
    : ideBridgeStatus.mode === "connecting"
    ? "DevTools is sending the initial ready payload to the selected VS Code live receiver."
    : ideBridgeStatus.mode === "connected"
    ? "The page is streaming sanitized live session updates to the attached VS Code receiver."
    : ideBridgeStatus.mode === "disabled"
    ? "The local VS Code bridge controller is disabled for this session."
    : "Retry the bridge after the receiver restarts or the manifest changes.";
  const analysisSummary = state.aiStructuredResponse
    ? "Structured response ready"
    : state.aiResponse
    ? "Response ready"
    : state.aiStatus === "loading"
    ? state.activeAIRequestTarget === "vscode"
      ? "VS Code AI running"
      : "Running"
    : state.aiPrompt
    ? canQueryExtensionAssistant
      ? "Connected and ready"
      : "Prompt ready"
    : canQueryExtensionAssistant
    ? "Connected and ready"
    : canConnectExtensionBridge || canRetryExtensionBridge
    ? "Ready to sync"
    : "Prompt-first";
  const integrationWarnings: string[] = [];

  if (!state.aiAssistantEnabled) {
    integrationWarnings.push("Assistant execution is disabled in the DevTools overlay options.");
  } else if (ideBridgeStatus.mode === "available") {
    integrationWarnings.push("VS Code receiver discovered. Connect the bridge to send the current diagnostics bundle directly into VS Code AI.");
  } else if (canRetryExtensionBridge && ideBridgeStatus.lastError) {
    integrationWarnings.push(`VS Code bridge needs a manual retry: ${ideBridgeStatus.lastError}`);
  } else if (!providerDetails.hasExtensionBridge) {
    integrationWarnings.push("VS Code bridge is not attached. Copy Debugging Prompt still packages the current sanitized bundle while you reconnect the live receiver.");
  }

  if (componentAIMetadataCount === 0 && routeAIMetadataCount === 0 && mountedAIPreviewCount === 0) {
    integrationWarnings.push("No component or route AI metadata is currently visible in the mounted app state.");
  }

  if (!documentContext || (documentContext.metaTags.length === 0 && documentContext.linkTags.length === 0 && !documentContext.title)) {
    integrationWarnings.push("No safe document head context is currently available, so AI triage will lean more heavily on route and signal diagnostics.");
  }

  return {
    ideBridgeStatus,
    canQueryExtensionAssistant,
    canConnectExtensionBridge,
    canRetryExtensionBridge,
    canDisconnectExtensionBridge,
    vscodeRequestPending,
    debuggingPromptStatusLabel,
    extensionBridgeStatusLabel,
    extensionActionLabel,
    bridgeConnectActionLabel,
    debuggingPromptHint,
    extensionActionHint,
    ideBridgeHint,
    analysisSummary,
    integrationWarnings
  };
}