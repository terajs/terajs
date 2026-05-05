import { computePerformanceMetrics } from "../analytics.js";
import { queueEventSummary, type DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderInvestigationJournal,
  renderWorkbenchIntroState,
  renderWorkbenchList,
} from "./iframeShells.js";

interface QueueStateLike {
  events: DevtoolsEventLike[];
  selectedQueueEntryKey: string | null;
  expandedValuePaths: Set<string>;
}

interface QueueWorkbenchEntry {
  key: string;
  event: DevtoolsEventLike;
  title: string;
  summary: string;
  meta: string;
  badge: string;
  group: string;
  tone: "neutral" | "warn" | "error";
}

export function renderQueuePanel(state: QueueStateLike): string {
  const metrics = computePerformanceMetrics(state.events, 10000);
  const queueEntries = state.events
    .filter((event) => event.type.startsWith("queue:"))
    .slice(-80)
    .map((event) => toQueueWorkbenchEntry(event))
    .reverse();
  const selectedQueueEntry = queueEntries.find((entry) => entry.key === state.selectedQueueEntryKey) ?? null;

  const sidebarBody = queueEntries.length === 0
    ? `<div class="empty-state">No queue events yet.</div>`
    : renderWorkbenchList(queueEntries.map((entry) => ({
      title: entry.title,
      summary: entry.summary,
      meta: entry.meta,
      badge: entry.badge,
      iconName: "logs",
      active: selectedQueueEntry?.key === entry.key,
      tone: entry.tone,
      group: entry.group,
      attributes: { "data-queue-entry-key": entry.key }
    })));

  const detailBody = selectedQueueEntry
    ? renderSelectedQueueDataStage(
        selectedQueueEntry.event.payload,
        `queue.${selectedQueueEntry.key}`,
        selectedQueueEntry.summary || "No captured data for this queue event.",
        state.expandedValuePaths
      )
    : renderWorkbenchIntroState({
      title: "Inspect one queue event",
      titleToneClass: "is-green",
      description: "Queue diagnostics now work like the rest of the investigation family: keep the recent feed on the left and inspect one mutation lifecycle event on the right.",
      metrics: buildQueueMetrics(metrics, queueEntries.length),
      steps: [
        "Start with failures, retries, or conflicts when the queue looks unhealthy.",
        "Select one queue event to inspect its mutation context and timing.",
        "Compare Queue with Issues and Logs while keeping one queue event in focus."
      ],
      note: "The right pane stays empty until you choose one queue event from the left rail."
    });
  const queuePanelToneClass = metrics.queueFailed > 0
    ? "is-red"
    : metrics.queueRetried > 0
      ? "is-amber"
      : "is-green";
  const queueDetailToneClass = selectedQueueEntry
    ? selectedQueueEntry.tone === "error"
      ? "is-red"
      : selectedQueueEntry.tone === "warn"
        ? "is-amber"
        : "is-green"
    : "is-green";

  return renderInvestigationJournal({
    className: "queue-panel-layout investigation-panel investigation-panel--queue investigation-journal--queue",
    ariaLabel: "Queue investigation",
    title: "Queue Investigation",
    subtitle: `${queueEntries.length} retained · pending ${metrics.queueDepthEstimate} · failed ${metrics.queueFailed}`,
    titleToneClass: queuePanelToneClass,
    subtitleToneClass: `${queuePanelToneClass}-soft`,
    heroKicker: "Mutation queue journal",
    heroTitle: "Leave the queue list in the rail",
    heroSummary: selectedQueueEntry
      ? "The selected mutation event stays expanded on the right while the left rail keeps queue flow compact and skimmable."
      : "Use the left rail for failures, retries, and conflicts, then inspect one queue event on the larger stage.",
    feedAriaLabel: "Queue investigation feed",
    feedTitle: "Queue feed",
    feedSubtitle: `${queueEntries.length} retained queue events`,
    feedTitleToneClass: "is-green",
    feedSubtitleToneClass: "is-green-soft",
    feedBody: sidebarBody,
    detailAriaLabel: "Queue event detail",
    detailTitle: selectedQueueEntry?.title ?? "Queue inspector",
    detailSubtitle: selectedQueueEntry?.meta ?? "Select one queue event to inspect its lifecycle context.",
    detailTitleToneClass: queueDetailToneClass,
    detailSubtitleToneClass: `${queueDetailToneClass}-soft`,
    detailBody,
  });
}

function toQueueWorkbenchEntry(event: DevtoolsEventLike): QueueWorkbenchEntry {
  const tone = event.type === "queue:fail"
    ? "error"
    : event.type === "queue:retry" || event.type === "queue:conflict"
      ? "warn"
      : "neutral";

  return {
    key: `${String(event.timestamp)}:${event.type}:${queueEventSummary(event)}`,
    event,
    title: formatQueueEventTitle(event.type),
    summary: queueEventSummary(event),
    meta: [event.type, formatQueueEventTime(event.timestamp)].filter(Boolean).join(" | "),
    badge: formatQueueEventBadge(event.type),
    group: resolveQueueEventGroup(event.type),
    tone,
  };
}

function buildQueueMetrics(metrics: ReturnType<typeof computePerformanceMetrics>, visibleCount: number) {
  return [
    { label: "Shown", value: String(visibleCount) },
    { label: "Pending", value: String(metrics.queueDepthEstimate), tone: metrics.queueDepthEstimate > 0 ? "warn" : "neutral" },
    { label: "Failed", value: String(metrics.queueFailed), tone: metrics.queueFailed > 0 ? "error" : "neutral" },
    { label: "Retried", value: String(metrics.queueRetried), tone: metrics.queueRetried > 0 ? "warn" : "neutral" },
  ] as const;
}

function renderSelectedQueueDataStage(payload: unknown, rootPath: string, fallbackSummary: string, expandedValuePaths: Set<string>): string {
  if (payload === undefined) {
    return `<div class="empty-state">${escapeHtml(fallbackSummary)}</div>`;
  }

  return `<div class="devtools-value-surface">${renderValueExplorer(payload, rootPath, expandedValuePaths)}</div>`;
}

function resolveQueueEventGroup(type: string): string {
  if (type === "queue:fail") {
    return "Failures";
  }

  if (type === "queue:retry") {
    return "Retries";
  }

  if (type === "queue:conflict") {
    return "Conflicts";
  }

  return "Flow";
}

function formatQueueEventBadge(type: string): string {
  const suffix = type.replace(/^queue:/, "");
  return suffix.length > 0 ? suffix : "queue";
}

function formatQueueEventTitle(type: string): string {
  return type
    .replace(/^queue:/, "")
    .split(":")
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatQueueEventTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return "unknown";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}