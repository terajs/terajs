import { buildTimeline, replayEventsAtIndex } from "../analytics.js";
import {
  collectMetaEntries,
  collectSignalRegistrySnapshot,
  collectSignalUpdates,
  issueMessage,
  summarizeLog,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import type { SafeDocumentContext } from "../documentContext.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderIframeFlatSection,
  renderIframeNavList,
  renderIframeSinglePanel,
  renderIframeSplitPanel,
} from "./iframeShells.js";

type IssueFilter = "all" | "error" | "warn";
type LogFilter = "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";

interface SignalsStateLike {
  events: DevtoolsEventLike[];
}

interface MetaStateLike {
  events: DevtoolsEventLike[];
  selectedMetaKey: string | null;
  expandedValuePaths: Set<string>;
}

interface IssuesStateLike {
  events: DevtoolsEventLike[];
  issueFilter: IssueFilter;
}

interface LogsStateLike {
  events: DevtoolsEventLike[];
  logFilter: LogFilter;
}

interface TimelineStateLike {
  events: DevtoolsEventLike[];
  timelineCursor: number;
}

export function renderSignalsPanel(state: SignalsStateLike): string {
  const updates = collectSignalUpdates(state.events);
  const effectRuns = state.events.filter((event) => event.type === "effect:run").length;
  const registry = collectSignalRegistrySnapshot();
  const registryById = new Map(registry.map((entry) => [entry.id, entry]));
  const registryByKey = new Map(
    registry
      .filter((entry) => Boolean(entry.key))
      .map((entry) => [entry.key as string, entry])
  );

  const resolvedUpdates = updates.map((update) => {
    const match = registryById.get(update.key) ?? registryByKey.get(update.key);
    return {
      ...update,
      label: match?.label ?? update.key,
      type: match?.type
    };
  });

  const updatesMarkup = resolvedUpdates.length === 0
    ? `<div class="empty-state">No recent reactive updates in the buffered event window.</div>`
    : `
      <ul class="signals-list">
        ${resolvedUpdates.map((update) => `
          <li class="signals-list-item">
            <div class="signals-list-row">
              <span class="accent-text is-cyan">${escapeHtml(update.label)}</span>
              ${update.type ? `<span class="muted-text">(${escapeHtml(update.type)})</span>` : ""}
            </div>
            <div class="signals-list-preview">${escapeHtml(update.preview)}</div>
          </li>
        `).join("")}
      </ul>
    `;

  const registryMarkup = registry.length === 0
    ? `<div class="empty-state">No active refs/signals/reactive values registered.</div>`
    : `
      <ul class="signals-list signals-list-compact">
        ${registry.slice(0, 36).map((entry) => `
          <li class="signals-list-item">
            <div class="signals-list-row">
              <span class="accent-text is-cyan">${escapeHtml(entry.label)}</span>
              <span class="muted-text">${escapeHtml(entry.type)}</span>
            </div>
            <div class="signals-list-preview">${escapeHtml(entry.valuePreview)}</div>
          </li>
        `).join("")}
      </ul>
    `;

  return `
    <div class="signals-layout">
      <aside class="components-tree-pane signals-summary-pane" aria-label="Reactive summary">
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              <div class="panel-title is-cyan">Signal summary</div>
              <div class="panel-subtitle">Live reactive activity for the current session.</div>
            </div>
          </div>
        </div>
        <div class="components-screen-body">
          <div class="signals-summary-list">
            <section class="signals-summary-row">
              <div class="signals-summary-label">Recent updates</div>
              <div class="signals-summary-value">${escapeHtml(String(resolvedUpdates.length))}</div>
              <div class="signals-summary-note">Buffered signal/ref updates in the current event window.</div>
            </section>
            <section class="signals-summary-row">
              <div class="signals-summary-label">Effect runs</div>
              <div class="signals-summary-value">${escapeHtml(String(effectRuns))}</div>
              <div class="signals-summary-note">Observed effect executions across the retained session stream.</div>
            </section>
            <section class="signals-summary-row">
              <div class="signals-summary-label">Active values</div>
              <div class="signals-summary-value">${escapeHtml(String(registry.length))}</div>
              <div class="signals-summary-note">Currently registered refs, signals, and derived reactive values.</div>
            </section>
          </div>
        </div>
      </aside>

      <section class="components-inspector-pane signals-detail-pane" aria-label="Reactive detail">
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              <div class="panel-title is-cyan">Ref / Reactive Inspector</div>
              <div class="panel-subtitle">Reactive updates: ${escapeHtml(String(resolvedUpdates.length))} | Active reactive values: ${escapeHtml(String(registry.length))}</div>
            </div>
          </div>
        </div>
        <div class="components-screen-body">
          <div class="signals-detail-stack">
            <section class="signals-section-block">
              <div class="signals-section-heading">Recent updates</div>
              ${updatesMarkup}
            </section>
            <section class="signals-section-block">
              <div class="signals-section-heading">Active reactive registry</div>
              ${registryMarkup}
            </section>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderMetaPanel(state: MetaStateLike, documentContext: SafeDocumentContext | null = null): string {
  const entries = collectMetaEntries(state.events);
  const selected = entries.find((entry) => entry.key === state.selectedMetaKey) ?? entries[0] ?? null;
  const documentSnapshotMarkup = documentContext
    ? renderValueExplorer(documentContext, "meta-panel.document", state.expandedValuePaths)
    : `<div class="empty-state">No safe document head context captured yet.</div>`;

  const selectionMarkup = entries.length === 0
    ? `<div class="empty-state">No component or route metadata has been observed yet.</div>`
    : `
      <div class="ai-diagnostics-nav-list">
        ${entries.map((entry) => `
          <button
            class="ai-diagnostics-nav-button ${selected?.key === entry.key ? "is-active" : ""}"
            data-meta-key="${escapeHtml(entry.key)}"
            type="button"
          >
            <span class="ai-diagnostics-nav-title">${escapeHtml(entry.scope)}</span>
            <span class="ai-diagnostics-nav-summary">${escapeHtml(describeMetaEntry(entry))}</span>
          </button>
        `).join("")}
      </div>
    `;

  const metaSnapshotMarkup = selected
    ? renderValueExplorer(selected.meta ?? {}, "meta-panel.meta", state.expandedValuePaths)
    : `<div class="empty-state">Select a metadata source to inspect component or route snapshots.</div>`;
  const aiSnapshotMarkup = selected
    ? renderValueExplorer(selected.ai ?? {}, "meta-panel.ai", state.expandedValuePaths)
    : `<div class="empty-state">AI metadata appears here when a selected entry exposes it.</div>`;
  const routeSnapshotMarkup = selected
    ? renderValueExplorer(selected.route ?? {}, "meta-panel.route", state.expandedValuePaths)
    : `<div class="empty-state">Route metadata appears here when a selected entry exposes it.</div>`;

  return `
    <div class="ai-diagnostics-layout meta-panel-layout">
      <aside class="components-tree-pane ai-diagnostics-nav-pane meta-panel-nav-pane" aria-label="Observed metadata">
        <div class="components-screen-body">
          ${selectionMarkup}
        </div>
      </aside>

      <section class="components-inspector-pane ai-diagnostics-detail-pane meta-panel-detail-pane" aria-label="Metadata detail">
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              <div class="panel-title is-cyan">Meta / AI / Route Inspector</div>
              <div class="panel-subtitle">${escapeHtml(selected ? `${selected.scope} | ${describeMetaEntry(selected)}` : "Metadata currently available on the debug stream")}</div>
            </div>
          </div>
        </div>
        <div class="components-screen-body">
          <div class="meta-panel-detail-stack">
            <section class="meta-panel-section-block">
              <div class="meta-panel-section-heading">Document head snapshot</div>
              ${documentSnapshotMarkup}
            </section>
            <section class="meta-panel-section-block">
              <div class="meta-panel-section-heading">Meta snapshot</div>
              ${metaSnapshotMarkup}
            </section>
            <section class="meta-panel-section-block">
              <div class="meta-panel-section-heading">AI snapshot</div>
              ${aiSnapshotMarkup}
            </section>
            <section class="meta-panel-section-block">
              <div class="meta-panel-section-heading">Route snapshot</div>
              ${routeSnapshotMarkup}
            </section>
          </div>
        </div>
      </section>
    </div>
  `;
}

function describeMetaEntry(entry: { instance: number; key: string; meta: unknown; ai: unknown; route: unknown }): string {
  const surfaces: string[] = [];
  if (entry.meta !== undefined) {
    surfaces.push("meta");
  }
  if (entry.ai !== undefined) {
    surfaces.push("ai");
  }
  if (entry.route !== undefined) {
    surfaces.push("route");
  }

  const source = entry.key.startsWith("route:") ? "route snapshot" : `instance ${entry.instance}`;
  return surfaces.length > 0 ? `${source} | ${surfaces.join(" / ")}` : source;
}

interface IframeResultItem {
  title: string;
  summary?: string;
  meta?: string;
  tone?: "error" | "warn" | "neutral";
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

function renderIframeResultList(items: readonly IframeResultItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="iframe-results-pane">
      <ul class="iframe-results-list">
        ${items.map((item) => `
          <li class="iframe-results-item${item.tone ? ` is-${item.tone}` : ""}">
            <div class="iframe-results-item-head">
              <div class="iframe-results-item-title">${escapeHtml(item.title)}</div>
              ${item.meta ? `<div class="iframe-results-item-meta">${escapeHtml(item.meta)}</div>` : ""}
            </div>
            ${item.summary ? `<div class="iframe-results-item-summary">${escapeHtml(item.summary)}</div>` : ""}
          </li>
        `).join("")}
      </ul>
    </div>
  `;
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

  const issueFeedMarkup = renderIframeResultList(
    filteredIssues
      .slice(-50)
      .reverse()
      .map((issue) => ({
        title: issueMessage(issue),
        meta: joinMetaParts([
          issue.type,
          formatEventTime(issue.timestamp)
        ]),
        tone: issue.level === "error" || issue.type.startsWith("error:") ? "error" : "warn"
      })),
    "No issues detected for the current filter."
  );

  return renderIframeSplitPanel({
    className: "issues-panel-layout",
    navAriaLabel: "Issue filters",
    navMarkup: renderIframeNavList([
      {
        title: "All issues",
        summary: `${issues.length} surfaced events`,
        active: state.issueFilter === "all",
        attributes: { "data-issue-filter": "all" }
      },
      {
        title: "Errors",
        summary: `${errorCount} critical failures`,
        active: state.issueFilter === "error",
        attributes: { "data-issue-filter": "error" }
      },
      {
        title: "Warnings",
        summary: `${warnCount} warning signals`,
        active: state.issueFilter === "warn",
        attributes: { "data-issue-filter": "warn" }
      }
    ]),
    detailAriaLabel: "Issue detail",
    title: "Issues and Warnings",
    subtitle: `Errors: ${errorCount} | Warnings: ${warnCount}`,
    body: issueFeedMarkup
  });
}

