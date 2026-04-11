import { mountDevtoolsApp, type DevtoolsAIAssistantOptions } from "./app.js";

export interface DevtoolsOverlayOptions {
  startOpen?: boolean;
  position?: "bottom-left" | "bottom-right" | "bottom-center";
  panelShortcut?: string;
  visibilityShortcut?: string;
  ai?: DevtoolsAIAssistantOptions;
}

interface NormalizedOverlayOptions {
  startOpen: boolean;
  position: "bottom-left" | "bottom-right" | "bottom-center";
  panelShortcut: string;
  visibilityShortcut: string;
  ai: {
    enabled: boolean;
    endpoint: string;
    model: string;
    timeoutMs: number;
  };
}

const DEFAULT_OPTIONS: NormalizedOverlayOptions = {
  startOpen: false,
  position: "bottom-right",
  panelShortcut: "Ctrl+Shift+D",
  visibilityShortcut: "Ctrl+Shift+H",
  ai: {
    enabled: true,
    endpoint: "",
    model: "terajs-assistant",
    timeoutMs: 12000
  }
};

let overlayEl: HTMLDivElement | null = null;
let cleanupOverlay: (() => void) | null = null;
let keyListener: ((event: KeyboardEvent) => void) | null = null;
let wheelListener: EventListener | null = null;
let panelVisible = false;
let overlayVisible = true;
let activeOptions: NormalizedOverlayOptions = {
  ...DEFAULT_OPTIONS,
  ai: { ...DEFAULT_OPTIONS.ai }
};

