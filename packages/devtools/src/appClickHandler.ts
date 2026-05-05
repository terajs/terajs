import { type AIAssistantStructuredResponse, type NormalizedAIAssistantOptions } from "./aiHelpers.js";
import {
  isInspectorSectionKey,
  type InspectorSectionKey
} from "./inspector/drilldownRenderer.js";
import { type SafeDocumentContext } from "./documentContext.js";
import {
  DEFAULT_AI_ANALYSIS_OUTPUT_VIEW,
  DEFAULT_AI_DOCUMENT_CONTEXT_VIEW,
  DEFAULT_AI_SESSION_MODE_VIEW,
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  DEFAULT_ROUTER_PANEL_VIEW,
  DEFAULT_SANITY_PANEL_VIEW,
  type AIAnalysisOutputView,
  type AIDiagnosticsSectionKey,
  type RouterPanelView,
  type SanityPanelView,
  type AISessionModeView,
  type AIDocumentContextView
} from "./panels/diagnosticsPanels.js";
import {
  DEFAULT_PERFORMANCE_PANEL_VIEW,
  type PerformancePanelView,
} from "./panels/diagnosticsPanels.js";
import {
  DEFAULT_TIMELINE_PANEL_FILTER,
  type TimelinePanelFilter,
} from "./panels/primaryPanels.js";
import type {
  DevtoolsEvent,
  DevtoolsIssueFilter,
  DevtoolsLogFilter,
  DevtoolsSignalsViewMode,
  IframePanelsState,
} from "./app.js";
import { handleShadowAIAreaClick } from "./areas/shadow/ai/actions.js";
import { handleShadowComponentsAreaClick } from "./areas/shadow/components/actions.js";

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

type DevtoolsOverlayPosition =
  | "bottom-left"
  | "bottom-right"
  | "bottom-center"
  | "top-left"
  | "top-right"
  | "top-center"
  | "center";

type DevtoolsOverlaySize = "normal" | "large" | "fullscreen";

interface ClickHandlerState {
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
  iframePanels: IframePanelsState;
  selectedComponentKey: string | null;
  selectedComponentActivityVersion: number;
  componentSearchQuery: string;
  componentInspectorQuery: string;
  theme: "dark" | "light";
  aiPrompt: string | null;
  aiLikelyCause: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  activeAIRequestTarget: "configured" | "vscode" | null;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
  activeAIDocumentContextView: AIDocumentContextView;
  activeAISessionModeView: AISessionModeView;
  activeAIAnalysisOutputView: AIAnalysisOutputView;
  hostControlsOpen: boolean;
  overlayPosition: DevtoolsOverlayPosition;
  overlayPanelSize: DevtoolsOverlaySize;
  persistOverlayPreferences: boolean;
}

interface NormalizedAIAssistantOptionsLike {
  enabled: boolean;
  endpoint: string | null;
  model: string;
  timeoutMs: number;
}

interface ClickHandlerDependencies {
  state: ClickHandlerState;
  aiOptions: NormalizedAIAssistantOptionsLike;
  aiRequestTokenRef: { current: number };
  readDocumentContext: () => SafeDocumentContext | null;
  defaultExpandedInspectorSections: InspectorSectionKey[];
  clearPersistedEvents: () => void;
  emitDevtoolsEvent: (event: DevtoolsEvent) => void;
  render: () => void;
  notifyComponentSelection: (scope: string | null, instance: number | null, source: "panel" | "picker" | "clear") => void;
  notifyLayoutPreferences: () => void;
  notifyShellWindowAction?: (action: "minimize") => void;
}

function isHTMLElement(value: EventTarget | null): value is HTMLElement {
  return typeof value === "object"
    && value !== null
    && "closest" in value
    && typeof (value as { closest?: unknown }).closest === "function"
    && "dataset" in value;
}

