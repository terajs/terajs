import { describe, expect, it, vi } from "vitest";
import { createClickHandler } from "./appClickHandler.js";
import type { InspectorSectionKey } from "./inspector/drilldownRenderer.js";
import type {
  AIDiagnosticsSectionKey,
  AIDocumentContextView,
  AIAnalysisOutputView,
  AISessionModeView,
  PerformancePanelView,
} from "./panels/diagnosticsPanels.js";

function createState() {
  return {
    activeTab: "Issues" as const,
    events: [],
    mountedComponents: new Map(),
    expandedComponentNodeKeys: new Set<string>(),
    componentTreeInitialized: false,
    componentTreeVersion: 0,
    expandedComponentTreeVersion: 0,
    expandedInspectorSections: new Set<InspectorSectionKey>(),
    expandedValuePaths: new Set<string>(),
    eventCount: 0,
    iframePanels: {
      meta: {
        selectedKey: null,
        searchQuery: "",
      },
      signals: {
        selectedKey: null,
        searchQuery: "",
        viewMode: "active" as const,
        detailView: "inspect" as "inspect" | "summary",
      },
      issues: {
        filter: "all" as const,
        selectedKey: null,
      },
      logs: {
        filter: "all" as const,
        selectedEntryKey: null,
        searchQuery: "",
      },
      timeline: {
        filter: "all" as const,
        expandedDetailKeys: new Set<string>(),
      },
      router: {
        activeView: "overview" as const,
      },
      queue: {
        selectedEntryKey: null,
      },
      performance: {
        activeView: "overview" as PerformancePanelView,
      },
      sanity: {
        activeView: "overview" as const,
      },
    },
    selectedComponentKey: null,
    selectedComponentActivityVersion: 0,
    componentSearchQuery: "",
    componentInspectorQuery: "",
    theme: "dark" as const,
    aiPrompt: null,
    aiLikelyCause: null,
    aiStatus: "idle" as const,
    activeAIRequestTarget: null,
    aiResponse: null,
    aiStructuredResponse: null,
    aiError: null,
    activeAIDiagnosticsSection: "analysis-output" as AIDiagnosticsSectionKey,
    activeAIDocumentContextView: "overview" as AIDocumentContextView,
    activeAISessionModeView: "overview" as AISessionModeView,
    activeAIAnalysisOutputView: "overview" as AIAnalysisOutputView,
    hostControlsOpen: false,
    overlayPosition: "bottom-right" as const,
    overlayPanelSize: "normal" as const,
    persistOverlayPreferences: false,
  };
}

