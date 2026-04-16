import { describe, expect, it, vi } from "vitest";
import { createClickHandler } from "./appClickHandler.js";
import type { InspectorSectionKey } from "./inspector/drilldownRenderer.js";

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
    selectedMetaKey: null,
    selectedComponentKey: null,
    selectedComponentActivityVersion: 0,
    componentSearchQuery: "",
    componentInspectorQuery: "",
    issueFilter: "all" as const,
    logFilter: "all" as const,
    timelineCursor: -1,
    theme: "dark" as const,
    aiPrompt: null,
    aiLikelyCause: null,
    aiStatus: "idle" as const,
    activeAIRequestTarget: null,
    aiResponse: null,
    aiStructuredResponse: null,
    aiError: null,
    activeAIDiagnosticsSection: "analysis-output" as const,
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
      notifyInspectMode: vi.fn(),
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

    expect(state.issueFilter).toBe("warn");
    expect(render).toHaveBeenCalledTimes(1);

    const logTarget = {
      dataset: {},
      closest: (selector: string) => selector === "[data-log-filter]"
        ? { dataset: { logFilter: "route" } }
        : null,
    } as unknown as HTMLElement;

    handler({ target: logTarget } as unknown as Event);

    expect(state.logFilter).toBe("route");
    expect(render).toHaveBeenCalledTimes(2);
  });
});