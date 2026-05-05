import { computePerformanceMetrics, computeRouterMetrics } from "../analytics.js";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "../sanity.js";
import { getDebugListenerCount } from "@terajs/shared";
import {
  collectRouteIssues,
  collectRouteSnapshot,
  collectRouteTimeline,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderIframeFlatSection,
  renderIframeSinglePanel,
  renderIframeWorkbench,
  renderWorkbenchFacts,
  renderWorkbenchIntroState,
  renderWorkbenchList,
  renderWorkbenchMetrics,
} from "./iframeShells.js";
import { renderDevtoolsHeadingRow } from "../devtoolsIcons.js";
export { renderQueuePanel } from "./queuePanel.js";
export { renderSettingsPanel } from "./settingsPanel.js";

export {
  DEFAULT_AI_ANALYSIS_OUTPUT_VIEW,
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  DEFAULT_AI_DOCUMENT_CONTEXT_VIEW,
  DEFAULT_AI_SESSION_MODE_VIEW,
  renderAIDiagnosticsPanel,
  type AIAnalysisOutputView,
  type AIDiagnosticsSectionKey,
  type AISessionModeView,
  type AIDocumentContextView
} from "./aiDiagnosticsPanel.js";

export type PerformancePanelView = "overview" | "pressure" | "hot-types";
export type RouterPanelView = "overview" | "snapshot" | "activity" | "issues" | "timeline";
export type SanityPanelView = "overview" | "alerts";

export const DEFAULT_PERFORMANCE_PANEL_VIEW: PerformancePanelView = "overview";
export const DEFAULT_ROUTER_PANEL_VIEW: RouterPanelView = "overview";
export const DEFAULT_SANITY_PANEL_VIEW: SanityPanelView = "overview";

interface PerformanceStateLike {
  events: DevtoolsEventLike[];
  activePerformanceView?: PerformancePanelView;
}

interface RouterStateLike {
  events: DevtoolsEventLike[];
  expandedValuePaths: Set<string>;
  activeRouterView?: RouterPanelView;
}

interface SanityStateLike {
  events: DevtoolsEventLike[];
  activeSanityView?: SanityPanelView;
}

interface DiagnosticsFeedItem {
  title: string;
  summary?: string;
  meta?: string;
  badge?: string;
  tone?: "neutral" | "warn" | "error" | "accent";
}

function renderPerformanceViewControls(activeView: PerformancePanelView): string {
  return renderDiagnosticsViewControls(activeView, "Performance views", "data-performance-view", [
    { key: "overview", label: "Overview" },
    { key: "pressure", label: "Pressure" },
    { key: "hot-types", label: "Hot Types" },
  ]);
}

function renderDiagnosticsViewControls<TView extends string>(
  activeView: TView,
  ariaLabel: string,
  dataAttribute: string,
  views: Array<{ key: TView; label: string }>
): string {
  return `
    <div class="devtools-section-subcontrols" role="tablist" aria-label="${escapeHtml(ariaLabel)}">
      ${views.map((view) => `
        <button
          class="select-button select-button--compact ${activeView === view.key ? "is-selected" : ""}"
          type="button"
          ${dataAttribute}="${view.key}"
          role="tab"
          aria-selected="${activeView === view.key ? "true" : "false"}"
        >${escapeHtml(view.label)}</button>
      `).join("")}
    </div>
  `;
}

