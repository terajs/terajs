import { clearDebugHistory, Debug, readDebugHistory, subscribeDebug } from "@terajs/shared";
import { captureStateSnapshot } from "@terajs/adapter-ai";
import { collectRecentCodeReferences } from "./aiDebugContext.js";
import { renderIframePanelContent } from "./appIframePanelContent.js";
import { renderComponentDrilldownFromState } from "./appInspectorRendering.js";
import { computeSanityMetrics } from "./sanity.js";
import { RouteSessions } from "./routeSessions.js";
import { LIVE_DEVTOOLS_TABS, resolveDevtoolsAreaHostKind } from "./areas/registry.js";
import { renderIframeAreaHost, syncIframeAreaHost } from "./areas/iframe/render.js";
import { generateLikelyCause } from "./inspector/dataCollectors.js";
import {
  applyComponentLifecycle,
  collectComponentDrilldown,
  type MountedComponentEntry
} from "./inspector/componentData.js";
import {
  type InspectorSectionKey,
} from "./inspector/drilldownRenderer.js";
import {
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  type AIDiagnosticsSectionKey
} from "./panels/diagnosticsPanels.js";
import { renderShadowAIArea } from "./areas/shadow/ai/render.js";
import { normalizeEvent } from "./eventNormalization.js";
import { appendPrioritizedDevtoolsEvent, retainPrioritizedDevtoolsEvents } from "./eventRetention.js";
import { buildComponentKey } from "./inspector/shared.js";
import {
  normalizeAIAssistantOptions,
  type AIAssistantStructuredResponse,
} from "./aiHelpers.js";
import { EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT } from "./providers/extensionBridge.js";
import {
  autoAttachVsCodeDevtoolsBridge,
  DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT,
  getDevtoolsIdeBridgeStatus,
  stopAutoAttachVsCodeDevtoolsBridge,
} from "./ideBridgeAutoAttach.js";
import { patchShadowComponentsArea, captureComponentsScrollPositions, scheduleComponentsScrollRestore } from "./areas/shadow/components/render.js";
import { createClickHandler } from "./appClickHandler.js";
import { renderAppShell } from "./appShell.js";
import { createAutomaticIdeBridgeDiagnosisHandler } from "./areas/shadow/ai/requestExecution.js";
import {
  registerDevtoolsBridgeInstance,
  type DevtoolsBridgeTabName,
} from "./devtoolsBridge.js";
import { analyzeSafeDocumentContext, captureSafeDocumentContext, summarizeSafeDocumentContext } from "./documentContext.js";
import {
  createChangeHandler,
  createComponentPickedHandler,
  createHoverHandlers,
  createInputHandler
} from "./appDomHandlers.js";
import { eventAffectsComponentTree, eventTouchesSelectedComponent } from "./appEventEffects.js";
import { patchActiveStandardTab as patchStandardTab } from "./appTabPatching.js";

export interface DevtoolsEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

