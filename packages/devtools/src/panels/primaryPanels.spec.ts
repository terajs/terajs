import { describe, expect, it } from "vitest";
import { renderPerformancePanel, renderQueuePanel, renderRouterPanel, renderSanityPanel } from "./diagnosticsPanels.js";
import { renderIssuesPanel, renderLogsPanel, renderMetaPanel, renderSignalsPanel, renderTimelinePanel } from "./primaryPanels.js";

describe("primaryPanels", () => {
  it("renders issues, logs, and queue as investigation journals with no implicit selection", () => {
    const issuesMarkup = renderIssuesPanel({
      events: [{
        type: "lifecycle:warn",
        timestamp: 100,
        level: "warn",
        payload: { message: "Warn once", component: "Editor" }
      }],
      issueFilter: "all",
      selectedIssueKey: null,
      expandedValuePaths: new Set<string>(),
    });

    const logsMarkup = renderLogsPanel({
      events: [{
        type: "route:changed",
        timestamp: 101,
        payload: { to: "/docs" }
      }, {
        type: "dom:insert",
        timestamp: 102,
        payload: {
          parent: { nodeName: "div" },
          position: "append"
        }
      }],
      logFilter: "all",
      selectedLogEntryKey: null,
      expandedValuePaths: new Set<string>(),
    });

    const queueMarkup = renderQueuePanel({
      events: [{
        type: "queue:fail",
        timestamp: 120,
        payload: {
          id: "draft:1",
          type: "draft:save",
          error: "offline"
        }
      }],
      selectedQueueEntryKey: null,
      expandedValuePaths: new Set<string>(),
    });

    expect(issuesMarkup).toContain("issues-panel-layout");
    expect(issuesMarkup).toContain("investigation-panel--issues");
    expect(issuesMarkup).toContain("investigation-journal");
    expect(issuesMarkup).toContain("data-issue-entry-key=");
    expect(issuesMarkup).toContain("Issue Investigation");
    expect(issuesMarkup).toContain("Issue feed");
    expect(issuesMarkup).toContain("Inspect one surfaced issue");
    expect(issuesMarkup).toContain("devtools-section-subcontrols");
    expect(issuesMarkup).toContain("select-button--compact");
    expect(issuesMarkup).not.toContain("workbench-filter-button");
    expect(issuesMarkup).not.toContain("Issue metadata");
    expect(issuesMarkup).not.toContain("structured-value-viewer");

    expect(logsMarkup).toContain("logs-panel-layout");
    expect(logsMarkup).toContain("investigation-panel--logs");
    expect(logsMarkup).toContain("investigation-journal");
    expect(logsMarkup).toContain("data-log-entry-key=");
    expect(logsMarkup).toContain("Route Changed");
    expect(logsMarkup).toContain("Component 1");
    expect(logsMarkup).toContain("Component activity");
    expect(logsMarkup).toContain("Event Investigation");
    expect(logsMarkup).toContain("Choose an event to inspect");
    expect(logsMarkup).toContain("devtools-section-subcontrols");
    expect(logsMarkup).toContain("select-button--compact");
    expect(logsMarkup).not.toContain("workbench-filter-button");
    expect(logsMarkup).not.toContain("Captured fields");
    expect(logsMarkup).not.toContain("structured-value-viewer");

    expect(queueMarkup).toContain("queue-panel-layout");
    expect(queueMarkup).toContain("investigation-panel--queue");
    expect(queueMarkup).toContain("investigation-journal");
    expect(queueMarkup).toContain("data-queue-entry-key=");
    expect(queueMarkup).toContain("Queue Investigation");
    expect(queueMarkup).toContain("Inspect one queue event");
    expect(queueMarkup).not.toContain("Selection summary");
    expect(queueMarkup).not.toContain("structured-value-viewer");
  });

  it("renders selected issues, logs, and queue entries as data-only inspectors", () => {
    const issuesMarkup = renderIssuesPanel({
      events: [{
        type: "lifecycle:warn",
        timestamp: 100,
        level: "warn",
        payload: {
          message: "Warn once",
          component: "Editor",
          context: {
            route: "/docs"
          }
        }
      }],
      issueFilter: "all",
      selectedIssueKey: "100:lifecycle:warn:Warn once",
      expandedValuePaths: new Set(["issues.100:lifecycle:warn:Warn once/context"]),
    });

    const logsMarkup = renderLogsPanel({
      events: [{
        type: "route:changed",
        timestamp: 101,
        payload: { to: "/docs" }
      }, {
        type: "dom:insert",
        timestamp: 102,
        payload: {
          parent: { nodeName: "div" },
          position: "append"
        }
      }],
      logFilter: "all",
      selectedLogEntryKey: "102:dom:insert:1",
      expandedValuePaths: new Set(["logs.102:dom:insert:1/parent"]),
    });

    const queueMarkup = renderQueuePanel({
      events: [{
        type: "queue:fail",
        timestamp: 120,
        payload: {
          id: "draft:1",
          type: "draft:save",
          error: "offline"
        }
      }],
      selectedQueueEntryKey: "120:queue:fail:type=draft:save id=draft:1",
      expandedValuePaths: new Set(["queue.120:queue:fail:type=draft:save id=draft:1/error"]),
    });

    expect(issuesMarkup).toContain("structured-value-viewer");
    expect(issuesMarkup).toContain("&quot;component&quot;");
    expect(issuesMarkup).toContain('data-value-path="issues.100:lifecycle:warn:Warn once/context"');
    expect(issuesMarkup).toContain('aria-expanded="true"');
    expect(issuesMarkup).not.toContain("Selection summary");
    expect(issuesMarkup).not.toContain("Issue metadata");
    expect(issuesMarkup).not.toContain("Captured context");

    expect(logsMarkup).toContain("structured-value-viewer");
    expect(logsMarkup).toContain("&quot;position&quot;");
    expect(logsMarkup).toContain('aria-expanded="true"');
    expect(logsMarkup).toContain('data-value-path="logs.102:dom:insert:1/parent"');
    expect(logsMarkup).not.toContain("Selection summary");
    expect(logsMarkup).not.toContain("Event metadata");
    expect(logsMarkup).not.toContain("Captured fields");

    expect(queueMarkup).toContain("structured-value-viewer");
    expect(queueMarkup).toContain("&quot;error&quot;");
    expect(queueMarkup).not.toContain("Selection summary");
    expect(queueMarkup).not.toContain("Event metadata");
    expect(queueMarkup).not.toContain("Captured context");
  });

  it("renders meta as source navigation with one selected detail pane", () => {
    const markup = renderMetaPanel({
      events: [{
        type: "route:meta:resolved",
        timestamp: 200,
        payload: {
          to: "/docs",
          meta: { title: "Docs" },
          route: { path: "/docs" }
        }
      }],
      selectedMetaKey: "route:/docs:route",
      expandedValuePaths: new Set<string>()
    }, {
      title: "Docs",
      lang: "en",
      dir: "ltr",
      path: "/docs",
      hash: null,
      queryKeys: ["draft"],
      metaTags: [{ key: "description", source: "name", value: "Docs page" }],
      linkTags: [{ rel: "canonical", href: "https://terajs.dev/docs", sameOrigin: true, queryKeys: [] }]
    });

    expect(markup).toContain("Document head");
    expect(markup).toContain("Route /docs");
    expect(markup).toContain("Routes");
    expect(markup).toContain("meta-panel-screen");
    expect(markup).toContain("components-screen--iframe");
    expect(markup).toContain("Route /docs");
    expect(markup).not.toContain("Route snapshot | Captured from Route /docs");
    expect(markup).toContain("data-meta-key=\"route:/docs:route\"");
    expect(markup).toContain("Observed metadata");
    expect(markup).toContain("structured-value-viewer");
    expect(markup).not.toContain("Snapshot facts");
    expect(markup).not.toContain("Captured snapshot");
  });

  it("renders timeline as a left filter rail with matching events on the right", () => {
    const markup = renderTimelinePanel({
      events: [
        { type: "effect:run", timestamp: 1, payload: { key: "alpha" } },
        { type: "signal:update", timestamp: 2, payload: { key: "beta", value: 2 } },
        { type: "route:changed", timestamp: 3, payload: { to: "/later" } }
      ],
      timelineFilter: "signal",
      expandedValuePaths: new Set<string>(),
      expandedDetailKeys: new Set<string>()
    });

    expect(markup).toContain("investigation-journal--timeline");
    expect(markup).toContain("Event filters");
    expect(markup).toContain('data-timeline-filter="all"');
    expect(markup).toContain('data-timeline-filter="signal"');
    expect(markup).toContain("Filtered timeline events");
    expect(markup).toContain("key=beta · value=2");
    expect(markup).not.toContain("key=alpha value=undefined");
    expect(markup).not.toContain("to=/later");
    expect(markup).not.toContain("timeline-inactive");
    expect(markup).toContain("iframe-results-list");
    expect(markup).toContain("iframe-results-item-kicker");
    expect(markup).toContain("Structured context");
    expect(markup).toContain("structured-value-viewer");
    expect(markup).toContain("Signal / Update");
    expect(markup).not.toContain("timeline-slider");
    expect(markup).not.toContain('data-timeline-index="0"');
  });

  it("reuses expanded value paths for timeline structured context toggles", () => {
    const markup = renderTimelinePanel({
      events: [{
        type: "dom:insert",
        timestamp: 10,
        payload: {
          parent: {
            nodeName: "div",
            childCount: 1,
          },
          child: {
            nodeName: "span",
          },
        }
      }],
      timelineFilter: "dom",
      expandedValuePaths: new Set(["timeline.0/parent"]),
      expandedDetailKeys: new Set(["timeline.0"])
    });

    expect(markup).toContain('data-timeline-detail-key="timeline.0"');
    expect(markup).toContain('<details class="iframe-results-item-detail" open>');
    expect(markup).toContain('data-value-path="timeline.0/parent"');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('&quot;nodeName&quot;');
    expect(markup).toContain('&quot;childCount&quot;');
  });

  it("renders router, performance, and sanity as grouped diagnostics decks", () => {
    const routeEvents = [
      {
        type: "route:changed",
        timestamp: 40,
        payload: {
          from: "/",
          to: "/docs/intro",
          route: "/docs/intro",
          source: "link",
          phase: "resolved",
          params: { slug: "intro" },
          query: {
            filters: {
              draft: true,
              locale: "en"
            }
          }
        }
      }
    ];

    const routerMarkup = renderRouterPanel({
      events: routeEvents,
      expandedValuePaths: new Set(["router.snapshot.query/filters"]),
      activeRouterView: "snapshot"
    });

    const performanceEvents = [
      {
        type: "effect:run",
        timestamp: 60,
        payload: { key: "filters" }
      },
      {
        type: "queue:fail",
        timestamp: 62,
        payload: { id: "draft:save" }
      },
      {
        type: "hub:error",
        timestamp: 64,
        payload: { message: "socket closed" }
      }
    ];

    const performanceMarkup = renderPerformancePanel({
      events: performanceEvents,
      activePerformanceView: "overview"
    });
    const performancePressureMarkup = renderPerformancePanel({
      events: performanceEvents,
      activePerformanceView: "pressure"
    });

    const sanityMarkup = renderSanityPanel({
      events: [
        {
          type: "effect:create",
          timestamp: 70,
          payload: { id: "watch:1" }
        },
        {
          type: "effect:run",
          timestamp: 71,
          payload: { id: "watch:1" }
        }
      ],
      activeSanityView: "alerts"
    });

    expect(routerMarkup).toContain("diagnostics-deck--router");
    expect(routerMarkup).toContain("devtools-workbench-title is-blue");
    expect(routerMarkup).toContain("devtools-workbench-subtitle is-blue-soft");
    expect(routerMarkup).toContain('data-router-view="overview"');
    expect(routerMarkup).toContain('data-router-view="timeline"');
    expect(routerMarkup).toContain("Latest route snapshot");
    expect(routerMarkup).toContain("Route params");
    expect(routerMarkup).toContain("Route query");
    expect(routerMarkup).toContain("structured-value-viewer");
    expect(routerMarkup).toContain("&quot;slug&quot;");
    expect(routerMarkup).toContain("&quot;draft&quot;");
    expect(routerMarkup).toContain('data-value-path="router.snapshot.query/filters"');
    expect(routerMarkup).toContain('aria-expanded="true"');
    expect(routerMarkup).not.toContain("Route activity");

    expect(performanceMarkup).toContain("diagnostics-deck--performance");
    expect(performanceMarkup).toContain("Window pulse");
    expect(performanceMarkup).toContain('data-performance-view="pressure"');
    expect(performanceMarkup).toContain('data-performance-view="hot-types"');
    expect(performanceMarkup).toContain("Use the grouped views to keep throughput");
    expect(performancePressureMarkup).toContain("Queue and hub pressure");
    expect(performancePressureMarkup).toContain("Hub disconnects");

    expect(sanityMarkup).toContain("diagnostics-deck--sanity");
    expect(sanityMarkup).toContain("devtools-workbench-title is-green");
    expect(sanityMarkup).toContain("devtools-workbench-subtitle is-green-soft");
    expect(sanityMarkup).toContain('data-sanity-view="overview"');
    expect(sanityMarkup).toContain('data-sanity-view="alerts"');
    expect(sanityMarkup).toContain("Alert feed");
    expect(sanityMarkup).not.toContain("Health snapshot");
  });

  it("formats structured signal updates with the shared value viewer", () => {
    const markup = renderSignalsPanel({
      events: [{
        type: "signal:update",
        timestamp: 50,
        payload: {
          key: "filters",
          value: {
            sort: "asc",
            tags: ["docs"]
          }
        }
      }],
      selectedSignalKey: "update:filters",
      signalViewMode: "recent",
      expandedValuePaths: new Set(["signals.update:filters/tags"]),
    });

    expect(markup).toContain("Recent updates");
    expect(markup).toContain("signals-panel-screen");
    expect(markup).toContain("components-screen--iframe");
    expect(markup).toContain("data-signal-mode=" );
    expect(markup).toContain("data-signal-key=");
    expect(markup).toContain("structured-value-viewer");
    expect(markup).toContain("&quot;sort&quot;");
    expect(markup).toContain("signals-inspector-surface");
    expect(markup).not.toContain("Selection summary");
    expect(markup).not.toContain("Recent activity");
  });

  it("renders Signals with no auto-selected entry when no signal is chosen", () => {
    const markup = renderSignalsPanel({
      events: [{
        type: "signal:update",
        timestamp: 50,
        payload: {
          key: "filters",
          value: JSON.stringify([{ label: "Installation", href: "/docs/installation" }])
        }
      }],
      selectedSignalKey: null,
      signalViewMode: "recent",
      expandedValuePaths: new Set<string>(),
    });

    expect(markup).toContain("Choose one reactive value");
    expect(markup).toContain("Recent updates");
    expect(markup).not.toContain("Latest emitted value");
    expect(markup).not.toContain("structured-value-viewer");
    expect(markup).not.toContain("signals-empty-steps");
    expect(markup).not.toContain("Use Active values when you need the current retained state.");
  });
});