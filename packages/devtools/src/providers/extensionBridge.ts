import {
  resolveAIAssistantResponseWithHandlerDetailed,
  type AIAssistantHook,
  type AIAssistantRequest,
  type AIAssistantResolvedResponse,
  type NormalizedAIAssistantOptions
} from "../aiHelpers.js";

export const EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT = "terajs:devtools:extension-ai-bridge:change";
export const MIN_EXTENSION_AI_TIMEOUT_MS = 45000;

export interface ExtensionAIAssistantBridge {
  label: string;
  request: AIAssistantHook;
  revealSession?: () => Promise<void>;
}

declare global {
  var __TERAJS_VSCODE_AI_ASSISTANT__: ExtensionAIAssistantBridge | undefined;
}

export function getExtensionAIAssistantBridge(): ExtensionAIAssistantBridge | null {
  if (typeof globalThis !== "object" || globalThis === null) {
    return null;
  }

  const bridge = globalThis.__TERAJS_VSCODE_AI_ASSISTANT__;
  if (!bridge || typeof bridge !== "object" || typeof bridge.request !== "function") {
    return null;
  }

  return bridge;
}

export function setExtensionAIAssistantBridge(bridge: ExtensionAIAssistantBridge): void {
  globalThis.__TERAJS_VSCODE_AI_ASSISTANT__ = bridge;
  dispatchExtensionAIAssistantBridgeChange();
}

export function clearExtensionAIAssistantBridge(): void {
  if (typeof globalThis !== "object" || globalThis === null) {
    return;
  }

  delete globalThis.__TERAJS_VSCODE_AI_ASSISTANT__;
  dispatchExtensionAIAssistantBridgeChange();
}

export function resolveExtensionAIAssistantTimeoutMs(timeoutMs: number): number {
  return Math.max(timeoutMs, MIN_EXTENSION_AI_TIMEOUT_MS);
}

export async function resolveExtensionAIAssistantResponseDetailed(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<AIAssistantResolvedResponse> {
  const bridge = getExtensionAIAssistantBridge();
  if (!bridge) {
    throw new Error("VS Code AI bridge is not connected.");
  }

  return resolveAIAssistantResponseWithHandlerDetailed(
    request,
    {
      ...options,
      timeoutMs: resolveExtensionAIAssistantTimeoutMs(options.timeoutMs)
    },
    "vscode-extension",
    bridge.request
  );
}

export async function revealExtensionLiveSession(): Promise<void> {
  const bridge = getExtensionAIAssistantBridge();
  if (!bridge || typeof bridge.revealSession !== "function") {
    throw new Error("VS Code live session bridge is not connected.");
  }

  await bridge.revealSession();
}

function dispatchExtensionAIAssistantBridgeChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT));
}