export function createClickHandler({
  state,
  aiOptions,
  aiRequestTokenRef,
  readDocumentContext,
  defaultExpandedInspectorSections,
  clearPersistedEvents,
  emitDevtoolsEvent,
  render,
  notifyComponentSelection,
  notifyLayoutPreferences,
  notifyShellWindowAction
}: ClickHandlerDependencies): EventListener {
  return (domEvent: Event) => {
    const target = domEvent.target;
    if (!isHTMLElement(target)) {
      return;
    }

    const tab = target.closest<HTMLElement>("[data-tab]")?.dataset.tab as TabName | undefined;
    if (tab) {
      state.activeTab = tab;
      if (tab !== "Components") {
        notifyComponentSelection(null, null, "clear");
      }
      render();
      return;
    }

    const logFilter = target.closest<HTMLElement>("[data-log-filter]")?.dataset.logFilter as DevtoolsLogFilter | undefined;
    if (logFilter) {
      state.iframePanels.logs.filter = logFilter;
      state.iframePanels.logs.selectedEntryKey = null;
      render();
      return;
    }

    const issueFilter = target.closest<HTMLElement>("[data-issue-filter]")?.dataset.issueFilter as DevtoolsIssueFilter | undefined;
    if (issueFilter) {
      state.iframePanels.issues.filter = issueFilter;
      state.iframePanels.issues.selectedKey = null;
      render();
      return;
    }

    const issueEntryKey = target.closest<HTMLElement>("[data-issue-entry-key]")?.dataset.issueEntryKey;
    if (issueEntryKey) {
      state.iframePanels.issues.selectedKey = issueEntryKey;
      render();
      return;
    }

    const metaKey = target.closest<HTMLElement>("[data-meta-key]")?.dataset.metaKey;
    if (metaKey) {
      state.iframePanels.meta.selectedKey = metaKey;
      render();
      return;
    }

    const signalMode = target.closest<HTMLElement>("[data-signal-mode]")?.dataset.signalMode as DevtoolsSignalsViewMode | undefined;
    if (signalMode === "active" || signalMode === "recent") {
      state.iframePanels.signals.viewMode = signalMode;
      render();
      return;
    }

    const signalKey = target.closest<HTMLElement>("[data-signal-key]")?.dataset.signalKey;
    if (signalKey) {
      state.iframePanels.signals.selectedKey = signalKey;
      render();
      return;
    }

    const performanceView = target.closest<HTMLElement>("[data-performance-view]")?.dataset.performanceView as PerformancePanelView | undefined;
    if (isPerformancePanelView(performanceView) && performanceView !== state.iframePanels.performance.activeView) {
      state.iframePanels.performance.activeView = performanceView;
      render();
      return;
    }

    const routerView = target.closest<HTMLElement>("[data-router-view]")?.dataset.routerView as RouterPanelView | undefined;
    if (isRouterPanelView(routerView) && routerView !== state.iframePanels.router.activeView) {
      state.iframePanels.router.activeView = routerView;
      render();
      return;
    }

    const timelineFilter = target.closest<HTMLElement>("[data-timeline-filter]")?.dataset.timelineFilter as TimelinePanelFilter | undefined;
    if (isTimelinePanelFilter(timelineFilter) && timelineFilter !== state.iframePanels.timeline.filter) {
      state.iframePanels.timeline.filter = timelineFilter;
      render();
      return;
    }

    const timelineDetailToggle = target.closest<HTMLElement>("[data-timeline-detail-key]");
    const timelineDetailKey = timelineDetailToggle?.dataset.timelineDetailKey;
    if (timelineDetailKey) {
      domEvent.preventDefault();
      if (state.iframePanels.timeline.expandedDetailKeys.has(timelineDetailKey)) {
        state.iframePanels.timeline.expandedDetailKeys.delete(timelineDetailKey);
      } else {
        state.iframePanels.timeline.expandedDetailKeys.add(timelineDetailKey);
      }
      timelineDetailToggle?.blur?.();
      render();
      return;
    }

    const sanityView = target.closest<HTMLElement>("[data-sanity-view]")?.dataset.sanityView as SanityPanelView | undefined;
    if (isSanityPanelView(sanityView) && sanityView !== state.iframePanels.sanity.activeView) {
      state.iframePanels.sanity.activeView = sanityView;
      render();
      return;
    }

    const logEntryKey = target.closest<HTMLElement>("[data-log-entry-key]")?.dataset.logEntryKey;
    if (logEntryKey) {
      state.iframePanels.logs.selectedEntryKey = logEntryKey;
      render();
      return;
    }

    const queueEntryKey = target.closest<HTMLElement>("[data-queue-entry-key]")?.dataset.queueEntryKey;
    if (queueEntryKey) {
      state.iframePanels.queue.selectedEntryKey = queueEntryKey;
      render();
      return;
    }

    if (handleShadowAIAreaClick({
      target,
      state,
      aiOptions: aiOptions as NormalizedAIAssistantOptions,
      aiRequestTokenRef,
      readDocumentContext,
      emitDevtoolsEvent,
      render
    })) {
      return;
    }

    if (target.closest("[data-host-controls-toggle]")) {
      state.hostControlsOpen = !state.hostControlsOpen;
      render();
      return;
    }

    const shellAction = target.closest<HTMLElement>("[data-shell-action]")?.dataset.shellAction;
    if (shellAction === "minimize") {
      notifyShellWindowAction?.("minimize");
      return;
    }

    if (handleShadowComponentsAreaClick({
      target,
      state,
      render,
      notifyComponentSelection
    })) {
      return;
    }

    const inspectorSectionToggle = target.closest<HTMLElement>("[data-action='toggle-inspector-section']");
    if (inspectorSectionToggle) {
      const section = inspectorSectionToggle.dataset.inspectorSection;
      if (isInspectorSectionKey(section)) {
        if (state.expandedInspectorSections.has(section)) {
          state.expandedInspectorSections.delete(section);
        } else {
          state.expandedInspectorSections.add(section);
        }
      }
      // Prevent browser focus scrolling on remount when section headers are clicked.
      inspectorSectionToggle.blur();
      render();
      return;
    }

    const valueToggle = target.closest<HTMLElement>("[data-action='toggle-value-node']");
    if (valueToggle) {
      const valuePath = valueToggle.dataset.valuePath;
      if (valuePath) {
        if (state.expandedValuePaths.has(valuePath)) {
          state.expandedValuePaths.delete(valuePath);
        } else {
          state.expandedValuePaths.add(valuePath);
        }
        // Prevent browser focus scrolling when the iframe content remounts around the active toggle.
        valueToggle.blur?.();
        render();
      }
      return;
    }

    const layoutPosition = target.closest<HTMLElement>("[data-layout-position]")?.dataset.layoutPosition;
    if (isOverlayPosition(layoutPosition) && layoutPosition !== state.overlayPosition) {
      state.overlayPosition = layoutPosition;
      notifyLayoutPreferences();
      render();
      return;
    }

    const layoutSize = target.closest<HTMLElement>("[data-layout-size]")?.dataset.layoutSize;
    if (isOverlaySize(layoutSize) && layoutSize !== state.overlayPanelSize) {
      state.overlayPanelSize = layoutSize;
      notifyLayoutPreferences();
      render();
      return;
    }

    if (target.closest("[data-layout-persist-toggle]")) {
      state.persistOverlayPreferences = !state.persistOverlayPreferences;
      notifyLayoutPreferences();
      render();
      return;
    }

    if (target.closest("[data-theme-toggle]")) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      render();
      return;
    }

    if (target.closest("[data-clear-events]")) {
      clearPersistedEvents();
      state.events = [];
      state.eventCount = 0;
      state.iframePanels.timeline.filter = DEFAULT_TIMELINE_PANEL_FILTER;
      state.iframePanels.timeline.expandedDetailKeys.clear();
      state.iframePanels.meta.selectedKey = null;
      state.iframePanels.signals.selectedKey = null;
      state.iframePanels.issues.selectedKey = null;
      state.iframePanels.logs.selectedEntryKey = null;
      state.iframePanels.queue.selectedEntryKey = null;
      state.iframePanels.issues.filter = "all";
      state.iframePanels.logs.filter = "all";
      state.selectedComponentKey = null;
      state.componentSearchQuery = "";
      state.componentInspectorQuery = "";
      state.iframePanels.meta.searchQuery = "";
      state.iframePanels.signals.searchQuery = "";
      state.iframePanels.logs.searchQuery = "";
      state.expandedInspectorSections = new Set(defaultExpandedInspectorSections);
      state.mountedComponents.clear();
      state.expandedComponentNodeKeys.clear();
      state.componentTreeInitialized = false;
      state.componentTreeVersion += 1;
      state.expandedComponentTreeVersion += 1;
      state.selectedComponentActivityVersion = 0;
      state.aiPrompt = null;
      state.aiLikelyCause = null;
      state.aiStatus = "idle";
      state.activeAIRequestTarget = null;
      state.aiResponse = null;
      state.aiStructuredResponse = null;
      state.aiError = null;
      state.activeAIDiagnosticsSection = DEFAULT_AI_DIAGNOSTICS_SECTION;
      state.activeAIDocumentContextView = DEFAULT_AI_DOCUMENT_CONTEXT_VIEW;
      state.activeAISessionModeView = DEFAULT_AI_SESSION_MODE_VIEW;
      state.activeAIAnalysisOutputView = DEFAULT_AI_ANALYSIS_OUTPUT_VIEW;
      state.iframePanels.router.activeView = DEFAULT_ROUTER_PANEL_VIEW;
      state.iframePanels.performance.activeView = DEFAULT_PERFORMANCE_PANEL_VIEW;
      state.iframePanels.sanity.activeView = DEFAULT_SANITY_PANEL_VIEW;
      aiRequestTokenRef.current += 1;
      notifyComponentSelection(null, null, "clear");
      render();
      return;
    }
  };
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
  return value === "normal" || value === "large" || value === "fullscreen";
}

function isPerformancePanelView(value: unknown): value is PerformancePanelView {
  return value === "overview" || value === "pressure" || value === "hot-types";
}

function isRouterPanelView(value: unknown): value is RouterPanelView {
  return value === "overview"
    || value === "snapshot"
    || value === "activity"
    || value === "issues"
    || value === "timeline";
}

function isTimelinePanelFilter(value: unknown): value is TimelinePanelFilter {
  return value === "all"
    || value === "issues"
    || value === "route"
    || value === "component"
    || value === "signal"
    || value === "effect"
    || value === "dom"
    || value === "queue"
    || value === "hub"
    || value === "other";
}

function isSanityPanelView(value: unknown): value is SanityPanelView {
  return value === "overview" || value === "alerts";
}
