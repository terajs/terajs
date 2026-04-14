import { captureStateSnapshot } from "@terajs/adapter-ai";
import { getDebugListenerCount } from "@terajs/shared";
import { buildAIPrompt } from "./aiPrompt.js";
import {
  getGlobalAIAssistantHook,
  isAIAssistantRequestFailure,
  resolveAIAssistantResponseDetailed
} from "./aiHelpers.js";
import {
  isInspectorSectionKey,
  type InspectorSectionKey
} from "./inspector/drilldownRenderer.js";
import {
  toggleLivePropValue,
  toggleLiveReactiveValue
} from "./inspector/liveEditing.js";
import { buildComponentKey } from "./inspector/shared.js";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "./sanity.js";
import { analyzeSafeDocumentContext, type SafeDocumentContext } from "./documentContext.js";
import { DEFAULT_AI_DIAGNOSTICS_SECTION, type AIDiagnosticsSectionKey } from "./panels/diagnosticsPanels.js";
import type { DevtoolsEvent } from "./app.js";

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
  logFilter: "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";
  timelineCursor: number;
  theme: "dark" | "light";
  aiPrompt: string | null;
  aiLikelyCause: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiResponse: string | null;
  aiError: string | null;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
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
    if (!(target instanceof HTMLElement)) {
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

    const metaKey = target.closest<HTMLElement>("[data-meta-key]")?.dataset.metaKey;
    if (metaKey) {
      state.selectedMetaKey = metaKey;
      render();
      return;
    }

    const aiSection = target.closest<HTMLElement>("[data-ai-section]")?.dataset.aiSection;
    if (isAIDiagnosticsSectionKey(aiSection) && aiSection !== state.activeAIDiagnosticsSection) {
      state.activeAIDiagnosticsSection = aiSection;
      render();
      return;
    }

    const treeToggle = target.closest<HTMLElement>("[data-action='toggle-component-node']");
    if (treeToggle) {
      const key = treeToggle.dataset.treeNodeKey;
      if (key) {
        if (state.expandedComponentNodeKeys.has(key)) {
          state.expandedComponentNodeKeys.delete(key);
        } else {
          state.expandedComponentNodeKeys.add(key);
        }
        state.expandedComponentTreeVersion += 1;
        render();
      }
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

    const livePropToggle = target.closest<HTMLElement>("[data-action='toggle-live-prop']");
    if (livePropToggle) {
      const scope = livePropToggle.dataset.componentScope;
      const instanceRaw = livePropToggle.dataset.componentInstance;
      const propKey = livePropToggle.dataset.propKey;
      const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
      if (scope && propKey && Number.isFinite(instance) && toggleLivePropValue(scope, instance, propKey)) {
        render();
      }
      return;
    }

    const liveReactiveToggle = target.closest<HTMLElement>("[data-action='toggle-live-reactive']");
    if (liveReactiveToggle) {
      const rid = liveReactiveToggle.dataset.reactiveRid;
      if (rid && toggleLiveReactiveValue(rid)) {
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

    const componentButton = target.closest<HTMLElement>("[data-component-key]");
    if (componentButton) {
      const scope = componentButton.dataset.componentScope;
      const instanceRaw = componentButton.dataset.componentInstance;
      const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
      if (scope && Number.isFinite(instance)) {
        const selectedComponentKey = buildComponentKey(scope, instance);
        if (state.selectedComponentKey === selectedComponentKey) {
          state.selectedComponentKey = null;
          notifyComponentSelection(null, null, "clear");
        } else {
          state.selectedComponentKey = selectedComponentKey;
          notifyComponentSelection(scope, instance, "panel");
        }
        render();
      }
      return;
    }

    if (target.closest("[data-action='ask-ai']")) {
      const snapshot = captureStateSnapshot();
      const documentContext = readDocumentContext();
      const documentDiagnostics = analyzeSafeDocumentContext(documentContext);
      const recentEvents = state.events.slice(-120);
      const sanity = computeSanityMetrics(state.events, {
        ...DEFAULT_SANITY_THRESHOLDS,
        debugListenerCount: getDebugListenerCount()
      });

      state.aiPrompt = buildAIPrompt({
        document: documentContext,
        documentDiagnostics,
        snapshot,
        sanity,
        events: state.events
      });
      state.aiError = null;
      state.aiResponse = null;

      const prompt = state.aiPrompt;
      if (!prompt) {
        state.aiStatus = "error";
        state.aiError = "Unable to generate an AI prompt for the current state.";
        render();
        return;
      }

      const promptChars = prompt.length;
      const signalCount = snapshot.signals.length;
      const baseTelemetryPayload = {
        model: aiOptions.model,
        endpoint: aiOptions.endpoint,
        promptChars,
        signalCount,
        recentEventCount: recentEvents.length,
        documentMetaCount: documentContext?.metaTags.length ?? 0,
        documentLinkCount: documentContext?.linkTags.length ?? 0,
        documentDiagnosticCount: documentDiagnostics.length
      };

      if (!aiOptions.enabled) {
        emitDevtoolsEvent({
          type: "ai:assistant:skipped",
          timestamp: Date.now(),
          level: "warn",
          payload: {
            ...baseTelemetryPayload,
            reason: "disabled"
          }
        });
        state.aiStatus = "idle";
        render();
        return;
      }

      const hasGlobalHook = getGlobalAIAssistantHook() !== null;
      if (!hasGlobalHook && !aiOptions.endpoint) {
        emitDevtoolsEvent({
          type: "ai:assistant:skipped",
          timestamp: Date.now(),
          level: "warn",
          payload: {
            ...baseTelemetryPayload,
            reason: "unconfigured"
          }
        });
        state.aiStatus = "idle";
        render();
        return;
      }

      const token = ++aiRequestTokenRef.current;
      emitDevtoolsEvent({
        type: "ai:assistant:request",
        timestamp: Date.now(),
        level: "info",
        payload: {
          requestId: token,
          provider: hasGlobalHook ? "global-hook" : "http-endpoint",
          delivery: "one-shot",
          fallbackPath: hasGlobalHook && aiOptions.endpoint ? "global-hook-over-endpoint" : "none",
          ...baseTelemetryPayload
        }
      });
      state.aiStatus = "loading";
      render();

      void resolveAIAssistantResponseDetailed({
        prompt,
        snapshot,
        sanity,
        events: recentEvents,
        document: documentContext,
        documentDiagnostics
      }, aiOptions).then((response) => {
        if (token !== aiRequestTokenRef.current) {
          return;
        }

        state.aiStatus = "ready";
        state.aiResponse = response.text;
        state.aiError = null;
        emitDevtoolsEvent({
          type: "ai:assistant:success",
          timestamp: Date.now(),
          level: "info",
          payload: {
            requestId: token,
            provider: response.telemetry.provider,
            delivery: response.telemetry.delivery,
            fallbackPath: response.telemetry.fallbackPath,
            model: response.telemetry.model,
            endpoint: response.telemetry.endpoint,
            durationMs: response.telemetry.durationMs,
            statusCode: response.telemetry.httpStatus,
            responseChars: response.text.length
          }
        });
        render();
      }).catch((error) => {
        if (token !== aiRequestTokenRef.current) {
          return;
        }

        state.aiStatus = "error";
        state.aiError = error instanceof Error ? error.message : "AI request failed.";
        state.aiResponse = null;
        const failure = isAIAssistantRequestFailure(error)
          ? error
          : null;
        emitDevtoolsEvent({
          type: "ai:assistant:error",
          timestamp: Date.now(),
          level: "error",
          payload: {
            requestId: token,
            provider: failure?.telemetry.provider ?? (hasGlobalHook ? "global-hook" : "http-endpoint"),
            delivery: failure?.telemetry.delivery ?? "one-shot",
            fallbackPath: failure?.telemetry.fallbackPath ?? (hasGlobalHook && aiOptions.endpoint ? "global-hook-over-endpoint" : "none"),
            model: failure?.telemetry.model ?? aiOptions.model,
            endpoint: failure?.telemetry.endpoint ?? aiOptions.endpoint,
            durationMs: failure?.telemetry.durationMs ?? 0,
            statusCode: failure?.telemetry.httpStatus ?? null,
            errorKind: failure?.kind ?? "request-failed",
            message: error instanceof Error ? error.message : "AI request failed."
          }
        });
        render();
      });
      return;
    }

    if (target.closest("[data-action='copy-ai-prompt']")) {
      if (state.aiPrompt && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(state.aiPrompt).catch(() => {});
      }
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
      state.aiResponse = null;
      state.aiError = null;
      state.activeAIDiagnosticsSection = DEFAULT_AI_DIAGNOSTICS_SECTION;
      aiRequestTokenRef.current += 1;
      notifyInspectMode(state.activeTab === "Components");
      notifyComponentSelection(null, null, "clear");
      render();
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

function isAIDiagnosticsSectionKey(value: unknown): value is AIDiagnosticsSectionKey {
  return value === "session-mode"
    || value === "analysis-output"
    || value === "prompt-inputs"
    || value === "provider-telemetry"
    || value === "metadata-checks"
    || value === "document-context";
}