export interface DevtoolsAIAssistantOptions {
  enabled?: boolean;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

export interface DevtoolsBridgeOptions {
  enabled?: boolean;
}

type DevtoolsOverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type DevtoolsOverlaySize = "normal" | "large";

interface DevtoolsLayoutOptions {
  position?: DevtoolsOverlayPosition;
  panelSize?: DevtoolsOverlaySize;
  persistPreferences?: boolean;
}

export interface DevtoolsAppOptions {
  ai?: DevtoolsAIAssistantOptions;
  layout?: DevtoolsLayoutOptions;
  bridge?: DevtoolsBridgeOptions;
  isVisible?: () => boolean;
}

export interface DevtoolsAppHandle {
  dispose(): void;
  setVisible(visible: boolean): void;
}

function isBridgeEnabled(options?: DevtoolsBridgeOptions): boolean {
  if (typeof options?.enabled === "boolean") {
    return options.enabled;
  }

  return process.env.NODE_ENV !== "production";
}

interface NormalizedAIAssistantOptions {
  enabled: boolean;
  endpoint: string | null;
  model: string;
  timeoutMs: number;
}

interface NormalizedLayoutOptions {
  position: DevtoolsOverlayPosition;
  panelSize: DevtoolsOverlaySize;
  persistPreferences: boolean;
}

interface AIAssistantRequest {
  prompt: string;
  snapshot: ReturnType<typeof captureStateSnapshot>;
  sanity: ReturnType<typeof computeSanityMetrics>;
  events: DevtoolsEvent[];
}

type AIAssistantHook = (request: AIAssistantRequest) => Promise<unknown> | unknown;

declare global {
  interface Window {
    __TERAJS_AI_ASSISTANT__?: AIAssistantHook;
  }
}

type TabName =
  | "Components"
  | "AI Diagnostics"
  | "Signals"
  | "Meta"
  | "Issues"
  | "Logs"
  | "Timeline"
  | "Router"
  | "Queue"
  | "Performance"
  | "Sanity Check"
  | "Settings";

type AIAssistantRequestTarget = "configured" | "vscode" | null;

interface DevtoolsState {
  activeTab: TabName;
  events: DevtoolsEvent[];
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  expandedComponentNodeKeys: Set<string>;
  componentTreeInitialized: boolean;
  componentTreeVersion: number;
  expandedComponentTreeVersion: number;
  expandedInspectorSections: Set<InspectorSectionKey>;
  expandedValuePaths: Set<string>;
  eventCount: number;
  selectedMetaKey: string | null;
  selectedComponentKey: string | null;
  selectedComponentActivityVersion: number;
  componentSearchQuery: string;
  componentInspectorQuery: string;
  issueFilter: "all" | "error" | "warn";
  logFilter: "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";
  timelineCursor: number;
  theme: "dark" | "light";
  aiPrompt: string | null;
  aiLikelyCause: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  activeAIRequestTarget: AIAssistantRequestTarget;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
  aiAssistantEnabled: boolean;
  aiAssistantEndpoint: string | null;
  aiAssistantModel: string;
  aiAssistantTimeoutMs: number;
  hostControlsOpen: boolean;
  overlayPosition: DevtoolsOverlayPosition;
  overlayPanelSize: DevtoolsOverlaySize;
  persistOverlayPreferences: boolean;
}

const TABS: TabName[] = [...LIVE_DEVTOOLS_TABS];

const DEFAULT_EXPANDED_INSPECTOR_SECTIONS: InspectorSectionKey[] = [];
const MAX_DEVTOOLS_EVENTS = 4000;
const MAX_LIVE_BRIDGE_UPDATE_EVENTS = 200;

const DEVTOOLS_INSPECT_MODE_EVENT = "terajs:devtools:inspect-mode";
const DEVTOOLS_COMPONENT_SELECT_EVENT = "terajs:devtools:component-select";
const DEVTOOLS_COMPONENT_PICKED_EVENT = "terajs:devtools:component-picked";
const DEVTOOLS_COMPONENT_HOVER_EVENT = "terajs:devtools:component-hover";
const DEVTOOLS_LAYOUT_PREFERENCES_EVENT = "terajs:devtools:layout-preferences";

export function mountDevtoolsApp(root: HTMLElement, options: DevtoolsAppOptions = {}): DevtoolsAppHandle {
  const aiOptions = normalizeAIAssistantOptions(options.ai);
  const routeSessions = new RouteSessions();
  const layoutOptions = normalizeLayoutOptions(options.layout);
  const bridgeEnabled = isBridgeEnabled(options.bridge);
  const isVisible = () => options.isVisible?.() !== false;
  const readDocumentContext = () => captureSafeDocumentContext();
  const hydrateEvent = (event: DevtoolsEvent): DevtoolsEvent => {
    if (event.type !== "reactive:error" && event.type !== "error:reactivity") {
      return event;
    }

    const likelyCause = generateLikelyCause(event.payload);
    if (!likelyCause) {
      return event;
    }

    return {
      ...event,
      payload: {
        ...(event.payload ?? {}),
        likelyCause
      }
    };
  };

  const hydratedMountedComponents = new Map<string, {
    key: string;
    scope: string;
    instance: number;
    aiPreview?: string;
    lastSeenAt: number;
  }>();
  const hydratedExpandedComponentNodeKeys = new Set<string>();
  let hydratedLikelyCause: string | null = null;
  const hydratedEvents = readDebugHistory()
    .map((rawEvent) => normalizeEvent(rawEvent))
    .filter((event): event is DevtoolsEvent => event !== null)
    .map((event) => {
      const hydratedEvent = hydrateEvent(event);
      applyComponentLifecycle(hydratedMountedComponents, hydratedExpandedComponentNodeKeys, hydratedEvent);
      const likelyCause = typeof hydratedEvent.payload?.likelyCause === "string"
        ? hydratedEvent.payload.likelyCause
        : null;

      if (likelyCause) {
        hydratedLikelyCause = likelyCause;
      }

      return hydratedEvent;
    })
    .reduce<DevtoolsEvent[]>((events, event) => {
      return appendPrioritizedDevtoolsEvent(events, event, MAX_DEVTOOLS_EVENTS);
    }, []);
  routeSessions.hydrate(hydratedEvents);

  const state: DevtoolsState = {
    activeTab: "Components",
    events: hydratedEvents,
    mountedComponents: hydratedMountedComponents,
    expandedComponentNodeKeys: hydratedExpandedComponentNodeKeys,
    componentTreeInitialized: false,
    componentTreeVersion: 0,
    expandedComponentTreeVersion: 0,
    expandedInspectorSections: new Set(DEFAULT_EXPANDED_INSPECTOR_SECTIONS),
    expandedValuePaths: new Set(),
    eventCount: hydratedEvents.length,
    selectedMetaKey: null,
    selectedComponentKey: null,
    selectedComponentActivityVersion: 0,
    componentSearchQuery: "",
    componentInspectorQuery: "",
    issueFilter: "all",
    logFilter: "all",
    timelineCursor: hydratedEvents.length - 1,
    theme: "dark",
    aiPrompt: null,
    aiLikelyCause: hydratedLikelyCause,
    aiStatus: "idle",
    activeAIRequestTarget: null,
    aiResponse: null,
    aiStructuredResponse: null,
    aiError: null,
    activeAIDiagnosticsSection: DEFAULT_AI_DIAGNOSTICS_SECTION,
    aiAssistantEnabled: aiOptions.enabled,
    aiAssistantEndpoint: aiOptions.endpoint,
    aiAssistantModel: aiOptions.model,
    aiAssistantTimeoutMs: aiOptions.timeoutMs,
    hostControlsOpen: false,
    overlayPosition: layoutOptions.position,
    overlayPanelSize: layoutOptions.panelSize,
    persistOverlayPreferences: layoutOptions.persistPreferences
  };
  let visible = isVisible();
  let pendingVisibleRefresh = false;
  const aiRequestTokenRef = { current: 0 };
  let devtoolsBridge: ReturnType<typeof registerDevtoolsBridgeInstance> | null = null;

  const stopIdleIdeBridgeDiscovery = () => {
    const bridgeStatus = getDevtoolsIdeBridgeStatus();
    if (bridgeStatus.mode === "discovering" || bridgeStatus.mode === "available") {
      stopAutoAttachVsCodeDevtoolsBridge();
    }
  };

  const syncIdeBridgeDiscovery = () => {
    if (!bridgeEnabled || !state.aiAssistantEnabled) {
      stopIdleIdeBridgeDiscovery();
      return;
    }

    const bridgeStatus = getDevtoolsIdeBridgeStatus();
    const shouldDiscoverBridge = visible && state.activeTab === "AI Diagnostics";
    if (shouldDiscoverBridge) {
      if (bridgeStatus.mode === "disabled") {
        autoAttachVsCodeDevtoolsBridge();
      }
      return;
    }

    stopIdleIdeBridgeDiscovery();
  };

  const updateHeaderEventCount = () => {
    const subtitle = root.querySelector<HTMLElement>(".devtools-subtitle");
    if (subtitle) {
      const routeEvents = state.events;

      subtitle.textContent = `Events: ${routeEvents.length}`;
    }
  };

  const patchActiveStandardTab = () => {
    const documentContext = readDocumentContext();
    patchStandardTab({
      root,
      activeTab: state.activeTab,
      theme: state.theme,
      updateHeaderEventCount,
      renderAIPanel: () => renderShadowAIArea(state, documentContext),
      renderIframeMarkup: () => renderIframePanelContent(state, routeSessions, documentContext),
      renderFallback: render,
      syncBridge: () => {
        devtoolsBridge?.sync();
      }
    });
  };

  const patchComponentsTab = (options: { refreshTree: boolean; refreshInspector: boolean }) => {
    patchShadowComponentsArea({
      root,
      state,
      renderComponentDrilldownInspector,
      updateHeaderEventCount,
      renderFallback: render,
      refreshTree: options.refreshTree,
      refreshInspector: options.refreshInspector
    });
  };

  const appendEvent = (rawEvent: unknown) => {
    const event = normalizeEvent(rawEvent);
    if (!event) return;

    // Hydration
    const hydratedEvent = hydrateEvent(event);
    routeSessions.handle(hydratedEvent);
    const previousLikelyCause = state.aiLikelyCause;
    const componentTreeAffected = eventAffectsComponentTree(hydratedEvent);
    const selectedComponentAffected = eventTouchesSelectedComponent(
      hydratedEvent,
      state.selectedComponentKey
    );

    const previousSelection = state.selectedComponentKey;
    applyComponentLifecycle(
      state.mountedComponents,
      state.expandedComponentNodeKeys,
      hydratedEvent
    );

    if (componentTreeAffected) {
      state.componentTreeVersion += 1;
    }

    if (eventTouchesSelectedComponent(hydratedEvent, previousSelection)) {
      state.selectedComponentActivityVersion += 1;
    }

    if (previousSelection && !state.mountedComponents.has(previousSelection)) {
      state.selectedComponentKey = null;
      notifyComponentSelection(null, null, "clear");
    }

    if (typeof hydratedEvent.payload?.likelyCause === "string") {
      state.aiLikelyCause = hydratedEvent.payload.likelyCause;
    }

    const aiLikelyCauseChanged = previousLikelyCause !== state.aiLikelyCause;

    state.events = appendPrioritizedDevtoolsEvent(
      state.events,
      hydratedEvent,
      MAX_DEVTOOLS_EVENTS
    );

    const routeEvents = state.events;

    state.eventCount = routeEvents.length;
    state.timelineCursor = routeEvents.length - 1;

    // Visibility gating
    if (!visible) {
      pendingVisibleRefresh = true;
      return;
    }

    // Components tab refresh logic
    if (state.activeTab === "Components") {
      const refreshTree = componentTreeAffected;
      const refreshInspector = refreshTree || selectedComponentAffected;

      if (!refreshTree && !refreshInspector) {
        updateHeaderEventCount();
        devtoolsBridge?.sync();
        return;
      }

      patchComponentsTab({
        refreshTree,
        refreshInspector
      });
      devtoolsBridge?.sync();
      return;
    }

    // AI Diagnostics refresh logic
    if (
      state.activeTab === "AI Diagnostics" &&
      !aiLikelyCauseChanged &&
      state.aiStatus === "idle"
    ) {
      patchActiveStandardTab();
      return;
    }

    // Default refresh
    patchActiveStandardTab();
  };

  const unsubDebug = Debug.on(appendEvent);
  const unsubEventBus = subscribeDebug(appendEvent);

  const dispatchWindowEvent = (name: string, detail: Record<string, unknown>) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  let lastInspectModeState: boolean | null = null;

  const notifyInspectMode = (enabled: boolean) => {
    if (lastInspectModeState === enabled) {
      return;
    }

    lastInspectModeState = enabled;
    dispatchWindowEvent(DEVTOOLS_INSPECT_MODE_EVENT, {
      enabled
    });
  };

  const notifyComponentSelection = (scope: string | null, instance: number | null, source: "panel" | "picker" | "clear") => {
    dispatchWindowEvent(DEVTOOLS_COMPONENT_SELECT_EVENT, {
      scope,
      instance,
      source
    });
  };

  const notifyComponentHover = (scope: string | null, instance: number | null) => {
    dispatchWindowEvent(DEVTOOLS_COMPONENT_HOVER_EVENT, {
      scope,
      instance
    });
  };

  const notifyLayoutPreferences = () => {
    dispatchWindowEvent(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, {
      position: state.overlayPosition,
      panelSize: state.overlayPanelSize,
      persistPreferences: state.persistOverlayPreferences
    });
  };

  const focusBridgeTab = (tab: DevtoolsBridgeTabName): boolean => {
    if (tab === "Settings") {
      state.hostControlsOpen = true;
      render();
      return true;
    }

    if (!TABS.includes(tab)) {
      return false;
    }

    state.activeTab = tab;
    notifyInspectMode(tab === "Components");
    if (tab !== "Components") {
      notifyComponentSelection(null, null, "clear");
    }
    render();
    return true;
  };

  const selectBridgeComponent = (scope: string, instance: number): boolean => {
    const componentKey = buildComponentKey(scope, instance);
    if (!state.mountedComponents.has(componentKey)) {
      return false;
    }

    state.activeTab = "Components";
    state.selectedComponentKey = componentKey;
    notifyComponentSelection(scope, instance, "panel");
    render();
    return true;
  };

  const revealBridgeHost = (): boolean => {
    const rootNode = root.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      const host = rootNode.host;

      if (host.id === "terajs-overlay-container") {
        const fab = rootNode.getElementById("terajs-devtools-fab");
        const panel = rootNode.getElementById("terajs-devtools-panel");
        if (fab instanceof HTMLButtonElement && panel instanceof HTMLElement && panel.classList.contains("is-hidden")) {
          fab.click();
        }
        return true;
      }

      if (host instanceof HTMLElement) {
        host.scrollIntoView({ block: "nearest", inline: "nearest" });
        return true;
      }
    }

    root.scrollIntoView({ block: "nearest", inline: "nearest" });
    return true;
  };

