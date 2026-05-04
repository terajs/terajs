import { mountDevtoolsApp, type DevtoolsAppHandle } from "./app.js";
import { renderDevtoolsIcon } from "./devtoolsIcons.js";
import {
  applyOverlayPanelSize,
  applyOverlayPosition,
  matchesOverlayShortcut,
  resolveOverlayShellClass
} from "./overlayHost.js";
import { createInspectBridge } from "./overlayInspectBridge.js";
import { overlayStyles } from "./overlayRuntimeStyles.js";
import {
  applyPersistedOverlayOptions,
  clearPersistedOverlayPreferences,
  getDefaultOverlayOptions,
  isOverlayPosition,
  isOverlaySize,
  normalizeOverlayOptions,
  savePersistedOverlayPreferences,
  type DevtoolsOverlayOptions,
  type DevtoolsOverlayPosition,
  type DevtoolsOverlaySize,
  type NormalizedOverlayOptions,
  type OverlayPreferencesPayload
} from "./overlayOptions.js";
import {
  autoAttachVsCodeDevtoolsBridge,
  connectVsCodeDevtoolsBridge,
  DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT,
  disconnectVsCodeDevtoolsBridge,
  getDevtoolsIdeBridgeStatus,
  retryVsCodeDevtoolsBridgeConnection,
  stopAutoAttachVsCodeDevtoolsBridge,
  type DevtoolsIdeAutoAttachOptions,
  type DevtoolsIdeBridgeManifest,
  type DevtoolsIdeBridgeMode,
  type DevtoolsIdeBridgeStatus,
} from "./ideBridgeAutoAttach.js";

export type { DevtoolsOverlayOptions } from "./overlayOptions.js";
export { mountDevtoolsApp };
export type { DevtoolsAppOptions } from "./app.js";
export {
  autoAttachVsCodeDevtoolsBridge,
  connectVsCodeDevtoolsBridge,
  DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT,
  disconnectVsCodeDevtoolsBridge,
  getDevtoolsIdeBridgeStatus,
  retryVsCodeDevtoolsBridgeConnection,
  stopAutoAttachVsCodeDevtoolsBridge,
  type DevtoolsIdeAutoAttachOptions,
  type DevtoolsIdeBridgeManifest,
  type DevtoolsIdeBridgeMode,
  type DevtoolsIdeBridgeStatus,
} from "./ideBridgeAutoAttach.js";
export {
  DEVTOOLS_BRIDGE_DISPOSE_EVENT,
  DEVTOOLS_BRIDGE_READY_EVENT,
  DEVTOOLS_BRIDGE_UPDATE_EVENT,
  getDevtoolsBridge,
  readDevtoolsBridgeSession,
  subscribeToDevtoolsBridge,
  waitForDevtoolsBridge,
  type DevtoolsBridgeEventDetail,
  type DevtoolsBridgeEventPhase,
  type DevtoolsBridgeEventRecord,
  type DevtoolsBridgeInstanceSummary,
  type DevtoolsBridgeSessionExport,
  type DevtoolsBridgeSnapshot,
  type DevtoolsBridgeTabName,
  type DevtoolsGlobalBridge,
  type SubscribeToDevtoolsBridgeOptions,
  type WaitForDevtoolsBridgeOptions
} from "./devtoolsBridge.js";

const DEVTOOLS_LAYOUT_PREFERENCES_EVENT = "terajs:devtools:layout-preferences";
const DEVTOOLS_INSPECT_MODE_EVENT = "terajs:devtools:inspect-mode";
const DEVTOOLS_SHELL_WINDOW_ACTION_EVENT = "terajs:devtools:shell-window-action";

function devtoolsMountedFlagHost(): typeof globalThis & { __TERAJS_DEVTOOLS_MOUNTED__?: boolean } {
  return globalThis as typeof globalThis & { __TERAJS_DEVTOOLS_MOUNTED__?: boolean };
}

function markOverlayMounted(): void {
  devtoolsMountedFlagHost().__TERAJS_DEVTOOLS_MOUNTED__ = true;
}

function clearOverlayMountedFlag(): void {
  delete devtoolsMountedFlagHost().__TERAJS_DEVTOOLS_MOUNTED__;
}

let overlayEl: HTMLDivElement | null = null;
let appHandle: DevtoolsAppHandle | null = null;
let keyListener: ((event: KeyboardEvent) => void) | null = null;
let wheelListener: EventListener | null = null;
let layoutPreferencesListener: EventListener | null = null;
let shellWindowActionListener: EventListener | null = null;
let mountRootEl: HTMLElement | null = null;
let panelVisible = false;
let overlayVisible = true;
let inspectModeRequested = false;
let activeOptions: NormalizedOverlayOptions = getDefaultOverlayOptions();

const inspectBridge = createInspectBridge({
  overlayElement: () => overlayEl,
  isPanelVisible: () => panelVisible,
  isOverlayVisible: () => overlayVisible,
  revealPanel: () => {
    if (!panelVisible) {
      toggleDevtoolsOverlay();
    }
  }
});