function normalizeAIAssistantOptions(options?: DevtoolsAIAssistantOptions): NormalizedOverlayOptions["ai"] {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : "";

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : DEFAULT_OPTIONS.ai.model;

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : DEFAULT_OPTIONS.ai.timeoutMs;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

function normalizeOptions(options?: DevtoolsOverlayOptions): NormalizedOverlayOptions {
  const startOpen = typeof options?.startOpen === "boolean"
    ? options.startOpen
    : DEFAULT_OPTIONS.startOpen;
  const position = options?.position === "bottom-left" || options?.position === "bottom-right" || options?.position === "bottom-center"
    ? options.position
    : DEFAULT_OPTIONS.position;
  const panelShortcut = typeof options?.panelShortcut === "string" && options.panelShortcut.trim().length > 0
    ? options.panelShortcut.trim()
    : DEFAULT_OPTIONS.panelShortcut;
  const visibilityShortcut = typeof options?.visibilityShortcut === "string" && options.visibilityShortcut.trim().length > 0
    ? options.visibilityShortcut.trim()
    : DEFAULT_OPTIONS.visibilityShortcut;

  return {
    startOpen,
    position,
    panelShortcut,
    visibilityShortcut,
    ai: normalizeAIAssistantOptions(options?.ai)
  };
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const tokens = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (tokens.length === 0) {
    return false;
  }

  const expectedKey = tokens.find((token) => !["ctrl", "control", "cmd", "meta", "shift", "alt", "option"].includes(token));

  const expectsCtrl = tokens.includes("ctrl") || tokens.includes("control");
  const expectsMeta = tokens.includes("cmd") || tokens.includes("meta");
  const expectsShift = tokens.includes("shift");
  const expectsAlt = tokens.includes("alt") || tokens.includes("option");

  if (expectsCtrl && !(event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (expectsMeta && !event.metaKey) {
    return false;
  }

  if (expectsShift !== event.shiftKey) {
    return false;
  }

  if (expectsAlt !== event.altKey) {
    return false;
  }

  if (!expectedKey) {
    return true;
  }

  return event.key.toLowerCase() === expectedKey;
}

function panelElement(): HTMLDivElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
}

function fabElement(): HTMLButtonElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-fab") as HTMLButtonElement | null;
}

function applyPanelState(): void {
  const panel = panelElement();
  const fab = fabElement();
  if (!panel || !fab) {
    return;
  }

  panel.classList.toggle("is-hidden", !panelVisible);
  fab.setAttribute("aria-expanded", panelVisible ? "true" : "false");
}

function applyOverlayVisibility(): void {
  if (!overlayEl) {
    return;
  }

  overlayEl.style.display = overlayVisible ? "block" : "none";
}

export function mountDevtoolsOverlay(options?: DevtoolsOverlayOptions): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof document === "undefined" || overlayEl) return;

  activeOptions = normalizeOptions(options);
  panelVisible = activeOptions.startOpen;
  overlayVisible = true;

  overlayEl = document.createElement("div");
  overlayEl.id = "terajs-overlay-container";
  overlayEl.style.position = "fixed";
  overlayEl.style.bottom = "16px";
  if (activeOptions.position === "bottom-left") {
    overlayEl.style.left = "20px";
    overlayEl.style.transform = "none";
  } else if (activeOptions.position === "bottom-right") {
    overlayEl.style.right = "20px";
    overlayEl.style.transform = "none";
  } else {
    overlayEl.style.left = "50%";
    overlayEl.style.transform = "translateX(-50%)";
  }
  overlayEl.style.zIndex = "999999";
  overlayEl.style.pointerEvents = "none";

  const shadowRoot = overlayEl.attachShadow({ mode: "open" });
  const shellClass = activeOptions.position === "bottom-left"
    ? "fab-shell is-left"
    : activeOptions.position === "bottom-center"
    ? "fab-shell is-center"
    : "fab-shell";
  shadowRoot.innerHTML = `
    <style>${overlayStyles}</style>
    <div class="${shellClass}">
      <div id="terajs-devtools-panel" class="overlay-frame is-hidden">
        <div id="terajs-devtools-root"></div>
      </div>
      <button id="terajs-devtools-fab" class="devtools-fab" type="button" aria-expanded="false" aria-label="Toggle Terajs DevTools">Terajs</button>
    </div>
  `;

  document.body.appendChild(overlayEl);

  const fab = fabElement();
  fab?.addEventListener("click", () => {
    toggleDevtoolsOverlay();
  });

  const mountRoot = shadowRoot.getElementById("terajs-devtools-root");
  if (!mountRoot) {
    throw new Error("Terajs devtools failed to create its mount root.");
  }

  cleanupOverlay = mountDevtoolsApp(mountRoot, {
    ai: activeOptions.ai
  });

  keyListener = (event: KeyboardEvent) => {
    if (matchesShortcut(event, activeOptions.panelShortcut)) {
      event.preventDefault();
      toggleDevtoolsOverlay();
      return;
    }

    if (matchesShortcut(event, activeOptions.visibilityShortcut)) {
      event.preventDefault();
      toggleDevtoolsVisibility();
    }
  };

  document.addEventListener("keydown", keyListener);

  wheelListener = (event: Event) => {
    const wheelEvent = event as WheelEvent;

    if (!panelVisible) {
      return;
    }

    const panel = panelElement();
    if (!panel) {
      return;
    }

    const path = wheelEvent.composedPath();
    const target = path.find((node): node is Element => node instanceof Element);
    if (!target || !panel.contains(target)) {
      return;
    }

    const scrollHost = target.closest(".devtools-panel, .devtools-tabs, .stack-list, .ai-prompt, .ai-response");
    if (!(scrollHost instanceof HTMLElement)) {
      wheelEvent.preventDefault();
      return;
    }

    const canScroll = scrollHost.scrollHeight > scrollHost.clientHeight + 1;
    if (!canScroll) {
      wheelEvent.preventDefault();
      return;
    }

    const deltaY = wheelEvent.deltaY;
    const atTop = scrollHost.scrollTop <= 0;
    const atBottom = scrollHost.scrollTop + scrollHost.clientHeight >= scrollHost.scrollHeight - 1;

    if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
      wheelEvent.preventDefault();
      return;
    }

    wheelEvent.stopPropagation();
  };

  shadowRoot.addEventListener("wheel", wheelListener, { passive: false });
  applyPanelState();
  applyOverlayVisibility();
}