  if (bridgeEnabled) {
    devtoolsBridge = registerDevtoolsBridgeInstance({
      root,
      getSnapshot: () => {
        const documentContext = readDocumentContext();
        return {
          activeTab: state.activeTab,
          theme: state.theme,
          eventCount: state.eventCount,
          mountedComponentCount: state.mountedComponents.size,
          selectedComponentKey: state.selectedComponentKey,
          selectedMetaKey: state.selectedMetaKey,
          componentSearchQuery: state.componentSearchQuery,
          componentInspectorQuery: state.componentInspectorQuery,
          ai: {
            status: state.aiStatus,
            likelyCause: state.aiLikelyCause,
            error: state.aiError,
            summary: state.aiStructuredResponse?.summary ?? (state.aiResponse?.trim() || null),
            likelyCauses: state.aiStructuredResponse?.likelyCauses ?? [],
            nextChecks: state.aiStructuredResponse?.nextChecks ?? [],
            suggestedFixes: state.aiStructuredResponse?.suggestedFixes ?? [],
            promptAvailable: state.aiPrompt !== null,
            responseAvailable: state.aiResponse !== null || state.aiStructuredResponse !== null,
            assistantEnabled: state.aiAssistantEnabled,
            assistantEndpoint: state.aiAssistantEndpoint,
            assistantModel: state.aiAssistantModel,
            assistantTimeoutMs: state.aiAssistantTimeoutMs,
          },
          layout: {
            position: state.overlayPosition,
            panelSize: state.overlayPanelSize,
            persistPreferences: state.persistOverlayPreferences,
          },
          codeReferences: collectRecentCodeReferences(state.events, 8),
          document: summarizeSafeDocumentContext(documentContext),
          documentDiagnostics: analyzeSafeDocumentContext(documentContext),
          recentEvents: state.events.slice(-25).map((event) => ({
            type: event.type,
            timestamp: event.timestamp,
            level: event.level,
          })),
        };
      },
      getSessionExport: (mode = "full") => {
        const documentContext = readDocumentContext();
        const exportedEvents = mode === "update"
          ? state.events.slice(-MAX_LIVE_BRIDGE_UPDATE_EVENTS)
          : state.events;
        return {
          codeReferences: collectRecentCodeReferences(state.events, 16),
          document: documentContext,
          documentDiagnostics: analyzeSafeDocumentContext(documentContext),
          events: exportedEvents.map((event) => ({
            type: event.type,
            timestamp: event.timestamp,
            payload: event.payload ? { ...event.payload } : undefined,
            level: event.level,
            file: event.file,
            line: event.line,
            column: event.column,
          }))
        };
      },
      focusTab: focusBridgeTab,
      selectComponent: selectBridgeComponent,
      reveal: revealBridgeHost,
    });
  }