export function renderLogsPanel(state: LogsStateLike): string {
  const logs = state.events.slice(-100).filter((event) => {
    if (state.logFilter === "all") return true;
    return event.type.includes(state.logFilter);
  });

  const filterSummaries: Record<LogFilter, string> = {
    all: `${state.events.length} retained events`,
    component: "component lifecycle and render activity",
    signal: "signal and ref updates",
    effect: "effect execution and cleanup",
    error: "runtime warnings and failures",
    hub: "hub connection and push traffic",
    route: "router navigation and metadata"
  };

  const logsMarkup = renderIframeResultList(
    logs
      .slice()
      .reverse()
      .map((log) => ({
        title: summarizeLog(log),
        meta: joinMetaParts([
          log.type,
          formatEventTime(log.timestamp)
        ]),
        tone: log.level === "error" ? "error" : log.level === "warn" ? "warn" : "neutral"
      })),
    "No events for the current filter."
  );

  return renderIframeSplitPanel({
    className: "logs-panel-layout",
    navAriaLabel: "Log filters",
    navMarkup: renderIframeNavList(
      (["all", "component", "signal", "effect", "error", "hub", "route"] as const).map((filter) => ({
        title: filter === "all" ? "All events" : filter,
        summary: filterSummaries[filter],
        active: state.logFilter === filter,
        attributes: { "data-log-filter": filter }
      }))
    ),
    detailAriaLabel: "Event log detail",
    title: "Event Logs",
    subtitle: `Total events: ${state.events.length} | Filter: ${state.logFilter}`,
    body: logsMarkup
  });
}

