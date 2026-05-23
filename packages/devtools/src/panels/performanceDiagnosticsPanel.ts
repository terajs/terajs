import { computePerformanceMetrics } from "../analytics.js";
import type { DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import {
  renderDiagnosticsFeed,
  renderDiagnosticsSinglePanel,
  renderDiagnosticsViewControls,
  renderWorkbenchFacts,
  renderWorkbenchMetrics,
  type DiagnosticsDeckView
} from "./diagnosticsPanelShared.js";

export type PerformancePanelView = "overview" | "pressure" | "hot-types";
export const DEFAULT_PERFORMANCE_PANEL_VIEW: PerformancePanelView = "overview";

interface PerformanceStateLike {
  events: DevtoolsEventLike[];
  activePerformanceView?: PerformancePanelView;
}

function renderPerformanceViewControls(activeView: PerformancePanelView): string {
  return renderDiagnosticsViewControls(activeView, "Performance views", "data-performance-view", [
    { key: "overview", label: "Overview" },
    { key: "pressure", label: "Pressure" },
    { key: "hot-types", label: "Hot Types" },
  ]);
}

export function renderPerformancePanel(state: PerformanceStateLike | DevtoolsEventLike[]): string {
  const events = Array.isArray(state) ? state : state.events;
  const activeView = Array.isArray(state)
    ? DEFAULT_PERFORMANCE_PANEL_VIEW
    : state.activePerformanceView ?? DEFAULT_PERFORMANCE_PANEL_VIEW;
  const metrics = computePerformanceMetrics(events, 10000);
  const performanceLead = metrics.hotTypes.length > 0
    ? `${metrics.hotTypes.length} hot event types crossed the current frequency threshold. Start with the hottest lane before drilling into queue or hub pressure.`
    : "No event family is saturating the current window yet. Use the queue and hub pressure lane to catch the next spike before it turns into visible drift.";

  const performanceViews: Array<DiagnosticsDeckView<PerformancePanelView>> = [
    {
      key: "overview",
      title: "Window pulse",
      className: "diagnostics-deck-section diagnostics-deck-section--hero",
      body: `
        <div class="diagnostics-deck-hero">
          ${renderWorkbenchMetrics([
            { label: "Events", value: String(metrics.totalEvents) },
            { label: "Per sec", value: String(metrics.updatesPerSecond), tone: metrics.updatesPerSecond > 0 ? "accent" : "neutral" },
            { label: "Effects", value: String(metrics.effectRuns), tone: metrics.effectRuns > 0 ? "accent" : "neutral" },
            { label: "Renders", value: String(metrics.renderEvents), tone: metrics.renderEvents > 0 ? "accent" : "neutral" },
            { label: "Queue depth", value: String(metrics.queueDepthEstimate), tone: metrics.queueDepthEstimate > 0 ? "warn" : "neutral" },
            { label: "Hub errors", value: String(metrics.hubErrors), tone: metrics.hubErrors > 0 ? "error" : "neutral" },
          ])}
          <div class="devtools-workbench-lead">${escapeHtml(performanceLead)}</div>
          <div class="diagnostics-note">Use the grouped views to keep throughput, queue or hub pressure, and hot lanes separate instead of scanning one dense mixed report.</div>
        </div>
      `
    },
    {
      key: "pressure",
      title: "Queue and hub pressure",
      className: "diagnostics-deck-section",
      body: `
        ${renderWorkbenchFacts([
          { label: "Queue enqueued", value: String(metrics.queueEnqueued) },
          { label: "Queue flushed", value: String(metrics.queueFlushed) },
          { label: "Queue retried", value: String(metrics.queueRetried) },
          { label: "Queue failed", value: String(metrics.queueFailed) },
          { label: "Hub connects", value: String(metrics.hubConnections) },
          { label: "Hub disconnects", value: String(metrics.hubDisconnections) },
          { label: "Hub push", value: String(metrics.hubPushReceived) },
          { label: "Hot lanes", value: metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", ") },
        ])}
        <div class="diagnostics-note">Queue retries, failures, disconnects, and push traffic stay grouped here so transport pressure does not get buried under raw event totals.</div>
      `
    },
    {
      key: "hot-types",
      title: "Hot event types",
      className: "diagnostics-deck-section",
      body: renderDiagnosticsFeed(
        metrics.byType.slice(0, 20).map((item) => ({
          title: item.type,
          summary: `${item.count} events in the active window`,
          meta: `avg ${item.avgDeltaMs}ms · max ${item.maxDeltaMs}ms`,
          badge: String(item.count),
          tone: item.count >= 10 ? "accent" : item.count >= 5 ? "warn" : "neutral"
        })),
        "No performance data yet."
      )
    }
  ];
  const selectedView = performanceViews.find((view) => view.key === activeView) ?? performanceViews[0];

  return renderDiagnosticsSinglePanel({
    className: "performance-panel-layout diagnostics-deck diagnostics-deck--performance",
    ariaLabel: "Performance diagnostics",
    title: "Performance",
    subtitle: `Hot event types: ${metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", ")}`,
    titleToneClass: "is-cyan",
    subtitleToneClass: "is-cyan-soft",
    selectedView,
    controls: renderPerformanceViewControls(selectedView.key)
  });
}