  const handleComponentPicked = createComponentPickedHandler(state, render);
  const handleExtensionAIBridgeChange = () => {
    render();
  };
  const handleIdeBridgeStatusChange = createAutomaticIdeBridgeDiagnosisHandler({
    state,
    aiOptions,
    aiRequestTokenRef,
    readDocumentContext,
    emitDevtoolsEvent: appendEvent,
    render
  });

  if (typeof window !== "undefined") {
    window.addEventListener(DEVTOOLS_COMPONENT_PICKED_EVENT, handleComponentPicked as EventListener);
    window.addEventListener(EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT, handleExtensionAIBridgeChange as EventListener);
    window.addEventListener(DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT, handleIdeBridgeStatusChange as EventListener);
  }

  const handleClick = createClickHandler({
    state,
    aiOptions,
    aiRequestTokenRef,
    readDocumentContext,
    defaultExpandedInspectorSections: DEFAULT_EXPANDED_INSPECTOR_SECTIONS,
    clearPersistedEvents: clearDebugHistory,
    emitDevtoolsEvent: appendEvent,
    render,
    notifyInspectMode,
    notifyComponentSelection,
    notifyLayoutPreferences
  });

  const handleInput = createInputHandler(state, render);
  const handleChange = createChangeHandler(render);
  const { handleMouseOver, handleMouseOut } = createHoverHandlers(notifyComponentHover);

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("mouseover", handleMouseOver);
  root.addEventListener("mouseout", handleMouseOut);