export function renderRouterPanel(state: RouterStateLike): string {
  const metrics = computeRouterMetrics(state.events, 30000);
  const snapshot = collectRouteSnapshot(state.events);
  const timeline = collectRouteTimeline(state.events).slice(-80).reverse();
  const issues = collectRouteIssues(state.events).slice(-30).reverse();
  const activeView = state.activeRouterView ?? DEFAULT_ROUTER_PANEL_VIEW;
  const routeParamsMarkup = snapshot.params === undefined
    ? `<div class="empty-state">No params captured for the latest route event.</div>`
    : `<div class="devtools-value-surface">${renderValueExplorer(snapshot.params, "router.snapshot.params", state.expandedValuePaths)}</div>`;
  const routeQueryMarkup = snapshot.query === undefined
    ? `<div class="empty-state">No query values captured for the latest route event.</div>`
    : `<div class="devtools-value-surface">${renderValueExplorer(snapshot.query, "router.snapshot.query", state.expandedValuePaths)}</div>`;
  const routeLead = metrics.mostActiveRoute
    ? `Most route activity is concentrated on ${metrics.mostActiveRoute}. Compare the latest snapshot against the recent route feed before chasing downstream UI symptoms.`
    : "No single route dominates the current window yet. Use the latest snapshot, issues, and timeline together to understand the active navigation state.";

  const routerViews: Array<{ key: RouterPanelView; title: string; className: string; body: string }> = [
    {
      key: "overview",
      title: "Route cockpit",
      className: "diagnostics-deck-section diagnostics-deck-section--hero",
      body: `
        <div class="diagnostics-deck-hero">
          ${renderWorkbenchMetrics([
            { label: "Events", value: String(metrics.totalRouteEvents) },
            { label: "Pending", value: String(metrics.pendingNavigations), tone: metrics.pendingNavigations > 0 ? "warn" : "neutral" },
            { label: "Warnings", value: String(metrics.warnings), tone: metrics.warnings > 0 ? "warn" : "neutral" },
            { label: "Errors", value: String(metrics.errors), tone: metrics.errors > 0 ? "error" : "neutral" },
            { label: "Avg load", value: `${metrics.avgLoadMs}ms`, tone: metrics.avgLoadMs > 0 ? "accent" : "neutral" },
            { label: "Max load", value: `${metrics.maxLoadMs}ms`, tone: metrics.maxLoadMs > metrics.avgLoadMs && metrics.maxLoadMs > 0 ? "warn" : "neutral" },
          ])}
          <div class="devtools-workbench-lead">${escapeHtml(routeLead)}</div>
          <div class="diagnostics-note">Keep the cockpit, latest route snapshot, issue feed, and recent timeline separated so route triage stays readable instead of turning into one long mixed report.</div>
        </div>
      `
    },
    {
      key: "snapshot",
      title: "Latest route snapshot",
      className: "diagnostics-deck-section",
      body: `
        ${renderWorkbenchFacts([
          { label: "Current route", value: snapshot.currentRoute ?? "unknown" },
          { label: "Last event", value: snapshot.lastEventType ?? "none" },
          { label: "Source", value: snapshot.source ?? "unknown" },
          { label: "From", value: snapshot.from ?? "null" },
          { label: "To", value: snapshot.to ?? "null" },
          { label: "Guard context", value: snapshot.guardContext ?? "none" },
          { label: "Phase", value: snapshot.phase ?? "unknown" },
          { label: "Most active", value: metrics.mostActiveRoute ?? "none" },
        ])}
        <div class="structured-value-grid">
          <div class="structured-value-section">
            <div class="structured-value-section-title">Route params</div>
            ${routeParamsMarkup}
          </div>
          <div class="structured-value-section">
            <div class="structured-value-section-title">Route query</div>
            ${routeQueryMarkup}
          </div>
        </div>
      `
    },
    {
      key: "activity",
      title: "Route activity",
      className: "diagnostics-deck-section",
      body: renderDiagnosticsFeed(
        metrics.byRoute.slice(0, 12).map((entry) => ({
          title: entry.route,
          summary: `${entry.hits} hits · ${entry.redirects} redirects · ${entry.blocked} blocked · ${entry.errors} errors`,
          meta: `avg ${entry.avgLoadMs}ms · max ${entry.maxLoadMs}ms`,
          badge: `${entry.hits}`,
          tone: entry.errors > 0 ? "error" : entry.blocked > 0 ? "warn" : "accent"
        })),
        "No route activity in the current window."
      )
    },
    {
      key: "issues",
      title: "Routing issues",
      className: "diagnostics-deck-section",
      body: renderDiagnosticsFeed(
        issues.map((issue) => ({
          title: issue.summary,
          meta: issue.type,
          badge: issue.type === "error:router" ? "Error" : issue.type === "route:blocked" ? "Blocked" : "Warn",
          tone: issue.type === "error:router" || issue.type === "route:blocked" ? "error" : "warn"
        })),
        "No router warnings or errors."
      )
    },
    {
      key: "timeline",
      title: "Recent route timeline",
      className: "diagnostics-deck-section",
      body: renderDiagnosticsFeed(
        timeline.map((entry) => ({
          title: entry.type,
          summary: entry.summary,
          tone: entry.type === "error:router" || entry.type === "route:blocked"
            ? "error"
            : entry.type === "route:warn"
              ? "warn"
              : "accent"
        })),
        "No route events captured yet."
      )
    }
  ];
  const selectedView = routerViews.find((view) => view.key === activeView) ?? routerViews[0];

  return renderIframeSinglePanel({
    className: "router-panel-layout diagnostics-deck diagnostics-deck--router",
    ariaLabel: "Router diagnostics",
    title: "Router Diagnostics",
    subtitle: `Current route: ${snapshot.currentRoute ?? "unknown"}`,
    titleToneClass: "is-blue",
    subtitleToneClass: "is-blue-soft",
    body: `
      <section class="iframe-panel-section-block ${selectedView.className}">
        <div class="devtools-section-subheader">
          ${renderDevtoolsHeadingRow(selectedView.title, "iframe-panel-section-heading")}
          ${renderDiagnosticsViewControls(selectedView.key, "Router views", "data-router-view", [
            { key: "overview", label: "Overview" },
            { key: "snapshot", label: "Snapshot" },
            { key: "activity", label: "Activity" },
            { key: "issues", label: "Issues" },
            { key: "timeline", label: "Timeline" },
          ])}
        </div>
        ${selectedView.body}
      </section>
    `
  });
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

  const performanceViews: Array<{ key: PerformancePanelView; title: string; className: string; body: string }> = [
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

  return renderIframeSinglePanel({
    className: "performance-panel-layout diagnostics-deck diagnostics-deck--performance",
    ariaLabel: "Performance diagnostics",
    title: "Performance",
    subtitle: `Hot event types: ${metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", ")}`,
    titleToneClass: "is-cyan",
    subtitleToneClass: "is-cyan-soft",
    body: `
      <section class="iframe-panel-section-block ${selectedView.className}">
        <div class="devtools-section-subheader">
          ${renderDevtoolsHeadingRow(selectedView.title, "iframe-panel-section-heading")}
          ${renderPerformanceViewControls(selectedView.key)}
        </div>
        ${selectedView.body}
      </section>
    `
  });
}

export function renderSanityPanel(state: SanityStateLike): string {
  const metrics = computeSanityMetrics(state.events, {
    ...DEFAULT_SANITY_THRESHOLDS,
    debugListenerCount: getDebugListenerCount()
  });
  const criticalCount = metrics.alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = metrics.alerts.filter((alert) => alert.severity === "warning").length;
  const activeView = state.activeSanityView ?? DEFAULT_SANITY_PANEL_VIEW;
  const sanityLead = criticalCount > 0
    ? `${criticalCount} critical alerts need attention before you trust the live runtime state.`
    : warningCount > 0
      ? `${warningCount} warning alerts are active. Compare them with the current effect lifecycle before dismissing them.`
      : "No runaway effects or listener leaks are currently detected in the active window.";
  const sanityViews: Array<{ key: SanityPanelView; title: string; className: string; body: string }> = [
    {
      key: "overview",
      title: "Health snapshot",
      className: "diagnostics-deck-section diagnostics-deck-section--hero",
      body: `
        <div class="diagnostics-deck-hero">
          ${renderWorkbenchMetrics([
            { label: "Active effects", value: String(metrics.activeEffects), tone: metrics.activeEffects > DEFAULT_SANITY_THRESHOLDS.maxActiveEffects ? "warn" : "neutral" },
            { label: "Creates", value: String(metrics.effectCreates) },
            { label: "Disposes", value: String(metrics.effectDisposes) },
            { label: "Runs / sec", value: String(metrics.effectRunsPerSecond), tone: metrics.effectRunsPerSecond > DEFAULT_SANITY_THRESHOLDS.maxEffectRunsPerSecond ? "warn" : "neutral" },
            { label: "Imbalance", value: String(metrics.effectImbalance), tone: metrics.effectImbalance > DEFAULT_SANITY_THRESHOLDS.maxEffectImbalance ? "error" : "neutral" },
            { label: "Listeners", value: String(metrics.debugListenerCount), tone: metrics.debugListenerCount > DEFAULT_SANITY_THRESHOLDS.maxDebugListeners ? "warn" : "neutral" },
          ])}
          <div class="devtools-workbench-lead">${escapeHtml(sanityLead)}</div>
          ${metrics.effectLifecycleReason ? `<div class="diagnostics-note">${escapeHtml(metrics.effectLifecycleReason)}</div>` : ""}
        </div>
      `
    },
    {
      key: "alerts",
      title: "Alert feed",
      className: "diagnostics-deck-section",
      body: renderDiagnosticsFeed(
        metrics.alerts.map((alert) => ({
          title: alert.message,
          meta: `confidence ${alert.confidence} · current ${alert.current} · threshold ${alert.threshold}`,
          badge: alert.severity === "critical" ? "Critical" : "Warning",
          tone: alert.severity === "critical" ? "error" : "warn"
        })),
        "No runaway effects or listener leaks detected in the active window."
      )
    }
  ];
  const selectedView = sanityViews.find((view) => view.key === activeView) ?? sanityViews[0];

  return renderIframeSinglePanel({
    className: "sanity-panel-layout diagnostics-deck diagnostics-deck--sanity",
    ariaLabel: "Sanity diagnostics",
    title: "Sanity Check",
    subtitle: `Critical: ${criticalCount} | Warnings: ${warningCount}`,
    titleToneClass: criticalCount > 0 ? "is-red" : warningCount > 0 ? "is-amber" : "is-green",
    subtitleToneClass: criticalCount > 0 ? "is-red-soft" : warningCount > 0 ? "is-amber-soft" : "is-green-soft",
    body: `
      <section class="iframe-panel-section-block ${selectedView.className}">
        <div class="devtools-section-subheader">
          ${renderDevtoolsHeadingRow(selectedView.title, "iframe-panel-section-heading")}
          ${renderDiagnosticsViewControls(selectedView.key, "Sanity views", "data-sanity-view", [
            { key: "overview", label: "Overview" },
            { key: "alerts", label: "Alerts" },
          ])}
        </div>
        ${selectedView.body}
      </section>
    `
  });
}

function renderDiagnosticsFeed(items: readonly DiagnosticsFeedItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="diagnostics-feed">
      ${items.map((item) => `
        <article class="diagnostics-feed-item ${item.tone && item.tone !== "neutral" ? `is-${item.tone}` : ""}">
          <div class="diagnostics-feed-item-header">
            <div class="diagnostics-feed-item-title">${escapeHtml(item.title)}</div>
            ${item.badge ? `<span class="diagnostics-feed-item-badge">${escapeHtml(item.badge)}</span>` : ""}
          </div>
          ${item.summary ? `<div class="diagnostics-feed-item-summary">${escapeHtml(item.summary)}</div>` : ""}
          ${item.meta ? `<div class="diagnostics-feed-item-meta">${escapeHtml(item.meta)}</div>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}
