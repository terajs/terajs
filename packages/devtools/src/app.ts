import { clearDebugHistory, Debug, readDebugHistory, subscribeDebug } from "@terajs/shared";
import { captureStateSnapshot } from "@terajs/adapter-ai";
import { computeSanityMetrics } from "./sanity.js";
import {
  renderInspectorRuntimeMonitor as renderRuntimeMonitorPanel,
  type RuntimeMonitorRenderUtils
} from "./inspector/runtimeMonitor.js";
import {
  buildComponentKey,
  describeValueType,
  escapeHtml,
  matchesInspectorQuery,
  readComponentIdentity,
  readNumber,
  readString,
  readUnknown,
  safeString,
  shortJson
} from "./inspector/shared.js";
import { formatPrimitiveValue, isExpandableValue, renderValueExplorer } from "./inspector/valueExplorer.js";
import {
  renderInspectorAiPanel,
  renderInspectorActivityPanel,
  renderInspectorDomPanel,
  renderInspectorMetaPanel,
  renderInspectorOverviewPanel,
  renderInspectorRoutePanel
} from "./inspector/basicSections.js";
import {
  renderInspectorPropsPanel,
  renderInspectorReactivePanel,
  type InspectorInteractiveSectionDeps
} from "./inspector/interactiveSections.js";
import {
  describeEditablePrimitive,
  describeInspectableValueType,
  unwrapInspectableValue,
} from "./inspector/editableValues.js";
import {
  collectOwnedReactiveEntries,
  generateLikelyCause,
} from "./inspector/dataCollectors.js";
import {
  applyComponentLifecycle,
  collectComponentDrilldown,
  type MountedComponentEntry
} from "./inspector/componentData.js";
import { buildComponentsPanelView } from "./inspector/componentsPanelView.js";
import {
  renderComponentDrilldownInspector as renderDrilldownInspector,
  type InspectorSectionKey,
  type InspectorSectionRenderers
} from "./inspector/drilldownRenderer.js";
import {
  resolveLivePropsSnapshot,
} from "./inspector/liveEditing.js";
import {
  renderIssuesPanel,
  renderLogsPanel,
  renderMetaPanel,
  renderSignalsPanel,
  renderTimelinePanel
} from "./panels/primaryPanels.js";
import {
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  renderAIDiagnosticsPanel,
  renderPerformancePanel,
  renderQueuePanel,
  renderRouterPanel,
  renderSanityPanel,
  renderSettingsPanel,
  type AIDiagnosticsSectionKey
} from "./panels/diagnosticsPanels.js";
import { normalizeEvent } from "./eventNormalization.js";
import { appendPrioritizedDevtoolsEvent, retainPrioritizedDevtoolsEvents } from "./eventRetention.js";
import {
  normalizeAIAssistantOptions,
} from "./aiHelpers.js";
import { createClickHandler } from "./appClickHandler.js";
import { renderAppShell } from "./appShell.js";
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
  logFilter: "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";
  timelineCursor: number;
  theme: "dark" | "light";
  aiPrompt: string | null;
  aiLikelyCause: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiResponse: string | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
  aiAssistantEnabled: boolean;
  aiAssistantEndpoint: string | null;
  aiAssistantModel: string;
  aiAssistantTimeoutMs: number;
  overlayPosition: DevtoolsOverlayPosition;
  overlayPanelSize: DevtoolsOverlaySize;
  persistOverlayPreferences: boolean;
}

const TABS: TabName[] = [
  "Components",
  "AI Diagnostics",
  "Signals",
  "Meta",
  "Issues",
  "Logs",
  "Timeline",
  "Router",
  "Queue",
  "Performance",
  "Sanity Check",
  "Settings"
];

const DEFAULT_EXPANDED_INSPECTOR_SECTIONS: InspectorSectionKey[] = [];
const MAX_DEVTOOLS_EVENTS = 4000;

const DEVTOOLS_INSPECT_MODE_EVENT = "terajs:devtools:inspect-mode";
const DEVTOOLS_COMPONENT_SELECT_EVENT = "terajs:devtools:component-select";
const DEVTOOLS_COMPONENT_PICKED_EVENT = "terajs:devtools:component-picked";
const DEVTOOLS_COMPONENT_HOVER_EVENT = "terajs:devtools:component-hover";
const DEVTOOLS_LAYOUT_PREFERENCES_EVENT = "terajs:devtools:layout-preferences";

