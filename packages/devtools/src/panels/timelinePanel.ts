import { buildTimeline } from "../analytics.js";
import type { DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import { renderDevtoolsHeadingRow } from "../devtoolsIcons.js";
import {
  renderInvestigationJournal,
  renderWorkbenchFacts,
  renderWorkbenchIntroState,
  renderWorkbenchList,
  renderWorkbenchMetrics,
  type WorkbenchListItem,
} from "./iframeShells.js";

export type TimelinePanelFilter = "all" | "issues" | "route" | "component" | "signal" | "effect" | "dom" | "queue" | "hub" | "other";

export const DEFAULT_TIMELINE_PANEL_FILTER: TimelinePanelFilter = "all";

interface TimelineStateLike {
  events: DevtoolsEventLike[];
  timelineFilter?: TimelinePanelFilter;
  expandedValuePaths: Set<string>;
  expandedDetailKeys: Set<string>;
}

interface IframeResultItem {
  kicker?: string;
  title: string;
  summary?: string;
  meta?: string;
  detail?: string;
  detailLabel?: string;
  detailKey?: string;
  detailOpen?: boolean;
  tone?: "error" | "warn" | "neutral";
  variant?: "event";
}

const TIMELINE_FILTER_ORDER: TimelinePanelFilter[] = ["all", "issues", "route", "component", "signal", "effect", "dom", "queue", "hub", "other"];

const TIMELINE_FILTER_LABELS: Record<TimelinePanelFilter, string> = {
  all: "All Events",
  issues: "Issues",
  route: "Router",
  component: "Components",
  signal: "Signals",
  effect: "Effects",
  dom: "DOM",
  queue: "Queue",
  hub: "Hub",
  other: "Other",
};

export function renderTimelinePanel(state: TimelineStateLike): string {
  const timeline = buildTimeline(state.events, 250);
  const activeFilter = state.timelineFilter ?? DEFAULT_TIMELINE_PANEL_FILTER;
  const filteredTimeline = timeline.filter((entry) => activeFilter === "all" || resolveTimelineFilter(entry.type) === activeFilter);
  const filteredCount = filteredTimeline.length;
  const activeFilterToneClass = resolveTimelineFilterToneClass(activeFilter);
  const timelineResultsMarkup = renderIframeResultList(
    filteredTimeline.slice().reverse().map((entry) => {
      const detailMarkup = renderPayloadDetail(entry.payload, `timeline.${entry.index}`, state.expandedValuePaths);
      const family = resolveTimelineFilter(entry.type);
      const detailKey = `timeline.${entry.index}`;

      return {
        kicker: TIMELINE_FILTER_LABELS[family],
        title: formatTimelineEventLabel(entry.type),
        summary: entry.summary,
        tone: resolveTimelineEntryTone(entry.type),
        variant: "event",
        meta: joinMetaParts([
          `#${String(entry.index)}`,
          formatEventTime(entry.timestamp)
        ]),
        detailLabel: detailMarkup ? "Structured context" : "Event metadata",
        detailKey,
        detailOpen: state.expandedDetailKeys.has(detailKey),
        detail: `
          <div class="timeline-event-detail-stack">
            ${renderWorkbenchFacts([
              { label: "Family", value: TIMELINE_FILTER_LABELS[family] },
              { label: "Event", value: formatTimelineEventLabel(entry.type) },
              { label: "Index", value: `#${entry.index}` },
              { label: "Time", value: formatEventTime(entry.timestamp) || "unknown" },
            ])}
            ${detailMarkup
              ? renderSelectedDataStage(detailMarkup)
              : `<div class="empty-state timeline-event-empty-state">No structured payload was captured for this event.</div>`}
          </div>
        `,
      } satisfies IframeResultItem;
    }),
    "No events match the current timeline filter."
  );
  const timelineFilterItems = buildTimelineFilterItems(timeline, activeFilter);
  const detailBody = filteredCount > 0
    ? [
      `
        <section class="iframe-panel-section-block timeline-filter-summary-section">
          ${renderDevtoolsHeadingRow("Filter summary", "iframe-panel-section-heading")}
          <div class="timeline-control-panel">
            <div class="timeline-control-summary">
              <div class="timeline-control-count">${escapeHtml(TIMELINE_FILTER_LABELS[activeFilter])} · newest first</div>
              <div class="timeline-control-note">Filter the retained event stream from the left rail. The stage on the right keeps only the matching events instead of trying to scrub through checkpoints.</div>
            </div>
            ${renderWorkbenchMetrics([
              { label: "Filter", value: TIMELINE_FILTER_LABELS[activeFilter] },
              { label: "Shown", value: String(filteredCount), tone: filteredCount > 0 ? "accent" : "neutral" },
              { label: "Buffered", value: String(timeline.length) },
              { label: "Muted", value: String(Math.max(0, timeline.length - filteredCount)), tone: timeline.length > filteredCount ? "warn" : "neutral" },
            ])}
          </div>
        </section>
      `,
      `
        <section class="iframe-panel-section-block timeline-results-section">
          ${renderDevtoolsHeadingRow("Filtered timeline events", "iframe-panel-section-heading")}
          ${timelineResultsMarkup}
        </section>
      `
    ].join("")
    : renderWorkbenchIntroState({
      title: "Pick one event family",
      titleToneClass: activeFilterToneClass,
      description: "Use the left rail to filter the retained event stream by family. The stage on the right stays reserved for matching events instead of mirroring one selected checkpoint.",
      metrics: [
        { label: "Buffered", value: String(timeline.length) },
        { label: "Shown", value: String(filteredCount), tone: filteredCount > 0 ? "accent" : "neutral" },
      ],
      note: "The left rail is now only for filtering. All matching events stay on the right."
    });

  return renderInvestigationJournal({
    className: "timeline-panel-layout investigation-panel investigation-panel--timeline investigation-journal--timeline",
    ariaLabel: "Timeline and replay",
    title: "Timeline",
    subtitle: `${timeline.length} buffered · ${filteredCount} shown · ${TIMELINE_FILTER_LABELS[activeFilter]}`,
    titleToneClass: "is-cyan",
    subtitleToneClass: "is-cyan-soft",
    heroTitle: "Event filters",
    heroSummary: "Use the left rail to filter the retained event stream while the right side stays dedicated to the matching events.",
    feedAriaLabel: "Timeline filters",
    feedTitle: "Event filters",
    feedSubtitle: timeline.length === 0
      ? "No buffered events"
      : `${timeline.length} buffered events grouped by family`,
    feedTitleToneClass: "is-blue",
    feedSubtitleToneClass: "is-blue-soft",
    feedBody: renderWorkbenchList(timelineFilterItems),
    detailAriaLabel: "Timeline events",
    detailTitle: TIMELINE_FILTER_LABELS[activeFilter],
    detailSubtitle: filteredCount === 0
      ? "No events match the selected filter."
      : `${filteredCount} matching events · newest first`,
    detailTitleToneClass: activeFilterToneClass,
    detailSubtitleToneClass: toSoftToneClass(activeFilterToneClass),
    detailBody,
  });
}

function resolveTimelineFilterToneClass(filter: TimelinePanelFilter): string {
  if (filter === "issues") {
    return "is-amber";
  }

  if (filter === "signal" || filter === "hub") {
    return "is-cyan";
  }

  if (filter === "effect" || filter === "queue") {
    return "is-green";
  }

  return "is-blue";
}

function toSoftToneClass(toneClass: string): string {
  return `${toneClass}-soft`;
}

function formatEventTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function joinMetaParts(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part && part.length > 0)).join(" | ");
}

function renderSelectedDataStage(content: string): string {
  return `<div class="devtools-value-surface">${content}</div>`;
}

function renderIframeResultList(items: readonly IframeResultItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="timeline-event-list">
      <ul class="timeline-event-results">
        ${items.map((item) => `
          <li class="timeline-event-item ${item.tone ? `is-${item.tone}` : ""} ${item.detailOpen ? "is-expanded" : ""}">
            <div class="timeline-event-summary">
              ${item.kicker ? `<div class="timeline-event-kicker">${escapeHtml(item.kicker)}</div>` : ""}
              <div class="timeline-event-title">${escapeHtml(item.title)}</div>
              ${item.summary ? `<div class="timeline-event-body">${escapeHtml(item.summary)}</div>` : ""}
              ${item.meta ? `<div class="timeline-event-meta">${escapeHtml(item.meta)}</div>` : ""}
            </div>
            ${item.detail && item.detailKey ? `
              <div class="timeline-event-detail-toggle-row">
                <button
                  class="toolbar-button toolbar-button--small timeline-event-detail-toggle"
                  type="button"
                  data-expand-detail-key="${item.detailKey}"
                  aria-expanded="${item.detailOpen ? "true" : "false"}"
                >${escapeHtml(item.detailLabel ?? "Details")}</button>
              </div>
              <div class="timeline-event-detail-panel ${item.detailOpen ? "is-open" : ""}">${item.detail}</div>
            ` : ""}
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderPayloadDetail(payload: unknown, rootPath: string, expandedValuePaths: Set<string>): string | undefined {
  if (!hasRichPayload(payload)) {
    return undefined;
  }

  return renderValueExplorer(payload, rootPath, expandedValuePaths);
}

function hasRichPayload(payload: unknown): payload is Record<string, unknown> | unknown[] {
  if (Array.isArray(payload)) {
    return payload.length > 0;
  }

  if (!payload || typeof payload !== "object") {
    return false;
  }

  const keys = Object.keys(payload as Record<string, unknown>);
  if (keys.length === 0) {
    return false;
  }

  return keys.length > 1 || keys[0] !== "message";
}

function formatTimelineEventLabel(type: string): string {
  return type
    .split(":")
    .map((segment) => segment.length > 0 ? `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}` : segment)
    .join(" / ");
}

function buildTimelineFilterItems(timeline: ReturnType<typeof buildTimeline>, activeFilter: TimelinePanelFilter): WorkbenchListItem[] {
  const counts = new Map<Exclude<TimelinePanelFilter, "all">, number>();

  for (const entry of timeline) {
    const key = resolveTimelineFilter(entry.type);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return TIMELINE_FILTER_ORDER
    .filter((key) => key === "all" || (counts.get(key) ?? 0) > 0)
    .map((key) => ({
      title: TIMELINE_FILTER_LABELS[key],
      badge: String(key === "all" ? timeline.length : counts.get(key) ?? 0),
      active: key === activeFilter,
      tone: key === "issues" && (counts.get("issues") ?? 0) > 0 ? "warn" : "neutral",
      attributes: { "data-timeline-filter": key }
    }));
}

function resolveTimelineFilter(type: string): Exclude<TimelinePanelFilter, "all"> {
  const normalizedType = type.toLowerCase();

  if (normalizedType.startsWith("error:") || normalizedType.includes("warn") || normalizedType.includes("hydration")) {
    return "issues";
  }

  if (normalizedType.startsWith("route:")) {
    return "route";
  }

  if (normalizedType.startsWith("component:")) {
    return "component";
  }

  if (normalizedType.startsWith("signal:")) {
    return "signal";
  }

  if (normalizedType.startsWith("effect:")) {
    return "effect";
  }

  if (normalizedType.startsWith("dom:")) {
    return "dom";
  }

  if (normalizedType.startsWith("queue:")) {
    return "queue";
  }

  if (normalizedType.startsWith("hub:")) {
    return "hub";
  }

  return "other";
}

function resolveTimelineEntryTone(type: string): IframeResultItem["tone"] | undefined {
  const normalizedType = type.toLowerCase();
  if (normalizedType.startsWith("error:") || normalizedType.includes("error")) {
    return "error";
  }

  if (normalizedType.includes("warn") || normalizedType.includes("hydration")) {
    return "warn";
  }

  return undefined;
}