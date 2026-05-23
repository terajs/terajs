import { getDebugListenerCount } from "@terajs/shared";

import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "../sanity.js";
import type { DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import {
  renderDiagnosticsFeed,
  renderDiagnosticsSinglePanel,
  renderDiagnosticsViewControls,
  renderWorkbenchMetrics,
  type DiagnosticsDeckView
} from "./diagnosticsPanelShared.js";

export type SanityPanelView = "overview" | "alerts";
export const DEFAULT_SANITY_PANEL_VIEW: SanityPanelView = "overview";

interface SanityStateLike {
  events: DevtoolsEventLike[];
  activeSanityView?: SanityPanelView;
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
  const sanityViews: Array<DiagnosticsDeckView<SanityPanelView>> = [
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

  return renderDiagnosticsSinglePanel({
    className: "sanity-panel-layout diagnostics-deck diagnostics-deck--sanity",
    ariaLabel: "Sanity diagnostics",
    title: "Sanity Check",
    subtitle: `Critical: ${criticalCount} | Warnings: ${warningCount}`,
    titleToneClass: criticalCount > 0 ? "is-red" : warningCount > 0 ? "is-amber" : "is-green",
    subtitleToneClass: criticalCount > 0 ? "is-red-soft" : warningCount > 0 ? "is-amber-soft" : "is-green-soft",
    selectedView,
    controls: renderDiagnosticsViewControls(selectedView.key, "Sanity views", "data-sanity-view", [
      { key: "overview", label: "Overview" },
      { key: "alerts", label: "Alerts" },
    ])
  });
}