function setupLayoutPreferencesBridge(): void {
  if (typeof window === "undefined") {
    return;
  }

  layoutPreferencesListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as OverlayPreferencesPayload;
    let layoutChanged = false;
    let persistenceChanged = false;

    if (typeof payload.persistPreferences === "boolean" && payload.persistPreferences !== activeOptions.persistPreferences) {
      activeOptions.persistPreferences = payload.persistPreferences;
      persistenceChanged = true;
    }

    if (isOverlayPosition(payload.position) && payload.position !== activeOptions.position) {
      activeOptions.position = payload.position;
      applyOverlayPosition(overlayEl, activeOptions.position);
      layoutChanged = true;
    }

    if (isOverlaySize(payload.panelSize) && payload.panelSize !== activeOptions.panelSize) {
      activeOptions.panelSize = payload.panelSize;
      applyOverlayPanelSize(overlayEl, activeOptions.panelSize);
      layoutChanged = true;
    }

    if (!layoutChanged && !persistenceChanged) {
      return;
    }

    if (activeOptions.persistPreferences) {
      savePersistedOverlayPreferences(activeOptions);
      return;
    }

    if (persistenceChanged) {
      clearPersistedOverlayPreferences();
    }
  };

  window.addEventListener(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, layoutPreferencesListener);
}

function teardownLayoutPreferencesBridge(): void {
  if (!layoutPreferencesListener || typeof window === "undefined") {
    return;
  }

  window.removeEventListener(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, layoutPreferencesListener);
  layoutPreferencesListener = null;
}

function setupShellWindowActionBridge(): void {
  if (typeof window === "undefined") {
    return;
  }

  shellWindowActionListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const action = (detail as { action?: unknown }).action;
    if (action !== "minimize") {
      return;
    }

    if (!panelVisible) {
      return;
    }

    panelVisible = false;
    applyPanelState();
  };

  window.addEventListener(DEVTOOLS_SHELL_WINDOW_ACTION_EVENT, shellWindowActionListener);
}

function teardownShellWindowActionBridge(): void {
  if (!shellWindowActionListener || typeof window === "undefined") {
    return;
  }

  window.removeEventListener(DEVTOOLS_SHELL_WINDOW_ACTION_EVENT, shellWindowActionListener);
  shellWindowActionListener = null;
}


function panelElement(): HTMLDivElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
}

function fabElement(): HTMLButtonElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-fab") as HTMLButtonElement | null;
}

function inspectToggleElement(): HTMLButtonElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-inspect-toggle") as HTMLButtonElement | null;
}

function dispatchInspectMode(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(DEVTOOLS_INSPECT_MODE_EVENT, {
    detail: {
      enabled
    }
  }));
}

function applyInspectToggleState(): void {
  const inspectToggle = inspectToggleElement();
  if (!inspectToggle) {
    return;
  }

  inspectToggle.classList.toggle("is-active", inspectModeRequested);
  inspectToggle.setAttribute("aria-pressed", inspectModeRequested ? "true" : "false");
  inspectToggle.setAttribute("aria-label", inspectModeRequested ? "Disable component inspect" : "Enable component inspect");
  inspectToggle.setAttribute("title", inspectModeRequested ? "Disable component inspect" : "Enable component inspect");
}

function setInspectModeRequested(enabled: boolean): void {
  inspectModeRequested = enabled;
  applyInspectToggleState();
  dispatchInspectMode(enabled);
}

function applyPanelState(): void {
  const panel = panelElement();
  const fab = fabElement();
  if (!panel || !fab) {
    return;
  }

  panel.classList.toggle("is-hidden", !panelVisible);
  fab.setAttribute("aria-expanded", panelVisible ? "true" : "false");
  inspectBridge.syncContext();
  appHandle?.setVisible(panelVisible && overlayVisible);
}

function applyOverlayVisibility(): void {
  if (!overlayEl) {
    return;
  }

  overlayEl.style.display = overlayVisible ? "block" : "none";
  inspectBridge.syncContext();
  appHandle?.setVisible(panelVisible && overlayVisible);
}

function ensureOverlayAppMounted(): void {
  if (appHandle || !mountRootEl) {
    return;
  }

  setupLayoutPreferencesBridge();
  setupShellWindowActionBridge();

  appHandle = mountDevtoolsApp(mountRootEl, {
    ai: activeOptions.ai,
    bridge: activeOptions.bridge,
    layout: {
      position: activeOptions.position,
      panelSize: activeOptions.panelSize,
      persistPreferences: activeOptions.persistPreferences
    },
    isVisible: () => panelVisible && overlayVisible
  });
}

/**
 * Mounts the Terajs DevTools overlay into the current document.
 *
 * The overlay is development-only and is a no-op in production builds.
 * Repeated calls reuse the existing mount instead of creating duplicates.
 *
 * @param options - Optional overlay behavior and layout configuration.
 */
