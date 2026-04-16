import { afterEach, describe, expect, it, vi } from "vitest";
import type { AIAssistantRequest, NormalizedAIAssistantOptions } from "../aiHelpers.js";
import {
  clearExtensionAIAssistantBridge,
  revealExtensionLiveSession,
  resolveExtensionAIAssistantResponseDetailed,
  resolveExtensionAIAssistantTimeoutMs,
  setExtensionAIAssistantBridge,
} from "./extensionBridge.js";

const TEST_REQUEST: AIAssistantRequest = {
  prompt: "Inspect the current runtime session.",
  snapshot: { signals: [] },
  sanity: { alerts: [] },
  events: []
};

const TEST_OPTIONS: NormalizedAIAssistantOptions = {
  enabled: true,
  endpoint: null,
  model: "test-assistant",
  timeoutMs: 25
};

afterEach(() => {
  clearExtensionAIAssistantBridge();
  vi.useRealTimers();
});

describe("extensionBridge", () => {
  it("uses a longer timeout floor for VS Code bridge requests", async () => {
    vi.useFakeTimers();

    setExtensionAIAssistantBridge({
      label: "VS Code AI/Copilot",
      request: () => new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            response: "Bridge response ready.",
            telemetry: {
              model: "copilot/test",
              endpoint: null
            }
          });
        }, TEST_OPTIONS.timeoutMs + 20);
      })
    });

    const pending = resolveExtensionAIAssistantResponseDetailed(TEST_REQUEST, TEST_OPTIONS);
    await vi.advanceTimersByTimeAsync(TEST_OPTIONS.timeoutMs + 25);

    await expect(pending).resolves.toMatchObject({
      text: "Bridge response ready.",
      telemetry: expect.objectContaining({
        provider: "vscode-extension"
      })
    });
  });

  it("reports the effective bridge timeout floor", () => {
    expect(resolveExtensionAIAssistantTimeoutMs(12000)).toBe(45000);
    expect(resolveExtensionAIAssistantTimeoutMs(60000)).toBe(60000);
  });

  it("reveals the attached live session when supported", async () => {
    const revealSession = vi.fn(async () => {});
    setExtensionAIAssistantBridge({
      label: "VS Code AI/Copilot",
      request: async () => ({ response: "ok" }),
      revealSession
    });

    await expect(revealExtensionLiveSession()).resolves.toBeUndefined();
    expect(revealSession).toHaveBeenCalledTimes(1);
  });
});