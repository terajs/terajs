import { resolveDevtoolsAreaHostKind } from "./areas/registry.js";
import { syncIframeAreaHost } from "./areas/iframe/render.js";

export interface ActiveStandardTabPatchOptions {
  root: HTMLElement;
  activeTab: string;
  theme: "dark" | "light";
  updateHeaderEventCount: () => void;
  renderAIPanel: () => string;
  renderIframeMarkup: () => string;
  renderFallback: () => void;
  syncBridge: () => void;
}

export function patchActiveStandardTab(options: ActiveStandardTabPatchOptions): void {
  options.updateHeaderEventCount();

  if (options.activeTab === "AI Diagnostics") {
    const panel = options.root.querySelector<HTMLElement>(".devtools-panel");
    if (!panel) {
      options.renderFallback();
      return;
    }

    panel.innerHTML = options.renderAIPanel();
    options.syncBridge();
    return;
  }

  if (resolveDevtoolsAreaHostKind(options.activeTab) === "iframe") {
    syncIframeAreaHost(options.root, {
      title: options.activeTab,
      theme: options.theme,
      markup: options.renderIframeMarkup()
    });
    options.syncBridge();
    return;
  }

  options.renderFallback();
}