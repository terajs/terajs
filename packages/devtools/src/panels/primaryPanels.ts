import { buildTimeline } from "../analytics.js";
import {
  collectMetaEntries,
  issueMessage,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import type { SafeDocumentContext } from "../documentContext.js";
import { escapeHtml, safeString } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderInvestigationJournal,
  renderIframeComponentsScreen,
  renderWorkbenchFacts,
  renderWorkbenchIntroState,
  renderWorkbenchMetrics,
  type WorkbenchListItem,
  renderWorkbenchList,
} from "./iframeShells.js";
import { buildMetaPanelItems, findSelectedMetaPanelItem, type MetaPanelItem } from "./metaPanelItems.js";
import {
  buildLogWorkbenchModel,
  type LogWorkbenchEntry,
  type LogWorkbenchModel,
} from "./runtimeWorkbenchModels.js";
import { renderDevtoolsHeadingRow } from "../devtoolsIcons.js";
export { renderSignalsPanel } from "./signalsPanel.js";

type IssueFilter = "all" | "error" | "warn";
type LogFilter = "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";
export type TimelinePanelFilter = "all" | "issues" | "route" | "component" | "signal" | "effect" | "dom" | "queue" | "hub" | "other";

export const DEFAULT_TIMELINE_PANEL_FILTER: TimelinePanelFilter = "all";

interface MetaStateLike {
  events: DevtoolsEventLike[];
  selectedMetaKey: string | null;
  metaSearchQuery?: string;
  expandedValuePaths: Set<string>;
}

interface IssuesStateLike {
  events: DevtoolsEventLike[];
  issueFilter: IssueFilter;
  selectedIssueKey: string | null;
  expandedValuePaths: Set<string>;
}

interface LogsStateLike {
  events: DevtoolsEventLike[];
  logFilter: LogFilter;
  selectedLogEntryKey: string | null;
  logSearchQuery?: string;
  expandedValuePaths: Set<string>;
}