const runtimeMonitorRenderUtils: RuntimeMonitorRenderUtils = {
  buildComponentKey,
  readComponentIdentity,
  matchesInspectorQuery,
  readUnknown,
  readString,
  readNumber,
  shortJson,
  safeString,
  escapeHtml,
  describeValueType
};

const inspectorInteractiveSectionDeps: InspectorInteractiveSectionDeps = {
  resolveLivePropsSnapshot,
  renderInspectorRuntimeMonitor,
  matchesInspectorQuery,
  collectOwnedReactiveEntries,
  renderValueExplorer,
  escapeHtml,
  isExpandableValue,
  formatPrimitiveValue,
  describeEditablePrimitive,
  describeInspectableValueType,
  unwrapInspectableValue
};

const inspectorSectionRenderers: InspectorSectionRenderers = {
  overview: renderInspectorOverviewPanel,
  props: (state, selected, drilldown, query) => {
    return renderInspectorPropsPanel(
      state.events,
      state.expandedValuePaths,
      selected,
      drilldown.propsSnapshot,
      query,
      inspectorInteractiveSectionDeps
    );
  },
  dom: renderInspectorDomPanel,
  reactive: (state, selected, drilldown, query) => {
    return renderInspectorReactivePanel(
      state.expandedValuePaths,
      selected,
      drilldown.reactiveState,
      query,
      inspectorInteractiveSectionDeps
    );
  },
  route: (state, drilldown, query) => {
    return renderInspectorRoutePanel(drilldown, query, state.expandedValuePaths);
  },
  meta: (state, drilldown, query) => {
    return renderInspectorMetaPanel(drilldown, query, state.expandedValuePaths);
  },
  ai: (state, drilldown, query) => {
    return renderInspectorAiPanel(drilldown, query, state.expandedValuePaths);
  },
  activity: renderInspectorActivityPanel
};

