import { type AIAssistantStructuredResponse, type NormalizedAIAssistantOptions } from "./aiHelpers.js";
import {
  isInspectorSectionKey,
  type InspectorSectionKey
} from "./inspector/drilldownRenderer.js";
import { type SafeDocumentContext } from "./documentContext.js";
import { DEFAULT_AI_DIAGNOSTICS_SECTION, type AIDiagnosticsSectionKey } from "./panels/diagnosticsPanels.js";
import type { DevtoolsEvent } from "./app.js";
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

type DevtoolsOverlaySize = "normal" | "large";

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
  activeAIRequestTarget: "configured" | "vscode" | null;
  aiResponse: string | null;
  aiStructuredResponse: AIAssistantStructuredResponse | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
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
  notifyInspectMode: (enabled: boolean) => void;
  notifyComponentSelection: (scope: string | null, instance: number | null, source: "panel" | "picker" | "clear") => void;
  notifyLayoutPreferences: () => void;
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
  notifyInspectMode,
  notifyComponentSelection,
  notifyLayoutPreferences
}: ClickHandlerDependencies): EventListener {
  return (domEvent: Event) => {
    const target = domEvent.target;
    if (!isHTMLElement(target)) {
      return;
    }

    const tab = target.closest<HTMLElement>("[data-tab]")?.dataset.tab as TabName | undefined;
    if (tab) {
      state.activeTab = tab;
      notifyInspectMode(tab === "Components");
      if (tab !== "Components") {
        notifyComponentSelection(null, null, "clear");
      }
      render();
      return;
    }

    const logFilter = target.closest<HTMLElement>("[data-log-filter]")?.dataset.logFilter as ClickHandlerState["logFilter"] | undefined;
    if (logFilter) {
      state.logFilter = logFilter;
      render();
      return;
    }

    const issueFilter = target.closest<HTMLElement>("[data-issue-filter]")?.dataset.issueFilter as ClickHandlerState["issueFilter"] | undefined;
    if (issueFilter) {
      state.issueFilter = issueFilter;
      render();
      return;
    }

    const metaKey = target.closest<HTMLElement>("[data-meta-key]")?.dataset.metaKey;
    if (metaKey) {
      state.selectedMetaKey = metaKey;
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
      state.timelineCursor = -1;
      state.selectedMetaKey = null;
      state.selectedComponentKey = null;
      state.componentSearchQuery = "";
      state.componentInspectorQuery = "";
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
      aiRequestTokenRef.current += 1;
      notifyInspectMode(state.activeTab === "Components");
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
  return value === "normal" || value === "large";
}