  render();

  const dispose = () => {
    unsubDebug();
    unsubEventBus();
    stopIdleIdeBridgeDiscovery();
    if (typeof window !== "undefined") {
      window.removeEventListener(DEVTOOLS_COMPONENT_PICKED_EVENT, handleComponentPicked as EventListener);
      window.removeEventListener(EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT, handleExtensionAIBridgeChange as EventListener);
      window.removeEventListener(DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT, handleIdeBridgeStatusChange as EventListener);
    }
    devtoolsBridge?.dispose();
    notifyInspectMode(false);
    notifyComponentSelection(null, null, "clear");
    notifyComponentHover(null, null);
    root.removeEventListener("click", handleClick);
    root.removeEventListener("input", handleInput);
    root.removeEventListener("change", handleChange);
    root.removeEventListener("mouseover", handleMouseOver);
    root.removeEventListener("mouseout", handleMouseOut);
    root.innerHTML = "";
  };

  return {
    dispose,
    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      syncIdeBridgeDiscovery();
      if (!visible) {
        return;
      }

      if (pendingVisibleRefresh) {
        pendingVisibleRefresh = false;
        render();
        return;
      }

      devtoolsBridge?.sync();
    }
  };

  function render() {
    syncIdeBridgeDiscovery();

    const scrollSnapshot = state.activeTab === "Components"
      ? captureComponentsScrollPositions(root)
      : null;

    root.dataset.theme = state.theme;
    const documentContext = readDocumentContext();
    root.innerHTML = renderAppShell(
      state,
      TABS,
      (nextState) => renderPanel(nextState, documentContext),
      renderComponentDrilldownInspector
    );
    updateHeaderEventCount();
    if (resolveDevtoolsAreaHostKind(state.activeTab) === "iframe") {
      syncIframeAreaHost(root, {
        title: state.activeTab,
        theme: state.theme,
        markup: renderIframePanelContent(state, routeSessions, documentContext),
        eventBridge: {
          click: handleClick,
          input: handleInput,
          change: handleChange
        }
      });
    }

    if (!scrollSnapshot) {
      notifyInspectMode(state.activeTab === "Components");
      devtoolsBridge?.sync();
      return;
    }

    scheduleComponentsScrollRestore(root, scrollSnapshot);
    notifyInspectMode(state.activeTab === "Components");
    devtoolsBridge?.sync();
  }
}

