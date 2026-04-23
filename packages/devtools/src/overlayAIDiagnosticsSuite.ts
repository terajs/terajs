import { expect, it, vi } from "vitest";
import { emitDebug } from "@terajs/shared";
import { connectVsCodeDevtoolsBridge, mountDevtoolsOverlay } from "./overlay";
import { appendTestHeadNode, flushMicrotasks, installClipboardMock } from "./overlaySpecShared.js";

export function registerOverlayAIDiagnosticsSuite(): void {
  it("copies a sanitized debugging prompt without leaking filtered metadata", async () => {
    const clipboard = installClipboardMock();
    document.title = "Terajs Docs";
    document.documentElement.lang = "en";

    const description = document.createElement("meta");
    description.setAttribute("name", "description");
    description.setAttribute("content", "Docs home page");
    appendTestHeadNode(description);

    const csrf = document.createElement("meta");
    csrf.setAttribute("name", "csrf-token");
    csrf.setAttribute("content", "secret-value");
    appendTestHeadNode(csrf);

    mountDevtoolsOverlay();

    emitDebug({
      type: "error:reactivity",
      message: "Sample reactive failure",
      rid: "signal:counter"
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    expect(shadowRoot?.querySelector('[data-action="ask-ai"]')).toBeNull();

    const copyButton = shadowRoot?.querySelector('[data-action="copy-debugging-prompt"]') as HTMLButtonElement | null;
    copyButton?.click();

    await flushMicrotasks();

    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    const prompt = clipboard.writeText.mock.calls[0]?.[0] as string;
    expect(prompt).toContain("Terajs AI Debug Prompt:");
    expect(prompt).toContain("Terajs Docs");
    expect(prompt).toContain("Docs home page");
    expect(prompt).not.toContain("secret-value");
    expect(shadowRoot?.textContent).toContain("Prompt ready");
    expect(shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]')?.textContent).toContain("Debugging prompt ready");

    const sessionModeButton = shadowRoot?.querySelector('[data-ai-section="session-mode"]') as HTMLButtonElement | null;
    sessionModeButton?.click();
    const sessionModePane = shadowRoot?.querySelector('[data-ai-active-section="session-mode"]') as HTMLElement | null;
    expect(sessionModePane?.textContent).toContain("Prompt-only");
    expect(sessionModePane?.textContent).toContain("Copyable prompt only");

    const metadataButton = shadowRoot?.querySelector('[data-ai-section="metadata-checks"]') as HTMLButtonElement | null;
    metadataButton?.click();
    const metadataPane = shadowRoot?.querySelector('[data-ai-active-section="metadata-checks"]') as HTMLElement | null;
    expect(metadataPane?.textContent).toContain("Canonical link tag is missing.");

    const documentButton = shadowRoot?.querySelector('[data-ai-section="document-context"]') as HTMLButtonElement | null;
    documentButton?.click();
    const documentPane = shadowRoot?.querySelector('[data-ai-active-section="document-context"]') as HTMLElement | null;
    expect(documentPane?.textContent).toContain("Docs home page");
  });

  it("keeps the AI tab shell stable when live diagnostics events arrive", async () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    const originalTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    const originalPanel = shadowRoot?.querySelector('.devtools-panel') as HTMLDivElement | null;

    emitDebug({
      type: "error:component",
      timestamp: Date.now(),
      payload: {
        likelyCause: "Live diagnostics update"
      }
    } as any);

    await flushMicrotasks();

    expect(shadowRoot?.querySelector('[data-tab="AI Diagnostics"]')).toBe(originalTab);
    expect(shadowRoot?.querySelector('.devtools-panel')).toBe(originalPanel);
    expect(originalPanel?.textContent).toContain("Analysis Output");
  });

  it("renders structured AI analysis from the VS Code bridge response", async () => {
    const bridge = vi.fn(async () => ({
      summary: "Counter updates are re-entering the same effect.",
      likelyCauses: [
        "An effect mutates the same signal it reads during render.",
        "The recovery path retriggers the same watcher without a guard."
      ],
      codeReferences: [
        {
          file: "src/components/Counter.tera",
          line: 27,
          column: 9,
          reason: "This render path is the most likely write-back site."
        }
      ],
      nextChecks: [
        "Inspect the effect body that mutates count while reading count."
      ],
      suggestedFixes: [
        "Move the write into an event handler or gate the effect on stale input."
      ]
    }));
    (window as typeof window & {
      __TERAJS_VSCODE_AI_ASSISTANT__?: { label: string; request: (payload: unknown) => Promise<unknown> };
    }).__TERAJS_VSCODE_AI_ASSISTANT__ = {
      label: "VS Code AI/Copilot",
      request: bridge
    };
    window.dispatchEvent(new CustomEvent("terajs:devtools:extension-ai-bridge:change"));

    mountDevtoolsOverlay();

    emitDebug({
      type: "error:component",
      level: "error",
      timestamp: Date.now(),
      file: "src/components/Counter.tera",
      line: 27,
      column: 9,
      payload: { message: "Counter render failed" }
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    const askButton = shadowRoot?.querySelector('[data-action="ask-vscode-ai"]') as HTMLButtonElement | null;
    askButton?.click();

    await flushMicrotasks();

    expect(bridge).toHaveBeenCalledTimes(1);
    const analysisPane = shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]') as HTMLElement | null;
    expect(shadowRoot?.textContent).toContain("Structured response ready");
    expect(analysisPane?.textContent).toContain("AI summary");
    expect(analysisPane?.textContent).toContain("Counter updates are re-entering the same effect.");
    expect(analysisPane?.textContent).toContain("Likely causes");
    expect(analysisPane?.textContent).toContain("This render path is the most likely write-back site.");
    expect(analysisPane?.textContent).toContain("Suggested fixes");
    expect(analysisPane?.textContent).toContain("src/components/Counter.tera:27:9");
  });

  it("copies the debugging prompt even when no provider is configured", async () => {
    const clipboard = installClipboardMock();
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    expect(shadowRoot?.querySelector('[data-action="ask-ai"]')).toBeNull();

    const copyButton = shadowRoot?.querySelector('[data-action="copy-debugging-prompt"]') as HTMLButtonElement | null;
    expect(copyButton?.textContent).toContain("Copy Debugging Prompt");
    copyButton?.click();

    await flushMicrotasks();

    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(shadowRoot?.textContent).toContain("Prompt ready");
    expect(shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]')?.textContent).toContain("Copy Debugging Prompt packages the current sanitized bundle");
    expect(shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]')?.textContent).toContain("Debugging prompt ready");

    const sessionModeButton = shadowRoot?.querySelector('[data-ai-section="session-mode"]') as HTMLButtonElement | null;
    sessionModeButton?.click();
    const sessionModePane = shadowRoot?.querySelector('[data-ai-active-section="session-mode"]') as HTMLElement | null;
    expect(sessionModePane?.textContent).toContain("Built-in model:");
    expect(sessionModePane?.textContent).toContain("None. Apps provide the assistant hook or endpoint.");

    const telemetryButton = shadowRoot?.querySelector('[data-ai-section="provider-telemetry"]') as HTMLButtonElement | null;
    telemetryButton?.click();
    const telemetryPane = shadowRoot?.querySelector('[data-ai-active-section="provider-telemetry"]') as HTMLElement | null;
    expect(telemetryPane?.textContent).toContain("No provider-backed assistant request has run yet.");
  });

  it("shows and runs the explicit VS Code AI bridge action when the extension attaches", async () => {
    mountDevtoolsOverlay();

    emitDebug({
      type: "error:component",
      timestamp: Date.now(),
      level: "error",
      file: "src/components/Counter.tera",
      line: 24,
      column: 3,
      payload: { message: "Counter update loop" }
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    expect(shadowRoot?.querySelector('[data-action="ask-vscode-ai"]')).toBeNull();

    let resolveExtensionRequest!: (value: unknown) => void;
    const extensionHook = vi.fn(() => new Promise((resolve) => {
      resolveExtensionRequest = resolve;
    }));
    const revealSession = vi.fn(async () => {});

    (window as typeof window & {
      __TERAJS_VSCODE_AI_ASSISTANT__?: {
        label: string;
        request: (payload: unknown) => Promise<unknown>;
        revealSession?: () => Promise<void>;
      };
    }).__TERAJS_VSCODE_AI_ASSISTANT__ = {
      label: "VS Code AI/Copilot",
      request: extensionHook,
      revealSession
    };
    window.dispatchEvent(new CustomEvent("terajs:devtools:extension-ai-bridge:change"));

    await flushMicrotasks();

    const analysisPane = shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]') as HTMLElement | null;
    const extensionButton = shadowRoot?.querySelector('[data-action="ask-vscode-ai"]') as HTMLButtonElement | null;
    const copyButton = shadowRoot?.querySelector('[data-action="copy-debugging-prompt"]') as HTMLButtonElement | null;
    expect(shadowRoot?.querySelector('[data-action="open-vscode-session"]')).toBeNull();
    expect(extensionButton?.textContent).toContain("Ask Copilot");
    expect(copyButton?.textContent).toContain("Copy Debugging Prompt");
    expect(shadowRoot?.textContent).toContain("Connected and ready");
    expect(analysisPane?.textContent).toContain("Ask Copilot sends the current sanitized bundle directly through the attached extension bridge");

    extensionButton?.click();

    await flushMicrotasks();

    const busyButton = shadowRoot?.querySelector('[data-action="ask-vscode-ai"]') as HTMLButtonElement | null;
    const busyAnalysisPane = shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]') as HTMLElement | null;
    expect(busyButton?.textContent).toContain("Asking Copilot...");
    expect(busyButton?.disabled).toBe(true);
    expect(busyButton?.getAttribute("aria-busy")).toBe("true");
    expect(busyAnalysisPane?.textContent).toContain("Waiting for the attached VS Code bridge to respond with the current sanitized diagnostics bundle...");
    expect(busyAnalysisPane?.textContent).toContain("The attached extension is thinking through the current sanitized diagnostics bundle now.");

    resolveExtensionRequest({
      response: {
        summary: "The attached VS Code bridge reproduced the current runtime issue from the sanitized payload.",
        likelyCauses: [
          "A reactive effect is mutating the same source it reads during the failing render path."
        ],
        nextChecks: [
          "Inspect the effect that writes to the counter during route updates."
        ],
        suggestedFixes: [
          "Move the write behind a user action or guard the effect against stale input."
        ]
      },
      telemetry: {
        model: "copilot/gpt-4.1",
        endpoint: null
      }
    });

    await flushMicrotasks();

    expect(extensionHook).toHaveBeenCalledTimes(1);
    expect(shadowRoot?.textContent).toContain("Structured response ready");
    const refreshedAnalysisPane = shadowRoot?.querySelector('[data-ai-active-section="analysis-output"]') as HTMLElement | null;
    const refreshedExtensionButton = shadowRoot?.querySelector('[data-action="ask-vscode-ai"]') as HTMLButtonElement | null;
    expect(refreshedExtensionButton?.textContent).toContain("Ask Copilot");
    expect(refreshedExtensionButton?.disabled).toBe(false);
    expect(refreshedAnalysisPane?.textContent).toContain("The attached VS Code bridge reproduced the current runtime issue from the sanitized payload.");

    const sessionModeButton = shadowRoot?.querySelector('[data-ai-section="session-mode"]') as HTMLButtonElement | null;
    sessionModeButton?.click();
    const sessionModePane = shadowRoot?.querySelector('[data-ai-active-section="session-mode"]') as HTMLElement | null;
    expect(sessionModePane?.textContent).toContain("VS Code bridge:");
    expect(sessionModePane?.textContent).toContain("Connected and ready");
    expect(sessionModePane?.textContent).toContain("VS Code AI/Copilot via attached extension bridge.");

    const telemetryButton = shadowRoot?.querySelector('[data-ai-section="provider-telemetry"]') as HTMLButtonElement | null;
    telemetryButton?.click();
    const telemetryPane = shadowRoot?.querySelector('[data-ai-active-section="provider-telemetry"]') as HTMLElement | null;
    expect(telemetryPane?.textContent).toContain("VS Code AI bridge");
  });

  it("auto-attaches the VS Code AI bridge from the dev manifest endpoint", async () => {
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: "http://127.0.0.1:4040/live/token",
              ai: "http://127.0.0.1:4040/ai/token",
              reveal: "http://127.0.0.1:4040/reveal/token",
              updatedAt: 1713120000000
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/live/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return "accepted";
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/reveal/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return "accepted";
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/ai/token") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              response: '{"summary":"Attached","likelyCauses":["The VS Code bridge connected automatically from the dev manifest."],"codeReferences":[],"nextChecks":[],"suggestedFixes":[]}',
              telemetry: {
                model: "copilot/test",
                endpoint: null
              }
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledWith("/_terajs/devtools/bridge", expect.objectContaining({ cache: "no-store" }));
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(0);

    const connectButton = shadowRoot?.querySelector('[data-action="connect-vscode-bridge"]') as HTMLButtonElement | null;
    expect(connectButton?.textContent).toContain("Connect VS Code Bridge");
    connectButton?.click();

    await flushMicrotasks();

    const extensionButton = shadowRoot?.querySelector('[data-action="ask-vscode-ai"]') as HTMLButtonElement | null;
    expect(shadowRoot?.querySelector('[data-action="open-vscode-session"]')).toBeNull();
    expect(extensionButton?.textContent === "Ask Copilot" || extensionButton?.textContent === "Asking Copilot...").toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/live/token", expect.objectContaining({ method: "POST" }));

    extensionButton?.click();
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/ai/token", expect.objectContaining({ method: "POST" }));
    expect(shadowRoot?.textContent).toContain("Structured response ready");

    vi.unstubAllGlobals();
  });

  it("starts bridge discovery only after the visible AI tab opens", async () => {
    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: "http://127.0.0.1:4040/live/token",
              ai: "http://127.0.0.1:4040/ai/token",
              reveal: "http://127.0.0.1:4040/reveal/token",
              updatedAt: 1713120000000
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });
      await flushMicrotasks();

      expect(fetchMock).not.toHaveBeenCalled();

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();

      expect(fetchMock).toHaveBeenCalledWith("/_terajs/devtools/bridge", expect.objectContaining({ cache: "no-store" }));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("aborts pending bridge discovery when leaving the AI tab", async () => {
    let aborted = false;
    const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
      const url = String(input);
      if (url !== "/_terajs/devtools/bridge") {
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      }

      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        }, { once: true });
      });
    });

    vi.stubGlobal("fetch", fetchMock as typeof fetch);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const componentsTab = shadowRoot?.querySelector('[data-tab="Components"]') as HTMLButtonElement | null;
      componentsTab?.click();

      await flushMicrotasks();
      expect(aborted).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("refreshes the manifest before an explicit bridge connect", async () => {
    let manifestUpdatedAt = 1713120000000;
    let manifestPort = 4040;
    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: `http://127.0.0.1:${manifestPort}/live/token`,
              ai: `http://127.0.0.1:${manifestPort}/ai/token`,
              reveal: `http://127.0.0.1:${manifestPort}/reveal/token`,
              updatedAt: manifestUpdatedAt
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4041/live/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return JSON.stringify({
              accepted: true,
              phase: "ready",
              state: "connected",
              connectedAt: 1713120005000,
              instanceId: "devtools-instance-1"
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();

      manifestPort = 4041;
      manifestUpdatedAt += 1000;

      const connectButton = shadowRoot?.querySelector('[data-action="connect-vscode-bridge"]') as HTMLButtonElement | null;
      connectButton?.click();
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4041/live/token", expect.objectContaining({ method: "POST" }));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("runs one automatic VS Code AI diagnosis after an explicit bridge connect", async () => {
    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: "http://127.0.0.1:4040/live/token",
              ai: "http://127.0.0.1:4040/ai/token",
              reveal: "http://127.0.0.1:4040/reveal/token",
              updatedAt: 1713120000000
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/live/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return JSON.stringify({
              accepted: true,
              phase: "ready",
              state: "connected",
              connectedAt: 1713120004321,
              instanceId: "devtools-instance-1"
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/ai/token") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              response: '{"summary":"Automatic VS Code diagnosis completed.","likelyCauses":["A route-level effect is re-entering during the current live session."],"codeReferences":[],"nextChecks":["Inspect the first effect that writes during route activation."],"suggestedFixes":["Guard the effect or move the write behind an explicit action."]}',
              telemetry: {
                model: "copilot/test",
                endpoint: null
              }
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/reveal/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return "accepted";
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();

      const connectButton = shadowRoot?.querySelector('[data-action="connect-vscode-bridge"]') as HTMLButtonElement | null;
      connectButton?.click();

      await flushMicrotasks();
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/ai/token")).toHaveLength(1);
      expect(shadowRoot?.textContent).toContain("Automatic VS Code diagnosis completed.");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("stops background manifest polling after discovery while waiting for an explicit connect", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: "http://127.0.0.1:4040/live/token",
              ai: "http://127.0.0.1:4040/ai/token",
              reveal: "http://127.0.0.1:4040/reveal/token",
              updatedAt: 1713120000000
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();

      const manifestCallCountAfterDiscovery = fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/_terajs/devtools/bridge"
      ).length;

      await vi.advanceTimersByTimeAsync(5000);
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(manifestCallCountAfterDiscovery);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("coalesces repeated bridge updates before syncing the live session", async () => {
    vi.useFakeTimers();

    const payloads: string[] = [];
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: "http://127.0.0.1:4040/live/token",
              ai: "http://127.0.0.1:4040/ai/token",
              reveal: "http://127.0.0.1:4040/reveal/token",
              updatedAt: 1713120000000
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/live/token") {
        if (typeof init?.body === "string") {
          payloads.push(init.body);
        }
        return {
          ok: true,
          status: 202,
          async text() {
            return JSON.stringify({
              accepted: true,
              phase: "ready",
              state: "connected",
              connectedAt: 1713120000000,
              instanceId: "devtools-instance-1"
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/ai/token") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              response: '{"summary":"Connected","likelyCauses":[],"codeReferences":[],"nextChecks":[],"suggestedFixes":[]}',
              telemetry: {
                model: "copilot/test",
                endpoint: null
              }
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();

      for (let index = 0; index < 320; index += 1) {
        emitDebug({
          type: "reactive:updated",
          timestamp: 1713120000000 + index,
          payload: {
            key: `bridge-update-${index}`
          }
        } as any);
      }

      connectVsCodeDevtoolsBridge();
      await flushMicrotasks();

      for (let index = 0; index < 50; index += 1) {
        window.dispatchEvent(new CustomEvent("terajs:devtools:bridge:update"));
      }

      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(300);
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(2);
      const readyPayload = JSON.parse(payloads[0] ?? "null") as { session?: { events?: unknown[] } } | null;
      const updatePayload = JSON.parse(payloads[1] ?? "null") as { session?: { events?: unknown[] } } | null;
      expect(Array.isArray(readyPayload?.session?.events)).toBe(true);
      expect(Array.isArray(updatePayload?.session?.events)).toBe(true);
      expect((readyPayload?.session?.events as unknown[] | undefined)?.length ?? 0).toBeGreaterThan((updatePayload?.session?.events as unknown[] | undefined)?.length ?? 0);
      expect((updatePayload?.session?.events as unknown[] | undefined)?.length ?? 0).toBeLessThanOrEqual(200);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("stops manifest polling after a successful bridge attach", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: "http://127.0.0.1:4040/live/token",
              ai: "http://127.0.0.1:4040/ai/token",
              reveal: "http://127.0.0.1:4040/reveal/token",
              updatedAt: 1713120000000
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/live/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return JSON.stringify({
              accepted: true,
              phase: "ready",
              state: "connected",
              connectedAt: 1713120000000,
              instanceId: "devtools-instance-1"
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/ai/token") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              response: '{"summary":"Connected","likelyCauses":[],"codeReferences":[],"nextChecks":[],"suggestedFixes":[]}',
              telemetry: {
                model: "copilot/test",
                endpoint: null
              }
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();
      connectVsCodeDevtoolsBridge();
      await flushMicrotasks();

      const manifestCallCountAfterConnect = fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/_terajs/devtools/bridge"
      ).length;

      await vi.advanceTimersByTimeAsync(5000);
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(manifestCallCountAfterConnect);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("does not retry a failed live bridge until the user explicitly retries", async () => {
    vi.useFakeTimers();

    let manifestUpdatedAt = 1713120000000;
    let manifestPort = 4040;
    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url === "/_terajs/devtools/bridge") {
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify({
              version: 1,
              session: `http://127.0.0.1:${manifestPort}/live/token`,
              ai: `http://127.0.0.1:${manifestPort}/ai/token`,
              reveal: `http://127.0.0.1:${manifestPort}/reveal/token`,
              updatedAt: manifestUpdatedAt
            });
          }
        } as Response;
      }

      if (url === "http://127.0.0.1:4040/live/token") {
        throw new Error("receiver offline");
      }

      if (url === "http://127.0.0.1:4041/live/token") {
        return {
          ok: true,
          status: 202,
          async text() {
            return JSON.stringify({
              accepted: true,
              phase: "ready",
              state: "connected",
              connectedAt: 1713120005000,
              instanceId: "devtools-instance-1"
            });
          }
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      mountDevtoolsOverlay({ startOpen: true });

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      await flushMicrotasks();
      connectVsCodeDevtoolsBridge();
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(2);
      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(1);

      window.dispatchEvent(new CustomEvent("terajs:devtools:bridge:update"));
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(2);
      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(1);

      const retryButton = shadowRoot?.querySelector('[data-action="retry-vscode-bridge"]') as HTMLButtonElement | null;
      retryButton?.click();
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(3);
      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(2);

      manifestPort = 4041;
      manifestUpdatedAt += 1000;

      const retryButtonAfterFailure = shadowRoot?.querySelector('[data-action="retry-vscode-bridge"]') as HTMLButtonElement | null;
      retryButtonAfterFailure?.click();
      await flushMicrotasks();

      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/_terajs/devtools/bridge")).toHaveLength(4);
      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4040/live/token")).toHaveLength(2);
      expect(fetchMock.mock.calls.filter(([input]) => String(input) === "http://127.0.0.1:4041/live/token")).not.toHaveLength(0);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("switches AI diagnostics detail from the left rail", () => {
    emitDebug({
      type: "error:component",
      timestamp: Date.now(),
      level: "error",
      file: "src/components/Counter.tera",
      line: 24,
      column: 3,
      scope: "Counter",
      instance: 1,
      message: "Counter update loop"
    } as any);

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    const promptInputsButton = shadowRoot?.querySelector('[data-ai-section="prompt-inputs"]') as HTMLButtonElement | null;
    promptInputsButton?.click();
    expect(shadowRoot?.querySelector('[data-ai-active-section="prompt-inputs"]')?.textContent).toContain("Evidence included in prompt");

    const metadataButton = shadowRoot?.querySelector('[data-ai-section="metadata-checks"]') as HTMLButtonElement | null;
    metadataButton?.click();
    expect(shadowRoot?.querySelector('[data-ai-active-section="metadata-checks"]')?.textContent).toContain("Metadata checks");

    const codeReferencesButton = shadowRoot?.querySelector('[data-ai-section="code-references"]') as HTMLButtonElement | null;
    codeReferencesButton?.click();
    expect(shadowRoot?.querySelector('[data-ai-active-section="code-references"]')?.textContent).toContain("src/components/Counter.tera:24:3");
  });
}