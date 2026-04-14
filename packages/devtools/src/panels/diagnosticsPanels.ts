import { computePerformanceMetrics, computeRouterMetrics } from "../analytics.js";
import { getGlobalAIAssistantHook } from "../aiHelpers.js";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "../sanity.js";
import { getDebugListenerCount } from "@terajs/shared";
import { analyzeSafeDocumentContext, type SafeDocumentContext, type SafeDocumentDiagnostic } from "../documentContext.js";
import {
  collectMetaEntries,
  collectRouteIssues,
  collectRouteSnapshot,
  collectSignalRegistrySnapshot,
  collectRouteTimeline,
  queueEventSummary,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import { escapeHtml, shortJson } from "../inspector/shared.js";
import { renderMetricCard, renderPageSection, renderPageShell } from "./layout.js";

type OverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type OverlaySize = "normal" | "large";

export type AIDiagnosticsSectionKey =
  | "session-mode"
  | "analysis-output"
  | "prompt-inputs"
  | "provider-telemetry"
  | "metadata-checks"
  | "document-context";

export const DEFAULT_AI_DIAGNOSTICS_SECTION: AIDiagnosticsSectionKey = "analysis-output";

interface SettingsStateLike {
  overlayPosition: OverlayPosition;
  overlayPanelSize: OverlaySize;
  persistOverlayPreferences: boolean;
}

interface AIDiagnosticsStateLike {
  events: DevtoolsEventLike[];
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiLikelyCause: string | null;
  aiResponse: string | null;
  aiError: string | null;
  aiPrompt: string | null;
  aiAssistantEnabled: boolean;
  aiAssistantEndpoint: string | null;
  aiAssistantModel: string;
  aiAssistantTimeoutMs: number;
  activeAIDiagnosticsSection: AIDiagnosticsSectionKey;
  documentContext?: SafeDocumentContext | null;
  documentDiagnostics?: SafeDocumentDiagnostic[];
}

interface AIPromptInputSummary {
  label: string;
  summary: string;
  severity: "info" | "warn" | "error";
}

interface AIAssistantRequestSummary {
  requestId: number | null;
  provider: string;
  delivery: string;
  fallbackPath: string;
  promptChars: number | null;
  signalCount: number | null;
  recentEventCount: number | null;
}

interface AIAssistantOutcomeSummary {
  type: "success" | "error" | "skipped";
  provider: string;
  delivery: string;
  fallbackPath: string;
  durationMs: number | null;
  statusCode: number | null;
  message: string | null;
  errorKind: string | null;
  skippedReason: string | null;
}

interface AIAssistantTelemetrySummary {
  requestCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  lastRequest: AIAssistantRequestSummary | null;
  lastOutcome: AIAssistantOutcomeSummary | null;
}

function hasInspectableAIValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

function summarizeAIPromptIssue(event: DevtoolsEventLike): string {
  const payload = event.payload;
  if (!payload) {
    return event.type;
  }

  if (event.type === "queue:fail") {
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    const attempts = typeof payload.attempts === "number" ? payload.attempts : undefined;
    const error = typeof payload.error === "string" ? payload.error : "unknown error";
    const attemptsSuffix = attempts === undefined
      ? ""
      : ` after ${attempts} attempt${attempts === 1 ? "" : "s"}`;

    return `Queue mutation ${type} failed${attemptsSuffix}: ${error}`;
  }

  if (event.type === "queue:conflict") {
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    const decision = typeof payload.decision === "string" ? payload.decision : "replace";
    return `Queue conflict for ${type} resolved as ${decision}`;
  }

  if (event.type === "queue:skip:missing-handler") {
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    return `Queue handler missing for mutation type ${type}`;
  }

  if (event.type === "hub:error") {
    const transport = typeof payload.transport === "string" ? payload.transport : "hub";
    const message = typeof payload.message === "string" ? payload.message : "unknown error";
    return `Realtime ${transport} transport error: ${message}`;
  }

  if (event.type === "hub:disconnect") {
    const transport = typeof payload.transport === "string" ? payload.transport : "hub";
    const reason = typeof payload.reason === "string" ? payload.reason : "connection closed";
    return `Realtime ${transport} disconnected: ${reason}`;
  }

  if (typeof payload.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  if (typeof payload.likelyCause === "string" && payload.likelyCause.length > 0) {
    return payload.likelyCause;
  }

  return shortJson(payload).slice(0, 220);
}

function isAIPromptIssueEvent(event: DevtoolsEventLike): boolean {
  if (event.type.startsWith("ai:assistant:")) {
    return false;
  }

  return (
    event.level === "warn"
    || event.level === "error"
    || event.type.startsWith("error:")
    || event.type.includes("warn")
    || event.type.includes("hydration")
    || event.type === "hub:error"
    || event.type === "hub:disconnect"
    || event.type === "queue:fail"
    || event.type === "queue:conflict"
    || event.type === "queue:skip:missing-handler"
  );
}

function collectAIPromptInputs(state: AIDiagnosticsStateLike): AIPromptInputSummary[] {
  const inputs: AIPromptInputSummary[] = [];
  const seen = new Set<string>();

  for (const diagnostic of state.documentDiagnostics ?? []) {
    const key = `Document diagnostic:${diagnostic.id}`;
    seen.add(key);
    inputs.push({
      label: `document:${diagnostic.id}`,
      summary: diagnostic.detail ?? diagnostic.message,
      severity: diagnostic.severity
    });

    if (inputs.length >= 6) {
      return inputs;
    }
  }

  if (state.aiError) {
    const key = `Assistant error:${state.aiError}`;
    seen.add(key);
    inputs.push({
      label: "Assistant error",
      summary: state.aiError,
      severity: "error"
    });
  }

  if (state.aiLikelyCause) {
    const key = `Likely cause:${state.aiLikelyCause}`;
    seen.add(key);
    inputs.push({
      label: "Likely cause",
      summary: state.aiLikelyCause,
      severity: "warn"
    });
  }

  for (let index = state.events.length - 1; index >= 0 && inputs.length < 6; index -= 1) {
    const event = state.events[index];
    if (!isAIPromptIssueEvent(event)) {
      continue;
    }

    const summary = summarizeAIPromptIssue(event);
    const key = `${event.type}:${summary}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    inputs.push({
      label: event.type,
      summary,
      severity: event.level === "error" || event.type.startsWith("error:") ? "error" : "warn"
    });
  }

  return inputs;
}

function readStringPayload(payload: Record<string, unknown> | undefined, key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function readNumberPayload(payload: Record<string, unknown> | undefined, key: string): number | null {
  const value = payload?.[key];
  return typeof value === "number" ? value : null;
}

function collectAIAssistantTelemetry(events: DevtoolsEventLike[]): AIAssistantTelemetrySummary {
  const summary: AIAssistantTelemetrySummary = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    lastRequest: null,
    lastOutcome: null
  };

  for (const event of events) {
    const payload = event.payload;

    if (event.type === "ai:assistant:request") {
      summary.requestCount += 1;
      summary.lastRequest = {
        requestId: readNumberPayload(payload, "requestId"),
        provider: readStringPayload(payload, "provider") ?? "unknown",
        delivery: readStringPayload(payload, "delivery") ?? "one-shot",
        fallbackPath: readStringPayload(payload, "fallbackPath") ?? "none",
        promptChars: readNumberPayload(payload, "promptChars"),
        signalCount: readNumberPayload(payload, "signalCount"),
        recentEventCount: readNumberPayload(payload, "recentEventCount")
      };
      continue;
    }

    if (event.type === "ai:assistant:success") {
      summary.successCount += 1;
      summary.lastOutcome = {
        type: "success",
        provider: readStringPayload(payload, "provider") ?? "unknown",
        delivery: readStringPayload(payload, "delivery") ?? "one-shot",
        fallbackPath: readStringPayload(payload, "fallbackPath") ?? "none",
        durationMs: readNumberPayload(payload, "durationMs"),
        statusCode: readNumberPayload(payload, "statusCode"),
        message: null,
        errorKind: null,
        skippedReason: null
      };
      continue;
    }

    if (event.type === "ai:assistant:error") {
      summary.errorCount += 1;
      summary.lastOutcome = {
        type: "error",
        provider: readStringPayload(payload, "provider") ?? "unknown",
        delivery: readStringPayload(payload, "delivery") ?? "one-shot",
        fallbackPath: readStringPayload(payload, "fallbackPath") ?? "none",
        durationMs: readNumberPayload(payload, "durationMs"),
        statusCode: readNumberPayload(payload, "statusCode"),
        message: readStringPayload(payload, "message"),
        errorKind: readStringPayload(payload, "errorKind"),
        skippedReason: null
      };
      continue;
    }

    if (event.type === "ai:assistant:skipped") {
      summary.skippedCount += 1;
      summary.lastOutcome = {
        type: "skipped",
        provider: "none",
        delivery: "one-shot",
        fallbackPath: "none",
        durationMs: null,
        statusCode: null,
        message: null,
        errorKind: null,
        skippedReason: readStringPayload(payload, "reason")
      };
    }
  }

  return summary;
}

function formatAIAssistantProvider(provider: string): string {
  if (provider === "global-hook") {
    return "Global hook";
  }

  if (provider === "http-endpoint") {
    return "HTTP endpoint";
  }

  return provider;
}

function formatAIAssistantFallbackPath(fallbackPath: string): string {
  if (fallbackPath === "global-hook-over-endpoint") {
    return "Global hook preferred over configured endpoint";
  }

  return "None";
}

function formatAIAssistantOutcome(outcome: AIAssistantOutcomeSummary): string {
  if (outcome.type === "success") {
    return "Success";
  }

  if (outcome.type === "error") {
    return outcome.errorKind ? `Failed (${outcome.errorKind})` : "Failed";
  }

  if (outcome.skippedReason === "disabled") {
    return "Skipped (assistant disabled)";
  }

  if (outcome.skippedReason === "unconfigured") {
    return "Skipped (no provider configured)";
  }

  return "Skipped";
}

function resolveAIProviderDetails(state: AIDiagnosticsStateLike): {
  label: string;
  hasGlobalHook: boolean;
  hasEndpoint: boolean;
  activePath: string;
  detail: string;
} {
  const hasGlobalHook = getGlobalAIAssistantHook() !== null;
  const hasEndpoint = typeof state.aiAssistantEndpoint === "string" && state.aiAssistantEndpoint.length > 0;

  if (!state.aiAssistantEnabled) {
    return {
      label: "Disabled",
      hasGlobalHook,
      hasEndpoint,
      activePath: "Assistant calls disabled",
      detail: "DevTools can still assemble prompts, but it will not send them until devtools.ai.enabled is turned back on."
    };
  }

  if (hasGlobalHook && hasEndpoint) {
    return {
      label: "Global hook",
      hasGlobalHook,
      hasEndpoint,
      activePath: "window.__TERAJS_AI_ASSISTANT__",
      detail: "A global hook is active and takes precedence over the configured endpoint while it is present."
    };
  }

  if (hasGlobalHook) {
    return {
      label: "Global hook",
      hasGlobalHook,
      hasEndpoint,
      activePath: "window.__TERAJS_AI_ASSISTANT__",
      detail: "The app is providing its own assistant bridge through a global hook."
    };
  }

  if (hasEndpoint) {
    return {
      label: "HTTP endpoint",
      hasGlobalHook,
      hasEndpoint,
      activePath: state.aiAssistantEndpoint as string,
      detail: "DevTools will POST the assembled prompt, snapshot, sanity metrics, and recent events to the configured endpoint."
    };
  }

  return {
    label: "Prompt-only",
    hasGlobalHook,
    hasEndpoint,
    activePath: "Copyable prompt only",
    detail: "No assistant provider is configured yet, so this panel can build and copy a rich prompt but cannot query a model on its own."
  };
}

function renderAIWorkbenchDetails(summary: string, body: string, open = false): string {
  return `
    <details class="ai-workbench-details"${open ? " open" : ""}>
      <summary>${escapeHtml(summary)}</summary>
      <div class="ai-workbench-details-body">
        ${body}
      </div>
    </details>
  `;
}

function renderAIKeyValueList(rows: Array<{ key: string; value: string }>): string {
  return `
    <div class="inspector-keyvalue-list">
      ${rows.map((row) => `
        <div class="inspector-keyvalue-row">
          <div class="inspector-keyvalue-key">${escapeHtml(row.key)}</div>
          <div class="inspector-keyvalue-value">${escapeHtml(row.value)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderRouterPanel(events: DevtoolsEventLike[]): string {
  const metrics = computeRouterMetrics(events, 30000);
  const snapshot = collectRouteSnapshot(events);
  const timeline = collectRouteTimeline(events).slice(-80).reverse();
  const issues = collectRouteIssues(events).slice(-30).reverse();

  return renderPageShell({
    title: "Router Diagnostics",
    accentClass: "is-cyan",
    subtitle: `Current route: ${snapshot.currentRoute ?? "unknown"}`,
    pills: [
      `${metrics.pendingNavigations} pending`,
      `${metrics.redirects} redirects`,
      `${metrics.errors} errors`
    ],
    body: [
      renderPageSection("Window metrics", `
        <div class="metrics-grid">
          ${renderMetricCard("Route Events (30s)", String(metrics.totalRouteEvents))}
          ${renderMetricCard("Navigate Start", String(metrics.navigationStarts))}
          ${renderMetricCard("Navigate End", String(metrics.navigationEnds))}
          ${renderMetricCard("Route Changed", String(metrics.routeChanges))}
          ${renderMetricCard("Pending", String(metrics.pendingNavigations))}
          ${renderMetricCard("Redirects", String(metrics.redirects))}
          ${renderMetricCard("Blocked", String(metrics.blocked))}
          ${renderMetricCard("Warnings", String(metrics.warnings))}
          ${renderMetricCard("Router Errors", String(metrics.errors))}
          ${renderMetricCard("Load Start", String(metrics.loadStarts))}
          ${renderMetricCard("Load End", String(metrics.loadEnds))}
          ${renderMetricCard("Avg Load", `${metrics.avgLoadMs}ms`)}
          ${renderMetricCard("Max Load", `${metrics.maxLoadMs}ms`)}
        </div>
      `, "is-full"),
      renderPageSection("Route snapshot", `
        <div class="inspector-grid">
          <div><span class="accent-text is-cyan">Current:</span> ${escapeHtml(snapshot.currentRoute ?? "unknown")}</div>
          <div><span class="accent-text is-cyan">Last Event:</span> ${escapeHtml(snapshot.lastEventType ?? "none")}</div>
          <div><span class="accent-text is-cyan">Last Source:</span> ${escapeHtml(snapshot.source ?? "unknown")}</div>
          <div><span class="accent-text is-cyan">Last From:</span> ${escapeHtml(snapshot.from ?? "null")}</div>
          <div><span class="accent-text is-cyan">Last To:</span> ${escapeHtml(snapshot.to ?? "null")}</div>
          <div><span class="accent-text is-cyan">Params:</span> ${escapeHtml(shortJson(snapshot.params ?? {}))}</div>
          <div><span class="accent-text is-cyan">Query:</span> ${escapeHtml(shortJson(snapshot.query ?? {}))}</div>
          <div><span class="accent-text is-cyan">Guard Context:</span> ${escapeHtml(snapshot.guardContext ?? "none")}</div>
          <div><span class="accent-text is-cyan">Phase:</span> ${escapeHtml(snapshot.phase ?? "unknown")}</div>
        </div>
      `),
      renderPageSection("Route activity by target", metrics.byRoute.length === 0 ? `<div class="empty-state">No route activity in the current window.</div>` : `
        <ul class="stack-list log-list">
          ${metrics.byRoute.slice(0, 12).map((entry) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-cyan">${escapeHtml(entry.route)}</span>
              <span class="muted-text">hits=${entry.hits}</span>
              <span class="muted-text">blocked=${entry.blocked}</span>
              <span class="muted-text">redirects=${entry.redirects}</span>
              <span class="muted-text">errors=${entry.errors}</span>
              <span class="muted-text">avg=${entry.avgLoadMs}ms</span>
              <span class="muted-text">max=${entry.maxLoadMs}ms</span>
            </li>
          `).join("")}
        </ul>
      `),
      renderPageSection("Route issues", issues.length === 0 ? `<div class="empty-state">No router warnings or errors.</div>` : `
        <ul class="stack-list">
          ${issues.map((issue) => `
            <li class="stack-item ${issue.type === "error:router" || issue.type === "route:blocked" ? "issue-error" : "issue-warn"}">
              <span class="item-label">[${escapeHtml(issue.type)}]</span>
              <span>${escapeHtml(issue.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `),
      renderPageSection("Recent route timeline", timeline.length === 0 ? `<div class="empty-state">No route events captured yet.</div>` : `
        <ul class="stack-list log-list">
          ${timeline.map((entry) => `
            <li class="stack-item">
              <span class="item-label">[${escapeHtml(entry.type)}]</span>
              <span>${escapeHtml(entry.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `, "is-full")
    ].join("")
  });
}

export function renderPerformancePanel(events: DevtoolsEventLike[]): string {
  const metrics = computePerformanceMetrics(events, 10000);

  return renderPageShell({
    title: "Performance",
    accentClass: "is-amber",
    subtitle: `Hot event types: ${metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", ")}`,
    pills: [`${metrics.totalEvents} events / 10s`, `${metrics.updatesPerSecond} events / sec`],
    body: [
      renderPageSection("Performance window", `
        <div class="metrics-grid">
          ${renderMetricCard("Events (10s)", String(metrics.totalEvents))}
          ${renderMetricCard("Events / sec", String(metrics.updatesPerSecond))}
          ${renderMetricCard("Effect Runs", String(metrics.effectRuns))}
          ${renderMetricCard("Render Events", String(metrics.renderEvents))}
          ${renderMetricCard("Queue Enqueued", String(metrics.queueEnqueued))}
          ${renderMetricCard("Queue Conflicts", String(metrics.queueConflicts))}
          ${renderMetricCard("Queue Retried", String(metrics.queueRetried))}
          ${renderMetricCard("Queue Failed", String(metrics.queueFailed))}
          ${renderMetricCard("Queue Flushed", String(metrics.queueFlushed))}
          ${renderMetricCard("Queue Depth Est.", String(metrics.queueDepthEstimate))}
          ${renderMetricCard("Hub Connects", String(metrics.hubConnections))}
          ${renderMetricCard("Hub Disconnects", String(metrics.hubDisconnections))}
          ${renderMetricCard("Hub Errors", String(metrics.hubErrors))}
          ${renderMetricCard("Hub Push", String(metrics.hubPushReceived))}
        </div>
      `, "is-full"),
      renderPageSection("Hot event types", `<div class="muted-text">${escapeHtml(metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", "))}</div>`),
      renderPageSection("By event type", metrics.byType.length === 0 ? `<div class="empty-state">No performance data yet.</div>` : `
        <ul class="stack-list log-list">
          ${metrics.byType.slice(0, 20).map((item) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-amber">${escapeHtml(item.type)}</span>
              <span class="muted-text">count=${item.count}</span>
              <span class="muted-text">avg=${item.avgDeltaMs}ms</span>
              <span class="muted-text">max=${item.maxDeltaMs}ms</span>
            </li>
          `).join("")}
        </ul>
      `)
    ].join("")
  });
}

export function renderQueuePanel(events: DevtoolsEventLike[]): string {
  const metrics = computePerformanceMetrics(events, 10000);
  const queueEvents = events
    .filter((event) => event.type.startsWith("queue:"))
    .slice(-80)
    .reverse();

  return renderPageShell({
    title: "Queue Monitor",
    accentClass: "is-amber",
    subtitle: `Pending estimate: ${metrics.queueDepthEstimate} | Enqueued: ${metrics.queueEnqueued}`,
    pills: [`${metrics.queueConflicts} conflicts`, `${metrics.queueRetried} retried`],
    body: [
      renderPageSection("Queue metrics", `
        <div class="metrics-grid">
          ${renderMetricCard("Queue Enqueued", String(metrics.queueEnqueued))}
          ${renderMetricCard("Queue Conflicts", String(metrics.queueConflicts))}
          ${renderMetricCard("Queue Retried", String(metrics.queueRetried))}
          ${renderMetricCard("Queue Failed", String(metrics.queueFailed))}
          ${renderMetricCard("Queue Flushed", String(metrics.queueFlushed))}
          ${renderMetricCard("Queue Depth Est.", String(metrics.queueDepthEstimate))}
        </div>
      `),
      renderPageSection("Recent queue events", queueEvents.length === 0 ? `<div class="empty-state">No queue events yet.</div>` : `
        <ul class="stack-list log-list">
          ${queueEvents.map((event) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-amber">${escapeHtml(event.type)}</span>
              <span class="muted-text">${escapeHtml(queueEventSummary(event))}</span>
            </li>
          `).join("")}
        </ul>
      `)
    ].join("")
  });
}

export function renderSanityPanel(events: DevtoolsEventLike[]): string {
  const metrics = computeSanityMetrics(events, {
    ...DEFAULT_SANITY_THRESHOLDS,
    debugListenerCount: getDebugListenerCount()
  });

  const criticalCount = metrics.alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = metrics.alerts.filter((alert) => alert.severity === "warning").length;

  return renderPageShell({
    title: "Sanity Check",
    accentClass: "is-red",
    subtitle: `Critical: ${criticalCount} | Warnings: ${warningCount}`,
    pills: [`${metrics.activeEffects} active effects`, `${metrics.debugListenerCount} debug listeners`],
    body: [
      renderPageSection("Sanity metrics", `
        <div class="metrics-grid">
          ${renderMetricCard("Active Effects", String(metrics.activeEffects))}
          ${renderMetricCard("Effect Creates", String(metrics.effectCreates))}
          ${renderMetricCard("Effect Disposes", String(metrics.effectDisposes))}
          ${renderMetricCard("Effect Runs / sec", String(metrics.effectRunsPerSecond))}
          ${renderMetricCard("Effect Imbalance", String(metrics.effectImbalance))}
          ${renderMetricCard("Debug Listeners", String(metrics.debugListenerCount))}
        </div>
      `),
      renderPageSection("Alerts", metrics.alerts.length === 0 ? `<div class="empty-state">No runaway effects or listener leaks detected in the active window.</div>` : `
        <ul class="stack-list">
          ${metrics.alerts.map((alert) => `
            <li class="stack-item ${alert.severity === "critical" ? "issue-error" : "issue-warn"}">
              <span class="item-label">[${escapeHtml(alert.severity.toUpperCase())}]</span>
              <span>${escapeHtml(alert.message)}</span>
              <span class="muted-text">current=${escapeHtml(String(alert.current))}, threshold=${escapeHtml(String(alert.threshold))}</span>
            </li>
          `).join("")}
        </ul>
      `)
    ].join("")
  });
}

export function renderSettingsPanel(state: SettingsStateLike): string {
  const positionChoices: Array<{ value: OverlayPosition; label: string }> = [
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "center", label: "Center" }
  ];

  const panelSizes: Array<{ value: OverlaySize; label: string }> = [
    { value: "normal", label: "Normal" },
    { value: "large", label: "Large" }
  ];

  return renderPageShell({
    title: "Devtools Settings",
    accentClass: "is-purple",
    subtitle: "Layout, persistence, and session controls",
    pills: [`dock: ${state.overlayPosition}`, `size: ${state.overlayPanelSize}`],
    body: [
      renderPageSection("Overlay Position", `
        <div class="button-row">
          ${positionChoices.map((choice) => `
            <button
              class="select-button ${state.overlayPosition === choice.value ? "is-selected" : ""}"
              data-layout-position="${choice.value}"
              type="button"
            >${choice.label}</button>
          `).join("")}
        </div>
      `),
      renderPageSection("Panel Size", `
        <div class="button-row">
          ${panelSizes.map((choice) => `
            <button
              class="select-button ${state.overlayPanelSize === choice.value ? "is-selected" : ""}"
              data-layout-size="${choice.value}"
              type="button"
            >${choice.label}</button>
          `).join("")}
        </div>
      `),
      renderPageSection("Persist Preferences", `
        <div class="muted-text">Store position and size in local storage for the next session.</div>
        <div class="button-row">
          <button
            class="toolbar-button ${state.persistOverlayPreferences ? "is-active" : ""}"
            data-layout-persist-toggle="true"
            type="button"
          >${state.persistOverlayPreferences ? "Enabled" : "Disabled"}</button>
        </div>
      `),
      renderPageSection("Session Actions", `
        <div class="button-row">
          <button class="toolbar-button danger-button" data-clear-events="true">Clear All Events</button>
        </div>
      `)
    ].join("")
  });
}

export function renderAIDiagnosticsPanel(state: AIDiagnosticsStateLike): string {
  const providerDetails = resolveAIProviderDetails(state);
  const assistantTelemetry = collectAIAssistantTelemetry(state.events);
  const snapshotSignals = collectSignalRegistrySnapshot();
  const metaEntries = collectMetaEntries(state.events);
  const componentAIMetadataCount = metaEntries.filter((entry) => !entry.key.startsWith("route:") && hasInspectableAIValue(entry.ai)).length;
  const routeAIMetadataCount = metaEntries.filter((entry) => entry.key.startsWith("route:") && hasInspectableAIValue(entry.ai)).length;
  const mountedAIPreviewCount = Array.from(state.mountedComponents.values()).filter((entry) => typeof entry.aiPreview === "string" && entry.aiPreview.trim().length > 0).length;
  const promptInputs = collectAIPromptInputs(state);
  const promptInputErrorCount = promptInputs.filter((input) => input.severity === "error").length;
  const promptInputWarnCount = promptInputs.filter((input) => input.severity === "warn").length;
  const documentContext = state.documentContext ?? null;
  const documentDiagnostics = state.documentDiagnostics ?? analyzeSafeDocumentContext(documentContext);
  const documentWarnCount = documentDiagnostics.filter((entry) => entry.severity === "warn").length;
  const documentInfoCount = documentDiagnostics.filter((entry) => entry.severity === "info").length;
  const integrationWarnings: string[] = [];
  const hasConfiguredProvider = providerDetails.hasGlobalHook || providerDetails.hasEndpoint;
  const canQueryAssistant = state.aiAssistantEnabled && hasConfiguredProvider;
  const primaryActionLabel = canQueryAssistant ? "Ask Terajs AI" : "Build Triage Prompt";
  const primaryActionHint = canQueryAssistant
    ? "Runs the configured assistant with the current sanitized diagnostics bundle."
    : !state.aiAssistantEnabled
    ? "Assistant execution is disabled, so this action only prepares a sanitized prompt you can move into your own tooling."
    : "No provider is configured, so this action prepares a sanitized prompt you can paste into your own assistant, ticket, or endpoint harness.";
  const analysisSummary = state.aiResponse
    ? "Response ready"
    : state.aiStatus === "loading"
    ? "Running"
    : state.aiPrompt
    ? "Prompt ready"
    : canQueryAssistant
    ? "Ready to run"
    : "Prompt-first";

  let assistantOutputMarkup = "";
  if (state.aiStatus === "loading") {
    assistantOutputMarkup = `<div class="empty-state">Consulting the configured assistant provider...</div>`;
  } else if (state.aiError) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-red">Assistant request failed</div>
        <div class="stack-item issue-error">
          <span class="item-label">[ERROR]</span>
          <span>${escapeHtml(state.aiError)}</span>
        </div>
      </div>
    `;
  } else if (state.aiResponse) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-cyan">Assistant response</div>
        <pre class="ai-response">${escapeHtml(state.aiResponse)}</pre>
      </div>
    `;
  } else if (state.aiPrompt) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-cyan">Prompt prepared</div>
        <div class="muted-text">${escapeHtml(canQueryAssistant ? "The current session bundle is ready for a provider-backed run." : "Prompt-only mode is active, so the payload is ready to copy into your own assistant." )}</div>
      </div>
    `;
  } else {
    assistantOutputMarkup = `
      <div class="empty-state">${escapeHtml(canQueryAssistant ? "Run the assistant to capture an analysis for the active runtime state." : "Build a triage prompt to package the current runtime evidence for an external assistant." )}</div>
    `;
  }

  if (!state.aiAssistantEnabled) {
    integrationWarnings.push("Assistant execution is disabled in the DevTools overlay options.");
  } else if (!providerDetails.hasGlobalHook && !providerDetails.hasEndpoint) {
    integrationWarnings.push("No assistant provider is configured. Build Triage Prompt packages a sanitized prompt you can copy into your own chatbot or backend tool.");
  }

  if (componentAIMetadataCount === 0 && routeAIMetadataCount === 0 && mountedAIPreviewCount === 0) {
    integrationWarnings.push("No component or route AI metadata is currently visible in the mounted app state.");
  }

  if (!documentContext || (documentContext.metaTags.length === 0 && documentContext.linkTags.length === 0 && !documentContext.title)) {
    integrationWarnings.push("No safe document head context is currently available, so AI triage will lean more heavily on route and signal diagnostics.");
  }

  const navItems: Array<{
    key: AIDiagnosticsSectionKey;
    title: string;
    summary: string;
    description: string;
  }> = [
    {
      key: "analysis-output",
      title: "Analysis Output",
      summary: analysisSummary,
      description: "Run the assistant or prepare a prompt, then inspect the resulting response and payload together."
    },
    {
      key: "session-mode",
      title: "Session Mode",
      summary: providerDetails.label,
      description: "Provider state, integration coverage, and why this session is provider-backed or prompt-first."
    },
    {
      key: "prompt-inputs",
      title: "Prompt Inputs",
      summary: `${promptInputs.length} items`,
      description: "The runtime warnings, likely causes, and document diagnostics included in the next analysis run."
    },
    {
      key: "provider-telemetry",
      title: "Provider Telemetry",
      summary: `${assistantTelemetry.requestCount} requests`,
      description: "Request counts, last provider path, delivery mode, and the most recent assistant outcome."
    },
    {
      key: "metadata-checks",
      title: "Metadata Checks",
      summary: `${documentWarnCount} warn / ${documentInfoCount} info`,
      description: "Document-head diagnostics derived from the safe metadata snapshot for the current page."
    },
    {
      key: "document-context",
      title: "Document Context",
      summary: `${documentContext?.metaTags.length ?? 0} meta / ${documentContext?.linkTags.length ?? 0} links`,
      description: "The safe head-only context exported into the AI bundle, including allowlisted meta tags and links."
    }
  ];

  const activeSection = navItems.some((item) => item.key === state.activeAIDiagnosticsSection)
    ? state.activeAIDiagnosticsSection
    : DEFAULT_AI_DIAGNOSTICS_SECTION;
  const activeNavItem = navItems.find((item) => item.key === activeSection) ?? navItems[0];

  let detailMarkup = "";

  switch (activeSection) {
    case "session-mode": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Session mode</div>
          ${renderAIKeyValueList([
            { key: "Provider mode:", value: providerDetails.label },
            { key: "Snapshot signals:", value: String(snapshotSignals.length) },
            { key: "AI metadata:", value: String(componentAIMetadataCount + routeAIMetadataCount) },
            { key: "Prompt inputs:", value: String(promptInputs.length) },
            { key: "Built-in model:", value: "None. Apps provide the assistant hook or endpoint." },
            { key: "Current insight:", value: state.aiLikelyCause ?? "No reactive error detected yet." },
            { key: "Active path:", value: providerDetails.activePath },
            { key: "Model:", value: state.aiAssistantModel },
            { key: "Timeout:", value: `${state.aiAssistantTimeoutMs}ms` },
            { key: "How it works:", value: "DevTools assembles keyed signal snapshots, sanity metrics, recent issue events, and safe document head context into one diagnostics bundle." }
          ])}
          <div class="muted-text ai-hint">${escapeHtml(providerDetails.detail)}</div>
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Integration coverage</div>
          ${renderAIKeyValueList([
            { key: "Mounted AI previews:", value: String(mountedAIPreviewCount) },
            { key: "Component AI metadata:", value: String(componentAIMetadataCount) },
            { key: "Route AI metadata:", value: String(routeAIMetadataCount) },
            { key: "Prompt ready:", value: state.aiPrompt ? "Yes" : "No" }
          ])}
          ${integrationWarnings.length === 0 ? `<div class="empty-state">AI-aware metadata is visible and the panel is ready to help triage integration issues.</div>` : `
            <ul class="stack-list compact-list">
              ${integrationWarnings.map((warning) => `
                <li class="stack-item issue-warn">
                  <span class="item-label">[CHECK]</span>
                  <span>${escapeHtml(warning)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "prompt-inputs": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Evidence included in prompt</div>
          ${renderAIKeyValueList([
            { key: "Prompt inputs:", value: String(promptInputs.length) },
            { key: "Error inputs:", value: String(promptInputErrorCount) },
            { key: "Warning inputs:", value: String(promptInputWarnCount) },
            { key: "Document inputs:", value: String((state.documentDiagnostics ?? []).length) }
          ])}
          ${promptInputs.length === 0 ? `<div class="empty-state">No recent errors, warnings, or likely-cause hints are queued for AI triage yet.</div>` : `
            <ul class="stack-list log-list">
              ${promptInputs.map((input) => `
                <li class="stack-item ${input.severity === "error" ? "issue-error" : input.severity === "warn" ? "issue-warn" : ""}">
                  <span class="item-label">[${escapeHtml(input.label)}]</span>
                  <span>${escapeHtml(input.summary)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "provider-telemetry": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Request path</div>
          ${renderAIKeyValueList([
            { key: "Requests:", value: String(assistantTelemetry.requestCount) },
            { key: "Successes:", value: String(assistantTelemetry.successCount) },
            { key: "Failures:", value: String(assistantTelemetry.errorCount) },
            { key: "Skipped:", value: String(assistantTelemetry.skippedCount) },
            ...(assistantTelemetry.lastRequest ? [
            { key: "Last provider:", value: formatAIAssistantProvider(assistantTelemetry.lastRequest.provider) },
            { key: "Delivery mode:", value: assistantTelemetry.lastRequest.delivery },
            { key: "Fallback path:", value: formatAIAssistantFallbackPath(assistantTelemetry.lastRequest.fallbackPath) },
            { key: "Prompt chars:", value: String(assistantTelemetry.lastRequest.promptChars ?? 0) },
            { key: "Snapshot signals:", value: String(assistantTelemetry.lastRequest.signalCount ?? 0) },
            { key: "Recent events:", value: String(assistantTelemetry.lastRequest.recentEventCount ?? 0) }
            ] : [])
          ])}
          ${assistantTelemetry.lastRequest ? "" : `<div class="empty-state">No provider-backed assistant request has run yet.</div>`}
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Last outcome</div>
          ${assistantTelemetry.lastOutcome ? renderAIKeyValueList([
            { key: "Last outcome:", value: formatAIAssistantOutcome(assistantTelemetry.lastOutcome) },
            { key: "Last latency:", value: assistantTelemetry.lastOutcome.durationMs === null ? "n/a" : `${assistantTelemetry.lastOutcome.durationMs}ms` },
            { key: "HTTP status:", value: assistantTelemetry.lastOutcome.statusCode === null ? "n/a" : String(assistantTelemetry.lastOutcome.statusCode) },
            { key: "Last message:", value: assistantTelemetry.lastOutcome.message ?? "none" }
          ]) : `<div class="empty-state">No assistant outcome has been recorded yet.</div>`}
        </div>
      `;
      break;
    }

    case "metadata-checks": {
      detailMarkup = documentDiagnostics.length === 0 ? `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Warnings:", value: "0" },
            { key: "Info:", value: "0" },
            { key: "Description:", value: "OK" },
            { key: "Canonical:", value: "OK" }
          ])}
          <div class="empty-state">Safe document head checks look healthy for the current page.</div>
        </div>
      ` : `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Warnings:", value: String(documentWarnCount) },
            { key: "Info:", value: String(documentInfoCount) },
            { key: "Meta tags:", value: String(documentContext?.metaTags.length ?? 0) },
            { key: "Head links:", value: String(documentContext?.linkTags.length ?? 0) }
          ])}
          <div class="panel-title is-purple">Metadata checks</div>
          <ul class="stack-list compact-list">
            ${documentDiagnostics.map((diagnostic) => `
              <li class="stack-item ${diagnostic.severity === "warn" ? "issue-warn" : ""}">
                <span class="item-label">[${escapeHtml(diagnostic.severity.toUpperCase())}]</span>
                <span class="accent-text is-purple">${escapeHtml(diagnostic.message)}</span>
                ${diagnostic.detail ? `<span>${escapeHtml(diagnostic.detail)}</span>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      `;
      break;
    }

    case "document-context": {
      detailMarkup = !documentContext ? `
        <div class="ai-diagnostics-section-block">
          <div class="empty-state">No safe document head context captured yet.</div>
        </div>
      ` : `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Title present:", value: documentContext.title ? "Yes" : "No" },
            { key: "Meta tags:", value: String(documentContext.metaTags.length) },
            { key: "Head links:", value: String(documentContext.linkTags.length) },
            { key: "Query keys:", value: String(documentContext.queryKeys.length) },
            { key: "Title:", value: documentContext.title || "Untitled document" },
            { key: "Path:", value: documentContext.path },
            { key: "Language:", value: documentContext.lang ?? "not set" },
            { key: "Text direction:", value: documentContext.dir ?? "not set" },
            { key: "Hash:", value: documentContext.hash ?? "none" },
            { key: "Query keys:", value: documentContext.queryKeys.length === 0 ? "none" : documentContext.queryKeys.join(", ") }
          ])}
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Allowlisted meta tags</div>
          ${documentContext.metaTags.length === 0
            ? `<div class="empty-state">No allowlisted head meta tags were captured.</div>`
            : `<ul class="stack-list compact-list">${documentContext.metaTags.map((tag) => `
                <li class="stack-item performance-item">
                  <span class="accent-text is-purple">${escapeHtml(tag.key)}</span>
                  <span class="muted-text">${escapeHtml(tag.source)}</span>
                  <span>${escapeHtml(tag.value)}</span>
                </li>
              `).join("")}</ul>`}
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Allowlisted head links</div>
          ${documentContext.linkTags.length === 0
            ? `<div class="empty-state">No allowlisted head links were captured.</div>`
            : `<ul class="stack-list compact-list">${documentContext.linkTags.map((tag) => `
                <li class="stack-item performance-item">
                  <span class="accent-text is-purple">${escapeHtml(tag.rel)}</span>
                  <span class="muted-text">${escapeHtml(tag.sameOrigin ? "same-origin" : "cross-origin")}</span>
                  <span>${escapeHtml(tag.href)}</span>
                </li>
              `).join("")}</ul>`}
        </div>
      `;
      break;
    }

    case "analysis-output":
    default: {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-cyan">Run analysis</div>
          <div class="button-row">
            <button class="toolbar-button ask-ai-button" data-action="ask-ai">${escapeHtml(primaryActionLabel)}</button>
            <button class="toolbar-button" data-action="copy-ai-prompt">Copy Prompt</button>
          </div>
          <div class="muted-text ai-hint">${escapeHtml(primaryActionHint)}</div>
          <div class="muted-text ai-hint">${escapeHtml(providerDetails.detail)}</div>
        </div>
        ${assistantOutputMarkup}
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Prepared prompt payload</div>
          ${state.aiPrompt
            ? `<pre class="ai-prompt">${escapeHtml(state.aiPrompt)}</pre>`
            : `<div class="empty-state">Run ${escapeHtml(primaryActionLabel)} to assemble the current diagnostics bundle.</div>`}
        </div>
      `;
      break;
    }
  }

  return `
    <div class="ai-diagnostics-layout">
      <aside class="components-tree-pane ai-diagnostics-nav-pane" aria-label="AI diagnostics sections">
        <div class="components-screen-body">
          <div class="ai-diagnostics-nav-list">
            ${navItems.map((item) => `
              <button
                class="ai-diagnostics-nav-button ${activeSection === item.key ? "is-active" : ""}"
                data-ai-section="${item.key}"
                type="button"
              >
                <span class="ai-diagnostics-nav-title">${escapeHtml(item.title)}</span>
                <span class="ai-diagnostics-nav-summary">${escapeHtml(item.summary)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      </aside>

      <section
        class="components-inspector-pane ai-diagnostics-detail-pane"
        aria-label="AI diagnostics detail"
        data-ai-active-section="${activeSection}"
      >
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              <div class="panel-title is-cyan">${escapeHtml(activeNavItem.title)}</div>
              <div class="panel-subtitle">${escapeHtml(activeNavItem.description)}</div>
            </div>
          </div>
        </div>
        <div class="components-screen-body">
          <div class="ai-diagnostics-detail-stack">
            ${detailMarkup}
          </div>
        </div>
      </section>
    </div>
  `;
}