interface TimelineStateLike {
  events: DevtoolsEventLike[];
  timelineFilter?: TimelinePanelFilter;
  expandedValuePaths: Set<string>;
  expandedDetailKeys: Set<string>;
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

export function renderMetaPanel(state: MetaStateLike, documentContext: SafeDocumentContext | null = null): string {
  const searchQuery = state.metaSearchQuery ?? "";
  const items = filterMetaPanelItems(buildMetaPanelItems(collectMetaEntries(state.events), documentContext), searchQuery);
  const selected = findSelectedMetaPanelItem(items, state.selectedMetaKey);
  const selectionMarkup = items.length === 0
    ? `<div class="empty-state">${searchQuery.trim().length > 0 ? `No metadata sources match "${escapeHtml(searchQuery)}".` : "No component or route metadata has been observed yet."}</div>`
    : renderWorkbenchList(items.map((item) => ({
      title: item.title,
      summary: item.summary,
      meta: item.detailSubtitle,
      badge: formatMetaSurfaceLabel(item),
      iconName: item.iconName,
      active: selected?.key === item.key,
      group: item.groupLabel,
      attributes: { "data-meta-key": item.key }
    })));

  const detailMarkup = selected
    ? renderSelectedDataStage(renderValueExplorer(selected.value, `meta-panel.${selected.key}`, state.expandedValuePaths))
    : renderWorkbenchIntroState({
      title: "Select one metadata surface",
      description: "Keep document head, resolved routes, component metadata, and AI snapshots separate so you can compare what each surface contributed without flattening them into one report.",
      metrics: buildMetaMetrics(items),
      steps: [
        "Use search to narrow routes, document head, component metadata, or AI surfaces.",
        "Choose one surface from the left before reading the structured snapshot on the right.",
        "Compare neighboring surfaces one at a time so you can see which source actually won on the page."
      ],
      note: searchQuery.trim().length > 0
        ? `Search is currently narrowing the metadata rail to ${items.length} captured surfaces.`
        : "The right pane stays empty until you choose one surface, which keeps the comparison target stable."
    });

  return renderIframeComponentsScreen({
    className: "meta-panel-screen",
    treeAriaLabel: "Observed metadata",
    treeToolbar: renderWorkbenchSearchInput(searchQuery, "Search routes, document head, or AI snapshots", 'data-meta-search="true"'),
    treeBody: selectionMarkup,
    detailAriaLabel: "Metadata detail",
    detailTitle: "Metadata inspector",
    detailSubtitle: selected?.title ?? "Pick a metadata source from the left to inspect its captured snapshot.",
    detailBody: detailMarkup,
    detailIconName: "meta"
  });
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

interface IssueWorkbenchEntry {
  key: string;
  issue: DevtoolsEventLike;
  title: string;
  summary: string;
  meta: string;
  badge: string;
  tone: "warn" | "error";
  group: string;
  payload: Record<string, unknown> | unknown[] | undefined;
}

function resolveSeverityToneClass(
  tone: "warn" | "error" | "neutral" | undefined,
  neutralToneClass: string
): string {
  if (tone === "error") {
    return "is-red";
  }

  if (tone === "warn") {
    return "is-amber";
  }

  return neutralToneClass;
}

function toSoftToneClass(toneClass: string): string {
  return `${toneClass}-soft`;
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

function renderWorkbenchSearchInput(value: string, placeholder: string, dataAttribute: string): string {
  return `
    <label class="workbench-search">
      <input class="workbench-search-input" type="search" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${dataAttribute} />
    </label>
  `;
}

function renderCompactSubrouteControls<TView extends string>(
  activeView: TView,
  ariaLabel: string,
  dataAttribute: string,
  views: Array<{ key: TView; label: string; title?: string }>
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
          ${view.title ? `title="${escapeHtml(view.title)}"` : ""}
        >${escapeHtml(view.label)}</button>
      `).join("")}
    </div>
  `;
}

function filterMetaPanelItems(items: ReturnType<typeof buildMetaPanelItems>, searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return items;
  }

  return items.filter((item) => [item.title, item.summary, item.detailSubtitle, item.sectionTitle, item.groupLabel]
    .some((value) => value.toLowerCase().includes(normalizedQuery)));
}

function toIssueWorkbenchEntry(issue: DevtoolsEventLike): IssueWorkbenchEntry {
  const tone = issue.level === "error" || issue.type.startsWith("error:") ? "error" : "warn";
  return {
    key: buildFeedEntryKey(issue.timestamp, issue.type, issueMessage(issue)),
    issue,
    title: issueMessage(issue),
    summary: summarizePayloadFields(issue.payload, ["message", "likelyCause"]),
    meta: joinMetaParts([issue.type, formatEventTime(issue.timestamp)]),
    badge: tone === "error" ? "Error" : "Warn",
    tone,
    group: tone === "error" ? "Critical failures" : "Warnings",
    payload: issue.payload,
  };
}

function toLogWorkbenchListItem(entry: LogWorkbenchEntry, selectedKey: string | null, activeFilter: LogFilter): WorkbenchListItem {
  return {
    title: entry.title,
    summary: entry.summary,
    meta: joinMetaParts([
      entry.eventType,
      entry.level ? entry.level.toUpperCase() : undefined,
      formatEventTime(entry.timestamp)
    ]),
    badge: entry.level === "error"
      ? "Error"
      : entry.level === "warn"
        ? "Warn"
        : activeFilter === "all"
          ? undefined
          : formatLogFilterLabel(activeFilter),
    active: selectedKey === entry.key,
    group: activeFilter === "all" ? entry.group : undefined,
    tone: entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "neutral",
    attributes: { "data-log-entry-key": entry.key }
  };
}

function buildMetaMetrics(items: readonly MetaPanelItem[]) {
  const counts = {
    document: 0,
    metadata: 0,
    ai: 0,
    routes: 0,
  };

  for (const item of items) {
    if (item.groupLabel === "Document") {
      counts.document += 1;
      continue;
    }

    if (item.groupLabel === "Routes") {
      counts.routes += 1;
      continue;
    }

    if (item.groupLabel === "AI") {
      counts.ai += 1;
      continue;
    }

    counts.metadata += 1;
  }

  return [
    { label: "Document", value: String(counts.document) },
    { label: "Metadata", value: String(counts.metadata) },
    { label: "AI", value: String(counts.ai) },
    { label: "Routes", value: String(counts.routes) },
  ] as const;
}

function buildLogMetrics(model: LogWorkbenchModel) {
  return [
    { label: "Shown", value: String(model.filteredCount) },
    { label: "Buffered", value: String(model.totalCount) },
    { label: "Errors", value: String(model.errorCount), tone: model.errorCount > 0 ? "error" : "neutral" },
    { label: "Warnings", value: String(model.warnCount), tone: model.warnCount > 0 ? "warn" : "neutral" },
  ] as const;
}

function buildIssueMetrics(visibleCount: number, errorCount: number, warnCount: number, issueFilter: IssueFilter) {
  return [
    { label: "Shown", value: String(visibleCount) },
    { label: "Errors", value: String(errorCount), tone: errorCount > 0 ? "error" : "neutral" },
    { label: "Warnings", value: String(warnCount), tone: warnCount > 0 ? "warn" : "neutral" },
    { label: "Filter", value: formatIssueFilterLabel(issueFilter) },
  ] as const;
}

function formatMetaSurfaceLabel(item: MetaPanelItem): string {
  if (item.key === "document:head") {
    return "Head";
  }

  if (item.groupLabel === "Routes") {
    return "Route";
  }

  if (item.groupLabel === "AI") {
    return "AI";
  }

  return "Meta";
}
function formatLogFilterLabel(filter: LogFilter): string {
  if (filter === "all") {
    return "All";
  }

  if (filter === "hub") {
    return "Hub";
  }

  return `${filter.slice(0, 1).toUpperCase()}${filter.slice(1)}`;
}

function formatIssueFilterLabel(filter: IssueFilter): string {
  switch (filter) {
    case "error":
      return "Errors";
    case "warn":
      return "Warnings";
    default:
      return "All issues";
  }
}

function buildFeedEntryKey(timestamp: number, type: string, summary: string): string {
  return `${String(timestamp)}:${type}:${summary}`;
}

function renderSelectedDataStage(content: string): string {
  return `<div class="devtools-value-surface">${content}</div>`;
}

function renderSelectedPayloadStage(payload: unknown, rootPath: string, fallbackSummary: string, expandedValuePaths: Set<string>): string {
  if (payload === undefined) {
    return `<div class="empty-state">${escapeHtml(fallbackSummary)}</div>`;
  }

  return renderSelectedDataStage(renderValueExplorer(payload, rootPath, expandedValuePaths));
}

function summarizePayloadFields(payload: unknown, excludedKeys: readonly string[] = []): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Captured event context";
  }