export function toggleDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  panelVisible = !panelVisible;
  applyPanelState();
}

export function toggleDevtoolsVisibility(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  overlayVisible = !overlayVisible;
  applyOverlayVisibility();
}

export function unmountDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;

  if (wheelListener && overlayEl?.shadowRoot) {
    overlayEl.shadowRoot.removeEventListener("wheel", wheelListener);
    wheelListener = null;
  }

  if (keyListener) {
    document.removeEventListener("keydown", keyListener);
    keyListener = null;
  }

  cleanupOverlay?.();
  cleanupOverlay = null;

  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }

  panelVisible = false;
  overlayVisible = true;
  activeOptions = {
    ...DEFAULT_OPTIONS,
    ai: { ...DEFAULT_OPTIONS.ai }
  };
}

const overlayStyles = `
  :host {
    all: initial;
  }

  .fab-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: auto;
  }

  .fab-shell.is-left {
    align-items: flex-start;
  }

  .fab-shell.is-center {
    align-items: center;
  }

  .devtools-fab {
    appearance: none;
    border: 1px solid rgba(50, 215, 255, 0.36);
    border-radius: 999px;
    background: linear-gradient(135deg, #2f6dff, #32d7ff);
    color: #ffffff;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    min-width: 102px;
    height: 42px;
    padding: 0 18px;
    cursor: pointer;
    box-shadow: 0 12px 28px rgba(47, 109, 255, 0.32);
    transition: transform 120ms ease, box-shadow 140ms ease;
    position: relative;
    z-index: 3;
  }

  .devtools-fab:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(50, 215, 255, 0.28);
  }

  .devtools-fab:focus-visible {
    outline: 2px solid rgba(50, 215, 255, 0.75);
    outline-offset: 2px;
  }

  .overlay-frame {
    --tera-black: #05070f;
    --tera-carbon: #0d1320;
    --tera-graphite: #1d2940;
    --tera-blue: #2f6dff;
    --tera-cyan: #32d7ff;
    --tera-purple: #6f6dff;
    --tera-mist: #93a7cb;
    --tera-cloud: #f2f7ff;
    --tera-body-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --tera-heading-font: "Space Grotesk", "Inter", sans-serif;
    --tera-code-font: "JetBrains Mono", "Fira Code", monospace;
    --tera-surface: var(--tera-carbon);
    --tera-border: rgba(147, 167, 203, 0.18);
    --tera-panel-glow: linear-gradient(145deg, rgba(47, 109, 255, 0.16), rgba(50, 215, 255, 0.11) 44%, rgba(111, 109, 255, 0.1));
    --tera-shadow: 0 24px 60px rgba(2, 8, 20, 0.52);
    position: relative;
    width: min(760px, calc(100vw - 24px));
    height: min(72vh, 840px);
    border: 1px solid var(--tera-border);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--tera-shadow);
    background:
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.16), transparent 28%),
      radial-gradient(circle at bottom left, rgba(111, 109, 255, 0.16), transparent 34%),
      var(--tera-black);
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
    z-index: 2;
  }

  .fab-shell.is-center .overlay-frame {
    transform-origin: bottom center;
  }

  @media (max-width: 860px) {
    .overlay-frame {
      width: min(94vw, 760px);
      height: min(70vh, 760px);
    }
  }

  .overlay-frame.is-hidden {
    display: none;
  }

  #terajs-devtools-root {
    width: 100%;
    height: 100%;
  }

  #terajs-devtools-root[data-theme="light"] {
    color: #181818;
  }

  .devtools-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--panel-bg, transparent);
    color: inherit;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-shell {
    --panel-bg: linear-gradient(180deg, #ffffff, var(--tera-cloud));
  }

  .devtools-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.1) 58%, transparent),
      rgba(13, 19, 32, 0.94);
    backdrop-filter: blur(14px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.1), rgba(50, 215, 255, 0.09) 60%, transparent),
      rgba(255, 255, 255, 0.92);
    border-bottom-color: rgba(46, 46, 46, 0.12);
  }

  .devtools-title {
    font-family: var(--tera-heading-font);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--tera-cloud);
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-title {
    color: #0d2a57;
  }

  .devtools-subtitle,
  .panel-subtitle,
  .muted-text,
  .tiny-muted,
  .metric-label {
    color: var(--tera-mist);
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-subtitle,
  #terajs-devtools-root[data-theme="light"] .panel-subtitle,
  #terajs-devtools-root[data-theme="light"] .muted-text,
  #terajs-devtools-root[data-theme="light"] .tiny-muted,
  #terajs-devtools-root[data-theme="light"] .metric-label {
    color: #626262;
  }

  .devtools-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overscroll-behavior: contain;
  }

  .devtools-tabs {
    width: 132px;
    border-right: 1px solid var(--tera-border);
    background: rgba(13, 13, 13, 0.84);
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding: 8px;
    gap: 6px;
    backdrop-filter: blur(12px);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs {
    background: linear-gradient(180deg, #f4f8ff, #eef4ff);
    border-right-color: rgba(32, 64, 112, 0.16);
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .tab-button,
  .toolbar-button,
  .filter-button,
  .select-button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 8px 10px;
    background: rgba(46, 46, 46, 0.76);
    color: var(--tera-cloud);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition: transform 120ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    text-align: center;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: rgba(50, 215, 255, 0.32);
    background: rgba(50, 215, 255, 0.14);
    transform: translateY(-1px);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: rgba(255, 255, 255, 0.98);
    color: #14284a;
    border-color: rgba(55, 103, 183, 0.2);
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .select-button.is-selected {
    background: linear-gradient(135deg, var(--tera-blue), var(--tera-cyan));
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(47, 109, 255, 0.3);
  }

  .danger-button {
    background: linear-gradient(135deg, #9f1239, #dc2626);
    color: #ffffff;
  }

  .devtools-panel {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 16px;
    background: linear-gradient(180deg, rgba(26, 26, 26, 0.72), rgba(13, 13, 13, 0.9));
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(241, 247, 255, 0.98));
    color: #10213f;
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .ai-panel {
    border: 1px solid rgba(50, 215, 255, 0.3);
    background: linear-gradient(180deg, rgba(17, 45, 94, 0.46), rgba(5, 11, 24, 0.92));
    box-shadow: 0 0 34px rgba(47, 109, 255, 0.2), 0 0 62px rgba(50, 215, 255, 0.16);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel {
    background: linear-gradient(180deg, rgba(235, 245, 255, 0.96), rgba(225, 239, 255, 0.94));
    border-color: rgba(54, 118, 210, 0.28);
    box-shadow: 0 10px 30px rgba(63, 120, 203, 0.18);
  }

  .ask-ai-button {
    background: linear-gradient(135deg, var(--tera-cyan), var(--tera-blue));
    color: #ffffff;
    border: 1px solid rgba(50, 215, 255, 0.38);
    box-shadow: 0 14px 32px rgba(50, 215, 255, 0.2);
  }

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 180px;
    border: 1px solid rgba(111, 109, 255, 0.28);
    border-radius: 14px;
    padding: 14px;
    background: rgba(8, 14, 30, 0.95);
    color: #dfe9ff;
    font-family: var(--tera-code-font);
    font-size: 13px;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 12px;
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 120px;
    border: 1px solid rgba(50, 215, 255, 0.34);
    border-radius: 14px;
    padding: 14px;
    background: rgba(6, 16, 34, 0.96);
    color: #d7f2ff;
    font-family: var(--tera-code-font);
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 10px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: rgba(255, 255, 255, 0.96);
    color: #18253d;
    border-color: rgba(46, 46, 46, 0.2);
  }

  .ai-hint {
    display: block;
    margin-top: 6px;
    color: rgba(147, 167, 203, 0.96);
  }

  .panel-title {
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .is-blue { color: #0a57cc; }
  #terajs-devtools-root[data-theme="light"] .is-green { color: #007e96; }
  #terajs-devtools-root[data-theme="light"] .is-purple { color: #5a43bc; }
  #terajs-devtools-root[data-theme="light"] .is-red { color: #b2204f; }
  #terajs-devtools-root[data-theme="light"] .is-cyan { color: #007da8; }
  #terajs-devtools-root[data-theme="light"] .is-amber { color: #8a5100; }

  .is-blue { color: var(--tera-blue); }
  .is-green { color: var(--tera-cyan); }
  .is-purple { color: var(--tera-purple); }
  .is-red { color: #ff6b8b; }
  .is-cyan { color: var(--tera-cyan); }
  .is-amber { color: #ffc56a; }

  .empty-state {
    padding: 12px 0;
    color: rgba(179, 179, 179, 0.72);
    font-size: 13px;
  }

  #terajs-devtools-root[data-theme="light"] .empty-state {
    color: rgba(46, 46, 46, 0.56);
  }

  .stack-list {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .stack-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .compact-list {
    max-height: 180px;
  }

  .log-list {
    max-height: 320px;
  }

  .stack-item,
  .detail-card,
  .metric-card {
    background: var(--tera-panel-glow), rgba(26, 26, 26, 0.96);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .stack-item,
  #terajs-devtools-root[data-theme="light"] .detail-card,
  #terajs-devtools-root[data-theme="light"] .metric-card {
    background: linear-gradient(145deg, rgba(47, 109, 255, 0.06), rgba(50, 215, 255, 0.05) 52%, rgba(255, 255, 255, 0.94));
    border-color: rgba(46, 46, 46, 0.12);
  }

  .stack-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .item-label,
  .accent-text {
    font-weight: 700;
  }

  .item-label,
  .metric-value,
  .tiny-muted {
    font-family: var(--tera-code-font);
  }

  .issue-error {
    border-color: rgba(255, 107, 139, 0.28);
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffd6de;
  }

  .issue-warn {
    border-color: rgba(255, 197, 106, 0.28);
    background: linear-gradient(145deg, rgba(255, 197, 106, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffe6b0;
  }

  #terajs-devtools-root[data-theme="light"] .issue-error {
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a1738;
  }

  #terajs-devtools-root[data-theme="light"] .issue-warn {
    background: linear-gradient(145deg, rgba(255, 197, 106, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a5400;
  }

  .timeline-active {
    border-left: 3px solid var(--tera-cyan);
  }

  .timeline-inactive {
    opacity: 0.7;
  }

  .performance-item {
    border-left: 3px solid var(--tera-purple);
  }

  .button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 12px 0;
  }

  .metric-value {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 700;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .metric-value {
    color: #181818;
  }

  .range-wrap {
    margin: 12px 0;
  }

  .timeline-slider {
    width: 100%;
    accent-color: var(--tera-blue);
  }

  .devtools-panel::-webkit-scrollbar,
  .devtools-tabs::-webkit-scrollbar,
  .stack-list::-webkit-scrollbar,
  .ai-prompt::-webkit-scrollbar,
  .ai-response::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .devtools-panel::-webkit-scrollbar-track,
  .devtools-tabs::-webkit-scrollbar-track,
  .stack-list::-webkit-scrollbar-track,
  .ai-prompt::-webkit-scrollbar-track,
  .ai-response::-webkit-scrollbar-track {
    background: rgba(9, 20, 39, 0.46);
    border-radius: 999px;
  }

  .devtools-panel::-webkit-scrollbar-thumb,
  .devtools-tabs::-webkit-scrollbar-thumb,
  .stack-list::-webkit-scrollbar-thumb,
  .ai-prompt::-webkit-scrollbar-thumb,
  .ai-response::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(55, 139, 255, 0.88), rgba(50, 215, 255, 0.76));
    border-radius: 999px;
    border: 2px solid rgba(9, 20, 39, 0.46);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-track {
    background: rgba(206, 220, 243, 0.88);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(64, 126, 213, 0.9), rgba(39, 174, 217, 0.86));
    border-color: rgba(206, 220, 243, 0.88);
  }
`;