export function mountDevtoolsApp(root: HTMLElement, options: DevtoolsAppOptions = {}): () => void {
  const aiOptions = normalizeAIAssistantOptions(options.ai);
  const layoutOptions = normalizeLayoutOptions(options.layout);
  const bridgeEnabled = isBridgeEnabled(options.bridge);
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
    logFilter: "all",
    timelineCursor: hydratedEvents.length - 1,
    theme: "dark",
    aiPrompt: null,
    aiLikelyCause: hydratedLikelyCause,
    aiStatus: "idle",
    aiResponse: null,
    aiError: null,
    activeAIDiagnosticsSection: DEFAULT_AI_DIAGNOSTICS_SECTION,
    aiAssistantEnabled: aiOptions.enabled,
    aiAssistantEndpoint: aiOptions.endpoint,
    aiAssistantModel: aiOptions.model,
    aiAssistantTimeoutMs: aiOptions.timeoutMs,
    overlayPosition: layoutOptions.position,
    overlayPanelSize: layoutOptions.panelSize,
    persistOverlayPreferences: layoutOptions.persistPreferences
  };
  const aiRequestTokenRef = { current: 0 };
  let devtoolsBridge: ReturnType<typeof registerDevtoolsBridgeInstance> | null = null;

  const updateHeaderEventCount = () => {
    const subtitle = root.querySelector<HTMLElement>(".devtools-subtitle");
    if (subtitle) {
      subtitle.textContent = `Events: ${state.eventCount}`;
    }
  };

  const shouldRenderAfterEvent = (aiLikelyCauseChanged: boolean) => {
    if (state.activeTab === "Settings") {
      return false;
    }

    if (state.activeTab === "AI Diagnostics" && !aiLikelyCauseChanged) {
      return false;
    }

    return true;
  };

  const eventAffectsComponentTree = (event: DevtoolsEvent) => {
    const identity = readComponentIdentity(event);
    if (!identity) {
      return false;
    }

    if (
      event.type === "component:mounted"
      || event.type === "component:mount"
      || event.type === "component:unmounted"
      || event.type === "component:unmount"
    ) {
      return true;
    }

    return readUnknown(event.payload, "ai") !== undefined;
  };

  const eventTouchesSelectedComponent = (event: DevtoolsEvent, selectedComponentKey: string | null) => {
    if (!selectedComponentKey) {
      return false;
    }

    const identity = readComponentIdentity(event);
    if (identity && buildComponentKey(identity.scope, identity.instance) === selectedComponentKey) {
      return true;
    }

    if (event.type === "error:component") {
      const scope = readString(event.payload, "scope") ?? readString(event.payload, "name");
      const instance = readNumber(event.payload, "instance");
      if (scope && instance !== undefined && buildComponentKey(scope, instance) === selectedComponentKey) {
        return true;
      }
    }

    const reactiveKey = readString(event.payload, "rid") ?? readString(event.payload, "key");
    if (typeof reactiveKey === "string" && reactiveKey.includes(selectedComponentKey)) {
      return true;
    }

    return safeString(event.payload ?? {}).includes(selectedComponentKey);
  };

  const scheduleScrollRestore = (scrollSnapshot: ReturnType<typeof captureScrollPositions>) => {
    restoreScrollPositions(scrollSnapshot);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        restoreScrollPositions(scrollSnapshot);
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScrollPositions(scrollSnapshot);
        });
      });
    }
  };

  const patchComponentsTab = (options: { refreshTree: boolean; refreshInspector: boolean }) => {
    const componentsScreen = root.querySelector<HTMLElement>(".components-screen");
    if (!componentsScreen) {
      render();
      return;
    }

    const scrollSnapshot = captureScrollPositions();
    const view = buildComponentsPanelView(state, renderComponentDrilldownInspector);
    updateHeaderEventCount();

    const inspectorPanel = root.querySelector<HTMLElement>(".components-screen-inspector");
    if (view.hasSelection !== Boolean(inspectorPanel)) {
      render();
      return;
    }

    componentsScreen.classList.toggle("is-inspector-hidden", !view.hasSelection);

    const inspectorSubtitle = root.querySelector<HTMLElement>(".components-screen-inspector .panel-subtitle");
    if (inspectorSubtitle) {
      inspectorSubtitle.textContent = view.selectedLabel;
    }

    if (options.refreshTree) {
      const treeBody = root.querySelector<HTMLElement>(".components-screen-tree .components-screen-body");
      if (!treeBody) {
        render();
        return;
      }
      treeBody.innerHTML = view.treeMarkup;
    }

    if (options.refreshInspector) {
      const inspectorBody = root.querySelector<HTMLElement>(".components-screen-inspector .components-screen-body");
      if (!inspectorBody) {
        render();
        return;
      }
      inspectorBody.innerHTML = view.inspectorMarkup;
    }

    scheduleScrollRestore(scrollSnapshot);
  };

  const appendEvent = (rawEvent: unknown) => {
    const event = normalizeEvent(rawEvent);
    if (!event) return;

    const hydratedEvent = hydrateEvent(event);
    const previousLikelyCause = state.aiLikelyCause;
    const componentTreeAffected = eventAffectsComponentTree(hydratedEvent);
    const selectedComponentAffected = eventTouchesSelectedComponent(hydratedEvent, state.selectedComponentKey);

    const previousSelection = state.selectedComponentKey;
    applyComponentLifecycle(state.mountedComponents, state.expandedComponentNodeKeys, hydratedEvent);

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

    state.events = appendPrioritizedDevtoolsEvent(state.events, hydratedEvent, MAX_DEVTOOLS_EVENTS);
    state.eventCount += 1;
    state.timelineCursor = state.events.length - 1;

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

    if (!shouldRenderAfterEvent(aiLikelyCauseChanged)) {
      updateHeaderEventCount();
      devtoolsBridge?.sync();
      return;
    }

    render();
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
            promptAvailable: state.aiPrompt !== null,
            responseAvailable: state.aiResponse !== null,
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
          document: summarizeSafeDocumentContext(documentContext),
          documentDiagnostics: analyzeSafeDocumentContext(documentContext),
          recentEvents: state.events.slice(-25).map((event) => ({
            type: event.type,
            timestamp: event.timestamp,
            level: event.level,
          })),
        };
      },
      getSessionExport: () => {
        const documentContext = readDocumentContext();
        return {
          document: documentContext,
          documentDiagnostics: analyzeSafeDocumentContext(documentContext),
          events: state.events.map((event) => ({
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

  if (typeof window !== "undefined") {
    window.addEventListener(DEVTOOLS_COMPONENT_PICKED_EVENT, handleComponentPicked as EventListener);
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

  const captureScrollPositions = () => {
    const treeBody = root.querySelector<HTMLElement>(".components-screen-tree .components-screen-body");
    const inspectorBody = root.querySelector<HTMLElement>(".components-screen-inspector .components-screen-body");
    const inspectorSurface = root.querySelector<HTMLElement>(".components-screen-inspector .inspector-surface");

    return {
      treeTop: treeBody?.scrollTop ?? 0,
      treeLeft: treeBody?.scrollLeft ?? 0,
      inspectorBodyTop: inspectorBody?.scrollTop ?? 0,
      inspectorBodyLeft: inspectorBody?.scrollLeft ?? 0,
      inspectorSurfaceTop: inspectorSurface?.scrollTop ?? 0,
      inspectorSurfaceLeft: inspectorSurface?.scrollLeft ?? 0
    };
  };

  const restoreScrollPositions = (snapshot: ReturnType<typeof captureScrollPositions>) => {
    const treeBody = root.querySelector<HTMLElement>(".components-screen-tree .components-screen-body");
    const inspectorBody = root.querySelector<HTMLElement>(".components-screen-inspector .components-screen-body");
    const inspectorSurface = root.querySelector<HTMLElement>(".components-screen-inspector .inspector-surface");

    if (treeBody) {
      treeBody.scrollTop = snapshot.treeTop;
      treeBody.scrollLeft = snapshot.treeLeft;
    }

    if (inspectorBody) {
      inspectorBody.scrollTop = snapshot.inspectorBodyTop;
      inspectorBody.scrollLeft = snapshot.inspectorBodyLeft;
    }

    if (inspectorSurface) {
      inspectorSurface.scrollTop = snapshot.inspectorSurfaceTop;
      inspectorSurface.scrollLeft = snapshot.inspectorSurfaceLeft;
    }
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("mouseover", handleMouseOver);
  root.addEventListener("mouseout", handleMouseOut);

  render();

  return () => {
    unsubDebug();
    unsubEventBus();
    if (typeof window !== "undefined") {
      window.removeEventListener(DEVTOOLS_COMPONENT_PICKED_EVENT, handleComponentPicked as EventListener);
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

  function render() {
    const scrollSnapshot = state.activeTab === "Components"
      ? captureScrollPositions()
      : null;

    root.dataset.theme = state.theme;
    const documentContext = readDocumentContext();
    root.innerHTML = renderAppShell(
      state,
      TABS,
      (nextState) => renderPanel(nextState, documentContext),
      renderComponentDrilldownInspector
    );

    if (!scrollSnapshot) {
      notifyInspectMode(state.activeTab === "Components");
      devtoolsBridge?.sync();
      return;
    }

    scheduleScrollRestore(scrollSnapshot);
    notifyInspectMode(state.activeTab === "Components");
    devtoolsBridge?.sync();
  }
}

function renderPanel(state: DevtoolsState, documentContext = captureSafeDocumentContext()): string {
  switch (state.activeTab) {
    case "Components":
      return "";
    case "AI Diagnostics":
      return renderAIDiagnosticsPanel({
        ...state,
        documentContext,
        documentDiagnostics: analyzeSafeDocumentContext(documentContext)
      });
    case "Signals":
      return renderSignalsPanel(state);
    case "Meta":
      return renderMetaPanel(state, documentContext);
    case "Issues":
      return renderIssuesPanel(state.events);
    case "Logs":
      return renderLogsPanel(state);
    case "Timeline":
      return renderTimelinePanel(state);
    case "Router":
      return renderRouterPanel(state.events);
    case "Queue":
      return renderQueuePanel(state.events);
    case "Performance":
      return renderPerformancePanel(state.events);
    case "Sanity Check":
      return renderSanityPanel(state.events);
    case "Settings":
      return renderSettingsPanel(state);
  }
}

function renderComponentDrilldownInspector(
  state: DevtoolsState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
): string {
  return renderDrilldownInspector(state, selected, drilldown, inspectorSectionRenderers);
}

function renderInspectorRuntimeMonitor(
  events: DevtoolsEvent[],
  scope: string,
  instance: number,
  query: string
): string {
  return renderRuntimeMonitorPanel(events, scope, instance, query, runtimeMonitorRenderUtils);
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