describe("createClickHandler", () => {
  it("updates iframe-safe issue and log filters from element-like targets", () => {
    const state = createState();
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const issueTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-issue-filter]"
        ? { dataset: { issueFilter: "warn" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: issueTarget } as unknown as Event);

  expect(state.iframePanels.issues.filter).toBe("warn");
    expect(render).toHaveBeenCalledTimes(1);

    const logTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-log-filter]"
        ? { dataset: { logFilter: "route" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: logTarget } as unknown as Event);

  expect(state.iframePanels.logs.filter).toBe("route");
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("switches router, timeline, and sanity panel filters", () => {
    const state = createState();
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: { enabled: false, endpoint: null, model: "gpt-5.4", timeoutMs: 1000 },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    handler({
      target: {
        dataset: {},
        closest: (selector: string) => selector === "[data-router-view]" ? { dataset: { routerView: "issues" } } : null,
      }
    } as unknown as Event);
    handler({
      target: {
        dataset: {},
        closest: (selector: string) => selector === "[data-timeline-filter]" ? { dataset: { timelineFilter: "signal" } } : null,
      }
    } as unknown as Event);
    handler({
      target: {
        dataset: {},
        closest: (selector: string) => selector === "[data-sanity-view]" ? { dataset: { sanityView: "alerts" } } : null,
      }
    } as unknown as Event);

    expect(state.iframePanels.router.activeView).toBe("issues");
    expect(state.iframePanels.timeline.filter).toBe("signal");
    expect(state.iframePanels.sanity.activeView).toBe("alerts");
    expect(render).toHaveBeenCalledTimes(3);
  });

  it("selects a timeline filter from iframe-safe targets", () => {
    const state = createState();
    state.iframePanels.timeline.filter = "all";
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: { enabled: false, endpoint: null, model: "test", timeoutMs: 1000 },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    handler({
      target: {
        dataset: {},
        closest: (selector: string) => selector === "[data-timeline-filter]" ? { dataset: { timelineFilter: "route" } } : null,
      }
    } as unknown as Event);

    expect(state.iframePanels.timeline.filter).toBe("route");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("selects issue, signal, queue, and log entries from iframe-safe targets", () => {
    const state = createState();
    state.iframePanels.signals.detailView = "summary";
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const issueTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-issue-entry-key]"
        ? { dataset: { issueEntryKey: "issue:warn:100" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: issueTarget } as unknown as Event);

    expect(state.iframePanels.issues.selectedKey).toBe("issue:warn:100");
    expect(render).toHaveBeenCalledTimes(1);

    const signalTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-signal-key]"
        ? { dataset: { signalKey: "update:count" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: signalTarget } as unknown as Event);

    expect(state.iframePanels.signals.selectedKey).toBe("update:count");
    expect(render).toHaveBeenCalledTimes(2);

    const queueTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-queue-entry-key]"
        ? { dataset: { queueEntryKey: "queue:fail:123" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: queueTarget } as unknown as Event);

    expect(state.iframePanels.queue.selectedEntryKey).toBe("queue:fail:123");
    expect(render).toHaveBeenCalledTimes(3);

    const logTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-log-entry-key]"
        ? { dataset: { logEntryKey: "123:route:changed:0" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: logTarget } as unknown as Event);

    expect(state.iframePanels.logs.selectedEntryKey).toBe("123:route:changed:0");
    expect(render).toHaveBeenCalledTimes(4);
  });

  it("switches the signals rail between active values and recent updates", () => {
    const state = createState();
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const modeTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-signal-mode]"
        ? { dataset: { signalMode: "recent" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: modeTarget } as unknown as Event);

    expect(state.iframePanels.signals.viewMode).toBe("recent");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("switches the document context sub-view from AI detail controls", () => {
    const state = createState();
    state.activeAIDiagnosticsSection = "document-context";
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const subViewTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-ai-document-context-view]"
        ? { dataset: { aiDocumentContextView: "meta-tags" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: subViewTarget } as unknown as Event);

    expect(state.activeAIDocumentContextView).toBe("meta-tags");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("switches the session mode sub-view from AI detail controls", () => {
    const state = createState();
    state.activeAIDiagnosticsSection = "session-mode";
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const subViewTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-ai-session-mode-view]"
        ? { dataset: { aiSessionModeView: "coverage" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: subViewTarget } as unknown as Event);

    expect(state.activeAISessionModeView).toBe("coverage");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("switches the structured AI analysis sub-view from AI detail controls", () => {
    const state = createState();
    state.activeAIDiagnosticsSection = "analysis-output";
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const subViewTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-ai-analysis-output-view]"
        ? { dataset: { aiAnalysisOutputView: "code-references" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: subViewTarget } as unknown as Event);

    expect(state.activeAIAnalysisOutputView).toBe("code-references");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("toggles expanded structured value nodes from iframe-safe targets", () => {
    const state = createState();
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const valueTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-action='toggle-value-node']"
        ? { dataset: { valuePath: "logs.123:dom:insert:0/parent" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: valueTarget } as unknown as Event);

    expect(state.expandedValuePaths.has("logs.123:dom:insert:0/parent")).toBe(true);
    expect(render).toHaveBeenCalledTimes(1);

    handler({ target: valueTarget } as unknown as Event);

    expect(state.expandedValuePaths.has("logs.123:dom:insert:0/parent")).toBe(false);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("toggles timeline detail disclosures from iframe-safe targets", () => {
    const state = createState();
    const render = vi.fn();
    const preventDefault = vi.fn();
    const blur = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const detailTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-timeline-detail-key]"
        ? { dataset: { timelineDetailKey: "timeline.3999" }, blur }
        : null,
    } as unknown as HTMLElement;

    handler({ target: detailTarget, preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledTimes(1);
    expect(state.iframePanels.timeline.expandedDetailKeys.has("timeline.3999")).toBe(true);
    expect(render).toHaveBeenCalledTimes(1);

    handler({ target: detailTarget, preventDefault } as unknown as Event);

    expect(state.iframePanels.timeline.expandedDetailKeys.has("timeline.3999")).toBe(false);
    expect(blur).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("switches the performance panel view from grouped controls", () => {
    const state = createState();
    const render = vi.fn();
    const handler = createClickHandler({
      state,
      aiOptions: {
        enabled: false,
        endpoint: null,
        model: "test",
        timeoutMs: 1000,
      },
      aiRequestTokenRef: { current: 0 },
      readDocumentContext: () => null,
      defaultExpandedInspectorSections: [],
      clearPersistedEvents: vi.fn(),
      emitDevtoolsEvent: vi.fn(),
      render,
      notifyComponentSelection: vi.fn(),
      notifyLayoutPreferences: vi.fn(),
    });

    const performanceTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-performance-view]"
        ? { dataset: { performanceView: "hot-types" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: performanceTarget } as unknown as Event);

    expect(state.iframePanels.performance.activeView).toBe("hot-types");
    expect(render).toHaveBeenCalledTimes(1);
  });
});