export function mountDevtoolsOverlay(options?: DevtoolsOverlayOptions): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof document === "undefined") return;
  if (overlayEl && !overlayEl.isConnected) {
    unmountDevtoolsOverlay();
  }
  if (overlayEl) return;

  activeOptions = applyPersistedOverlayOptions(normalizeOverlayOptions(options), options);
  panelVisible = activeOptions.startOpen;
  overlayVisible = true;
  inspectModeRequested = panelVisible;

  overlayEl = document.createElement("div");
  overlayEl.id = "terajs-overlay-container";
  overlayEl.style.position = "fixed";
  overlayEl.style.zIndex = "999999";
  overlayEl.style.pointerEvents = "none";
  overlayEl.style.maxWidth = "calc(100vw - 12px)";
  overlayEl.style.maxHeight = "calc(100vh - 12px)";

  const shadowRoot = overlayEl.attachShadow({ mode: "open" });
  const shellClass = resolveOverlayShellClass(activeOptions.position);
  shadowRoot.innerHTML = `
    <style>${overlayStyles}</style>
    <div id="terajs-devtools-shell" class="${shellClass}">
      <div id="terajs-devtools-panel" class="overlay-frame is-hidden">
        <div id="terajs-devtools-root"></div>
      </div>
      <div class="devtools-fab-cluster">
        <button id="terajs-devtools-fab" class="devtools-fab" type="button" aria-expanded="false" aria-label="Toggle Tera Lens DevTools"><span class="devtools-fab-label">Tera Lens</span></button>
        <button id="terajs-devtools-inspect-toggle" class="devtools-fab-switch" type="button" aria-pressed="false" aria-label="Enable component inspect" title="Enable component inspect">
          <span class="devtools-fab-switch-icon" aria-hidden="true">${renderDevtoolsIcon("inspect", "devtools-icon--lg")}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlayEl);
  markOverlayMounted();
  inspectBridge.setup();
  setInspectModeRequested(inspectModeRequested);
  applyOverlayPosition(overlayEl, activeOptions.position);
  applyOverlayPanelSize(overlayEl, activeOptions.panelSize);

  if (activeOptions.persistPreferences) {
    savePersistedOverlayPreferences(activeOptions);
  }

  const fab = fabElement();
  fab?.addEventListener("click", () => {
    toggleDevtoolsOverlay();
  });

  const inspectToggle = inspectToggleElement();
  inspectToggle?.addEventListener("click", () => {
    setInspectModeRequested(!inspectModeRequested);
  });

  const mountRoot = shadowRoot.getElementById("terajs-devtools-root");
  if (!mountRoot) {
    throw new Error("Terajs devtools failed to create its mount root.");
  }
  mountRootEl = mountRoot;

  if (!activeOptions.lazyMount || panelVisible) {
    ensureOverlayAppMounted();
  }

  keyListener = (event: KeyboardEvent) => {
    if (matchesOverlayShortcut(event, activeOptions.panelShortcut)) {
      event.preventDefault();
      toggleDevtoolsOverlay();
      return;
    }

    if (matchesOverlayShortcut(event, activeOptions.visibilityShortcut)) {
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

    const scrollHost = target.closest(".devtools-panel, .devtools-tabs, .stack-list, .ai-prompt, .ai-response, .components-screen-body, .inspector-surface, .inspector-code, .runtime-history-scroll");
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

/**
 * Toggles the devtools panel between open and closed states.
 *
 * If the overlay has not been mounted yet, this mounts it first with default options.
 */
export function toggleDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  const nextVisible = !panelVisible;
  if (nextVisible) {
    ensureOverlayAppMounted();
  }

  panelVisible = nextVisible;
  applyPanelState();
}

/**
 * Toggles the visibility of the floating devtools overlay shell.
 *
 * If the overlay has not been mounted yet, this mounts it first with default options.
 */
export function toggleDevtoolsVisibility(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  overlayVisible = !overlayVisible;
  applyOverlayVisibility();
}

/**
 * Unmounts the Terajs DevTools overlay and removes all attached listeners.
 */
export function unmountDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;

  stopAutoAttachVsCodeDevtoolsBridge();

  if (wheelListener && overlayEl?.shadowRoot) {
    overlayEl.shadowRoot.removeEventListener("wheel", wheelListener);
    wheelListener = null;
  }

  if (keyListener) {
    document.removeEventListener("keydown", keyListener);
    keyListener = null;
  }

  appHandle?.dispose();
  appHandle = null;

  teardownLayoutPreferencesBridge();
  teardownShellWindowActionBridge();
  inspectBridge.teardown();
  mountRootEl = null;

  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }

  panelVisible = false;
  overlayVisible = true;
  inspectModeRequested = false;
  activeOptions = getDefaultOverlayOptions();
  clearOverlayMountedFlag();
}

