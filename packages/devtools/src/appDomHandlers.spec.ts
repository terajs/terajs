import { describe, expect, it, vi } from "vitest";
import { createInputHandler } from "./appDomHandlers.js";

describe("createInputHandler", () => {
  it("updates the log search query and clears the selected entry", () => {
    const state = {
      componentSearchQuery: "",
      componentInspectorQuery: "",
      iframePanels: {
        meta: {
          selectedKey: null,
          searchQuery: "",
        },
        signals: {
          selectedKey: null,
          searchQuery: "",
          viewMode: "active" as const,
          detailView: "inspect" as const,
        },
        issues: {
          filter: "all" as const,
          selectedKey: null,
        },
        logs: {
          filter: "all" as const,
          selectedEntryKey: "route:1",
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
          activeView: "overview" as const,
        },
        sanity: {
          activeView: "overview" as const,
        },
      },
    };
    const render = vi.fn();
    const handler = createInputHandler(state, render);

    const target = {
      tagName: "INPUT",
      value: "route",
      dataset: {
        logSearch: "true",
      },
    } as unknown as HTMLInputElement;

    handler({ target } as unknown as Event);

    expect(state.iframePanels.logs.searchQuery).toBe("route");
    expect(state.iframePanels.logs.selectedEntryKey).toBeNull();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("updates inspector search fields while preserving signal selection", () => {
    const state = {
      componentSearchQuery: "",
      componentInspectorQuery: "",
      iframePanels: {
        meta: {
          selectedKey: "document:head",
          searchQuery: "",
        },
        signals: {
          selectedKey: "update:filters",
          searchQuery: "",
          viewMode: "active" as const,
          detailView: "inspect" as const,
        },
        issues: {
          filter: "all" as const,
          selectedKey: null,
        },
        logs: {
          filter: "all" as const,
          selectedEntryKey: "1:route:changed:0",
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
          activeView: "overview" as const,
        },
        sanity: {
          activeView: "overview" as const,
        },
      },
    };
    const render = vi.fn();
    const handler = createInputHandler(state, render);

    handler({
      target: {
        tagName: "INPUT",
        value: "filters",
        dataset: { signalSearch: "true" },
      }
    } as unknown as Event);

    expect(state.iframePanels.signals.searchQuery).toBe("filters");
    expect(state.iframePanels.signals.selectedKey).toBe("update:filters");
    expect(render).toHaveBeenCalledTimes(1);
  });
});