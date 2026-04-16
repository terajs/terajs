import { afterEach, describe } from "vitest";
import { resetDebugListeners, setCurrentContext } from "@terajs/shared";
import { stopAutoAttachVsCodeDevtoolsBridge, unmountDevtoolsOverlay } from "./overlay";
import { registerOverlayAIDiagnosticsSuite } from "./overlayAIDiagnosticsSuite.js";
import { registerOverlayComponentsSuite } from "./overlayComponentsSuite.js";
import { registerOverlayInspectorSuite } from "./overlayInspectorSuite.js";
import { registerOverlayShellSuite } from "./overlayShellSuite.js";
import { OVERLAY_PREFERENCES_STORAGE_KEY, ensureTestStorage } from "./overlaySpecShared.js";

describe("devtools overlay public entry", () => {
  afterEach(() => {
    stopAutoAttachVsCodeDevtoolsBridge();
    unmountDevtoolsOverlay();
    resetDebugListeners();
    setCurrentContext(null);
    delete (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__;
    delete (window as typeof window & { __TERAJS_VSCODE_AI_ASSISTANT__?: unknown }).__TERAJS_VSCODE_AI_ASSISTANT__;
    delete (window as typeof window & { __TERAJS_DEVTOOLS_BRIDGE__?: unknown }).__TERAJS_DEVTOOLS_BRIDGE__;
    ensureTestStorage().removeItem(OVERLAY_PREFERENCES_STORAGE_KEY);
    document.head.querySelectorAll('[data-devtools-doc-test="true"]').forEach((node) => node.remove());
    document.title = "";
    document.documentElement.lang = "";
    document.documentElement.dir = "";
    window.history.replaceState({}, "", "/");
    document.body.innerHTML = "";
  });

  registerOverlayShellSuite();
  registerOverlayInspectorSuite();
  registerOverlayAIDiagnosticsSuite();
  registerOverlayComponentsSuite();
});