  const fields = Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => !excludedKeys.includes(key) && value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${safeString(value)}`);

  return fields.length > 0 ? fields.join(" | ") : "Captured event context";
}

function renderIframeResultList(items: readonly IframeResultItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="iframe-results-pane">
      <ul class="iframe-results-list">
        ${items.map((item) => `
          <li class="iframe-results-item${item.tone ? ` is-${item.tone}` : ""}${item.variant ? ` is-${item.variant}` : ""}">
            <div class="iframe-results-item-head">
              <div class="iframe-results-item-copy">
                ${item.kicker || item.meta ? `
                  <div class="iframe-results-item-kicker-row">
                    ${item.kicker ? `<span class="iframe-results-item-kicker">${escapeHtml(item.kicker)}</span>` : ""}
                    ${item.meta ? `<div class="iframe-results-item-meta">${escapeHtml(item.meta)}</div>` : ""}
                  </div>
                ` : ""}
                <div class="iframe-results-item-title-row">
                  <div class="iframe-results-item-title">${escapeHtml(item.title)}</div>
                </div>
                ${item.summary ? `<div class="iframe-results-item-summary">${escapeHtml(item.summary)}</div>` : ""}
              </div>
            </div>
            ${item.detail ? `
              <details class="iframe-results-item-detail"${item.detailOpen ? " open" : ""}>
                <summary class="iframe-results-item-detail-toggle"${item.detailKey ? ` data-timeline-detail-key="${escapeHtml(item.detailKey)}"` : ""}>${escapeHtml(item.detailLabel ?? "Structured payload")}</summary>
                <div class="iframe-results-item-detail-body">${item.detail}</div>
              </details>
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

export function renderIssuesPanel(state: IssuesStateLike): string {
  const issues = state.events.filter((event) =>
    event.type.startsWith("error:") ||
    event.type.includes("warn") ||
    event.type.includes("hydration") ||
    event.level === "error" ||
    event.level === "warn"
  );

  const errorCount = issues.filter((event) => event.level === "error" || event.type.startsWith("error:")).length;
  const warnCount = issues.filter((event) => event.level === "warn" || event.type.includes("warn")).length;
  const filteredIssues = issues.filter((event) => {
    if (state.issueFilter === "all") {
      return true;
    }

    if (state.issueFilter === "error") {
      return event.level === "error" || event.type.startsWith("error:");
    }

    return event.level === "warn" || event.type.includes("warn") || event.type.includes("hydration");
  });

  const issueEntries = filteredIssues
    .slice(-80)
    .map((issue) => toIssueWorkbenchEntry(issue))
    .reverse();
  const selectedIssue = issueEntries.find((entry) => entry.key === state.selectedIssueKey) ?? null;
  const issuePanelToneClass = errorCount > 0 ? "is-red" : "is-amber";
  const selectedIssueToneClass = resolveSeverityToneClass(selectedIssue?.tone, "is-amber");

  const filterToolbar = renderCompactSubrouteControls(state.issueFilter, "Issue lanes", "data-issue-filter", [
    { key: "all", label: `All ${issues.length}` },
    { key: "error", label: `Errors ${errorCount}` },
    { key: "warn", label: `Warnings ${warnCount}` },
  ]);

  const sidebarBody = issueEntries.length === 0
    ? `<div class="empty-state">No surfaced issues for the current filter.</div>`
    : renderWorkbenchList(issueEntries.map((entry) => ({
      title: entry.title,
      summary: entry.summary,
      meta: entry.meta,
      badge: entry.badge,
      active: selectedIssue?.key === entry.key,
      tone: entry.tone,
      group: entry.group,
      attributes: { "data-issue-entry-key": entry.key }
    })));

  const detailBody = selectedIssue
    ? renderSelectedPayloadStage(
        selectedIssue.payload,
        `issues.${selectedIssue.key}`,
        selectedIssue.summary || "No captured data for this issue.",
        state.expandedValuePaths
      )
    : renderWorkbenchIntroState({
      title: "Inspect one surfaced issue",
      titleToneClass: "is-amber",
      description: "Keep critical failures and warnings in one feed, then inspect the exact event context on the right so issue triage feels like an investigation instead of a report.",
      metrics: buildIssueMetrics(issueEntries.length, errorCount, warnCount, state.issueFilter),
      steps: [
        "Pick the severity lane first if the feed is noisy.",
        "Select one surfaced issue from the left to inspect its metadata and captured context.",
        "Stay on the selected issue while you compare Logs and Queue so the root symptom remains stable."
      ],
      note: "The right pane stays empty until you choose one surfaced issue from the left rail."
    });

  return renderInvestigationJournal({
    className: "issues-panel-layout investigation-panel investigation-panel--issues investigation-journal--issues",
    ariaLabel: "Issue investigation",
    title: "Issue Investigation",
    subtitle: `${issueEntries.length} shown · ${formatIssueFilterLabel(state.issueFilter)} · ${issues.length} total surfaced`,
    titleToneClass: issuePanelToneClass,
    subtitleToneClass: toSoftToneClass(issuePanelToneClass),
    heroKicker: "Surfaced issue flow",
    heroTitle: "Focus the active issue, not the whole dump",
    heroSummary: selectedIssue
      ? "The selected issue stays on the right while the left rail keeps only the surfaced issue list and severity filters in view."
      : "Use the left rail to narrow failures and warnings, then inspect the selected issue on the larger stage.",
    toolbar: filterToolbar,
    feedAriaLabel: "Issue investigation feed",
    feedTitle: "Issue feed",
    feedSubtitle: `${issueEntries.length} recent surfaced issues`,
    feedTitleToneClass: "is-amber",
    feedSubtitleToneClass: "is-amber-soft",
    feedBody: sidebarBody,
    detailAriaLabel: "Issue detail",
    detailTitle: selectedIssue?.title ?? "Issue inspector",
    detailSubtitle: selectedIssue?.meta ?? "Select one surfaced issue from the feed to inspect its context.",
    detailTitleToneClass: selectedIssueToneClass,
    detailSubtitleToneClass: toSoftToneClass(selectedIssueToneClass),
    detailBody,
  });
}

export function renderLogsPanel(state: LogsStateLike): string {
  const searchQuery = state.logSearchQuery ?? "";
  const model = buildLogWorkbenchModel(state.events, state.logFilter, state.selectedLogEntryKey, searchQuery);
  const selectedLog = model.selected ?? null;
  const selectedLogToneClass = selectedLog?.level === "error"
    ? "is-red"
    : selectedLog?.level === "warn"
      ? "is-amber"
      : "is-cyan";

  const filterSummaries: Record<LogFilter, string> = {
    all: `${model.totalCount} retained events`,
    component: "component lifecycle and render activity",
    signal: "signal and ref updates",
    effect: "effect execution and cleanup",
    error: "runtime warnings and failures",
    hub: "hub connection and push traffic",
    route: "router navigation and metadata"
  };

  const filterToolbar = [
    renderWorkbenchSearchInput(searchQuery, "Search event names, summaries, or payload labels", 'data-log-search="true"'),
    renderCompactSubrouteControls(state.logFilter, "Event lanes", "data-log-filter", (["all", "component", "signal", "effect", "error", "hub", "route"] as const).map((filter) => ({
      key: filter,
      label: `${formatLogFilterLabel(filter)} ${model.filterCounts[filter]}`,
      title: filterSummaries[filter],
    })))
  ].join("");

  const sidebarBody = model.entries.length === 0
    ? `<div class="empty-state">${searchQuery.trim().length > 0 ? `No events match "${escapeHtml(searchQuery)}".` : "No events for the current filter."}</div>`
    : renderWorkbenchList(model.entries.map((entry) => toLogWorkbenchListItem(entry, selectedLog?.key ?? null, state.logFilter)));

  const detailBody = selectedLog
    ? renderSelectedPayloadStage(
        selectedLog.payload,
        `logs.${selectedLog.key}`,
        selectedLog.summary || "No captured data for this event.",
        state.expandedValuePaths
      )
    : renderWorkbenchIntroState({
      title: "Choose an event to inspect",
      titleToneClass: "is-cyan",
      description: "Filter the feed first, then inspect one event at a time. The left rail stays dense so you can keep temporal context while drilling into a single payload.",
      metrics: buildLogMetrics(model),
      steps: [
        "Use the domain chips to narrow the feed before you select anything.",
        "Pick one event on the left to inspect its captured fields on the right.",
        "Use search for names, summaries, or payload text when the feed gets noisy."
      ],
      note: searchQuery.trim().length > 0
        ? `Search is currently reducing the feed to ${model.filteredCount} matching events.`
        : "The right pane stays empty until you choose one event so you do not lose your place in the feed."
    });

  return renderInvestigationJournal({
    className: "logs-panel-layout investigation-panel investigation-panel--logs investigation-journal--logs",
    ariaLabel: "Event investigation",
    title: "Event Investigation",
    subtitle: `${model.filteredCount} shown · ${formatLogFilterLabel(state.logFilter)} · ${model.totalCount} buffered`,
    titleToneClass: "is-blue",
    subtitleToneClass: "is-blue-soft",
    heroKicker: "Live event journal",
    heroTitle: "Keep the journal narrow and the stage wide",
    heroSummary: selectedLog
      ? "The selected event stays isolated on the right so the journal remains a lightweight submenu instead of competing with the inspection stage."
      : "Search and filter from the top, skim the left rail, then inspect one event on the larger stage.",
    toolbar: filterToolbar,
    feedAriaLabel: "Event feed",
    feedTitle: "Investigation feed",
    feedSubtitle: `${model.filteredCount} visible events in the current stream`,
    feedTitleToneClass: "is-blue",
    feedSubtitleToneClass: "is-blue-soft",
    feedBody: sidebarBody,
    detailAriaLabel: "Event detail",
    detailTitle: selectedLog?.title ?? "Event inspector",
    detailSubtitle: selectedLog
      ? joinMetaParts([selectedLog.eventType, selectedLog.level ? selectedLog.level.toUpperCase() : undefined, formatEventTime(selectedLog.timestamp)])
      : "Select one event from the journal to inspect its payload and metadata.",
    detailTitleToneClass: selectedLogToneClass,
    detailSubtitleToneClass: toSoftToneClass(selectedLogToneClass),
    detailBody,
  });
}

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
      };
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
