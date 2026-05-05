import { issueMessage, type DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml, safeString } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderInvestigationJournal,
  renderWorkbenchIntroState,
  renderWorkbenchList,
  type WorkbenchListItem,
} from "./iframeShells.js";
import {
  buildLogWorkbenchModel,
  type LogWorkbenchEntry,
  type LogWorkbenchModel,
} from "./runtimeWorkbenchModels.js";

type IssueFilter = "all" | "error" | "warn";
type LogFilter = "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";

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
      metrics: buildLogMetrics(model, state.logFilter, searchQuery),
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
    badge: activeFilter === "all" ? formatLogFilterLabel(entry.family) : undefined,
    active: selectedKey === entry.key,
    tone: entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "neutral",
    group: activeFilter === "all" ? formatLogFilterLabel(entry.family) : undefined,
    attributes: { "data-log-entry-key": entry.key }
  };
}

function buildLogMetrics(model: LogWorkbenchModel, activeFilter: LogFilter, searchQuery: string) {
  return [
    { label: "Shown", value: String(model.filteredCount) },
    { label: "Buffered", value: String(model.totalCount) },
    { label: "Filter", value: formatLogFilterLabel(activeFilter), tone: activeFilter === "all" ? "neutral" : "accent" },
    { label: "Search", value: searchQuery.trim().length > 0 ? "Active" : "Idle", tone: searchQuery.trim().length > 0 ? "accent" : "neutral" },
  ] as const;
}

function buildIssueMetrics(visibleCount: number, errorCount: number, warnCount: number, issueFilter: IssueFilter) {
  return [
    { label: "Shown", value: String(visibleCount) },
    { label: "Errors", value: String(errorCount), tone: errorCount > 0 ? "error" : "neutral" },
    { label: "Warnings", value: String(warnCount), tone: warnCount > 0 ? "warn" : "neutral" },
    { label: "Lane", value: formatIssueFilterLabel(issueFilter), tone: issueFilter === "all" ? "neutral" : "accent" },
  ] as const;
}

function formatLogFilterLabel(filter: LogFilter | "runtime"): string {
  switch (filter) {
    case "component":
      return "Components";
    case "signal":
      return "Signals";
    case "effect":
      return "Effects";
    case "error":
      return "Errors";
    case "hub":
      return "Hub";
    case "route":
      return "Route";
    case "runtime":
      return "Runtime";
    case "all":
    default:
      return "All";
  }
}

function formatIssueFilterLabel(filter: IssueFilter): string {
  switch (filter) {
    case "error":
      return "Errors";
    case "warn":
      return "Warnings";
    case "all":
    default:
      return "All surfaced";
  }
}

function buildFeedEntryKey(timestamp: number, type: string, summary: string): string {
  return `${String(timestamp)}:${type}:${summary}`;
}

function renderSelectedDataStage(content: string): string {
  return `<div class="devtools-value-surface">${content}</div>`;
}

function renderSelectedPayloadStage(payload: unknown, rootPath: string, fallbackSummary: string, expandedValuePaths: Set<string>): string {
  if (!hasRichPayload(payload)) {
    return `<div class="empty-state">${escapeHtml(fallbackSummary)}</div>`;
  }

  return renderSelectedDataStage(renderValueExplorer(payload, rootPath, expandedValuePaths));
}

function summarizePayloadFields(payload: unknown, excludedKeys: readonly string[] = []): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  const entries = Object.entries(payload)
    .filter(([key, value]) => !excludedKeys.includes(key) && safeString(value).length > 0)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${safeString(value)}`);

  return entries.join(" | ");
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