function renderPanel(state: DevtoolsState, documentContext = captureSafeDocumentContext()): string {
  if (resolveDevtoolsAreaHostKind(state.activeTab) === "iframe") {
    return renderIframeAreaHost(state.activeTab);
  }

  switch (state.activeTab) {
    case "Components":
      return "";
    case "AI Diagnostics":
      return renderShadowAIArea(state, documentContext);
    default:
      return "";
  }
}

function renderComponentDrilldownInspector(
  state: DevtoolsState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
): string {
  return renderComponentDrilldownFromState(state, selected, drilldown);
}

function isOverlayPosition(value: unknown): value is DevtoolsOverlayPosition {
  return value === "bottom-left"
    || value === "bottom-right"
    || value === "bottom-center"
    || value === "top-left"
    || value === "top-right"
    || value === "top-center"
    || value === "center";
}

function isOverlaySize(value: unknown): value is DevtoolsOverlaySize {
  return value === "normal" || value === "large";
}

function normalizeLayoutOptions(options?: DevtoolsLayoutOptions): NormalizedLayoutOptions {
  return {
    position: isOverlayPosition(options?.position) ? options.position : "bottom-center",
    panelSize: isOverlaySize(options?.panelSize) ? options.panelSize : "normal",
    persistPreferences: options?.persistPreferences !== false
  };
}