export function renderTimelinePanel(state: TimelineStateLike): string {
  const timeline = buildTimeline(state.events, 250);
  const cursor = timeline.length === 0 ? -1 : Math.max(0, Math.min(state.timelineCursor, timeline.length - 1));
  const replayedTimeline = timeline.length === 0 ? [] : replayEventsAtIndex(timeline, cursor);
  const replayedCount = replayedTimeline.length;
  const hiddenCount = Math.max(0, timeline.length - replayedCount);
  const replayResultsMarkup = renderIframeResultList(
    replayedTimeline.map((entry) => ({
      title: entry.summary,
      summary: entry.type,
      meta: joinMetaParts([
        `#${String(entry.index)}`,
        formatEventTime(entry.timestamp)
      ])
    })),
    "No replayed events are visible for the current cursor."
  );

  return renderIframeSinglePanel({
    className: "timeline-panel-layout",
    ariaLabel: "Timeline and replay",
    title: "Timeline and Replay",
    subtitle: `Replaying ${replayedCount} / ${timeline.length} events${hiddenCount > 0 ? ` | ${hiddenCount} hidden ahead` : ""}`,
    body: [
      renderIframeFlatSection("Replay cursor", timeline.length > 0 ? `
        <div class="timeline-control-panel">
          <div class="timeline-control-summary">
            <div class="timeline-control-count">${replayedCount} visible</div>
            <div class="timeline-control-note">${hiddenCount > 0 ? `${hiddenCount} upcoming events hidden from the feed.` : "All buffered events are visible."}</div>
          </div>
          <div class="range-wrap">
            <input class="timeline-slider" type="range" min="0" max="${Math.max(0, timeline.length - 1)}" value="${Math.max(0, cursor)}" data-timeline-cursor="true" />
            <div class="tiny-muted">Cursor: ${cursor} of ${Math.max(0, timeline.length - 1)}</div>
          </div>
        </div>
      ` : `<div class="empty-state">No events in timeline.</div>`),
      renderIframeFlatSection("Replay results", replayResultsMarkup, "timeline-results-section")
    ].join("")
  });
}
