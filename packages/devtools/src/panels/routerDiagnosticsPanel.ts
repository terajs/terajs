import { computeRouterMetrics } from "../analytics.js";
import {
  collectRouteIssues,
  collectRouteSnapshot,
  collectRouteTimeline,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import { escapeHtml } from "../inspector/shared.js";
import {
  renderDiagnosticsFeed,
  renderDiagnosticsSinglePanel,
  renderDiagnosticsViewControls,
  renderWorkbenchFacts,
  renderWorkbenchMetrics,
  type DiagnosticsDeckView
} from "./diagnosticsPanelShared.js";

export type RouterPanelView = "overview" | "snapshot" | "activity" | "issues" | "timeline";
export const DEFAULT_ROUTER_PANEL_VIEW: RouterPanelView = "overview";

interface RouterStateLike {
  events: DevtoolsEventLike[];
  expandedValuePaths: Set<string>;
  activeRouterView?: RouterPanelView;
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

  const routerViews: Array<DiagnosticsDeckView<RouterPanelView>> = [
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
          { label: "Last duration", value: snapshot.durationMs === null ? "n/a" : `${snapshot.durationMs}ms` },
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

  return renderDiagnosticsSinglePanel({
    className: "router-panel-layout diagnostics-deck diagnostics-deck--router",
    ariaLabel: "Router diagnostics",
    title: "Router Diagnostics",
    subtitle: `Current route: ${snapshot.currentRoute ?? "unknown"}`,
    titleToneClass: "is-blue",
    subtitleToneClass: "is-blue-soft",
    selectedView,
    controls: renderDiagnosticsViewControls(selectedView.key, "Router views", "data-router-view", [
      { key: "overview", label: "Overview" },
      { key: "snapshot", label: "Snapshot" },
      { key: "activity", label: "Activity" },
      { key: "issues", label: "Issues" },
      { key: "timeline", label: "Timeline" },
    ])
  });
}