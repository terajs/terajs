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
import { renderPageSection, renderPageShell } from "./layout.js";

type LogFilter = "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";

interface SignalsStateLike {
  events: DevtoolsEventLike[];
}

interface MetaStateLike {
  events: DevtoolsEventLike[];
  selectedMetaKey: string | null;
  expandedValuePaths: Set<string>;
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
      <ul class="stack-list">
        ${resolvedUpdates.map((update) => `
          <li class="stack-item">
            <span class="accent-text is-cyan">${escapeHtml(update.label)}</span>
            ${update.type ? `<span class="muted-text">(${escapeHtml(update.type)})</span>` : ""}
            <span class="muted-text">= ${escapeHtml(update.preview)}</span>
          </li>
        `).join("")}
      </ul>
    `;

  const registryMarkup = registry.length === 0
    ? `<div class="empty-state">No active refs/signals/reactive values registered.</div>`
    : `
      <ul class="stack-list compact-list">
        ${registry.slice(0, 36).map((entry) => `
          <li class="stack-item performance-item">
            <span class="accent-text is-purple">${escapeHtml(entry.label)}</span>
            <span class="muted-text">${escapeHtml(entry.type)}</span>
            <span class="muted-text">${escapeHtml(entry.valuePreview)}</span>
          </li>
        `).join("")}
      </ul>
    `;

  return renderPageShell({
    title: "Ref / Reactive Inspector",
    accentClass: "is-purple",
    subtitle: `Effects run: ${effectRuns} | Active reactive values: ${registry.length}`,
    pills: [
      `${resolvedUpdates.length} recent updates`,
      `${registry.length} active values`
    ],
    body: [
      renderPageSection("Recent updates", updatesMarkup),
      renderPageSection("Active reactive registry", registryMarkup)
    ].join("")
  });
}

export function renderMetaPanel(state: MetaStateLike, documentContext: SafeDocumentContext | null = null): string {
  const entries = collectMetaEntries(state.events);
  const selected = entries.find((entry) => entry.key === state.selectedMetaKey) ?? entries[0] ?? null;
  const documentSnapshotMarkup = documentContext
    ? renderValueExplorer(documentContext, "meta-panel.document", state.expandedValuePaths)
    : `<div class="empty-state">No safe document head context captured yet.</div>`;

  if (entries.length === 0) {
    return renderPageShell({
      title: "Meta / AI / Route Inspector",
      accentClass: "is-green",
      subtitle: "Metadata currently available on the debug stream",
      body: [
        renderPageSection("Observed metadata", `<div class="empty-state">No component metadata has been observed yet.</div>`, "is-full"),
        renderPageSection("Document head snapshot", documentSnapshotMarkup, "is-full")
      ].join("")
    });
  }

  const selectionMarkup = `
    <ul class="stack-list compact-list">
      ${entries.map((entry) => `
        <li>
          <button class="select-button ${selected?.key === entry.key ? "is-selected" : ""}" data-meta-key="${escapeHtml(entry.key)}">
            <span class="accent-text is-green">${escapeHtml(entry.scope)}</span>
            <span class="muted-text">#${entry.instance}</span>
          </button>
        </li>
      `).join("")}
    </ul>
  `;

  return renderPageShell({
    title: "Meta / AI / Route Inspector",
    accentClass: "is-green",
    subtitle: `Components with metadata: ${entries.length}`,
    pills: [selected ? `${selected.scope}#${selected.instance} selected` : "No selection"],
    body: [
      renderPageSection("Observed metadata", selectionMarkup),
      renderPageSection("Document head snapshot", documentSnapshotMarkup, "is-full"),
      renderPageSection("Meta snapshot", renderValueExplorer(selected?.meta ?? {}, "meta-panel.meta", state.expandedValuePaths)),
      renderPageSection("AI snapshot", renderValueExplorer(selected?.ai ?? {}, "meta-panel.ai", state.expandedValuePaths)),
      renderPageSection("Route snapshot", renderValueExplorer(selected?.route ?? {}, "meta-panel.route", state.expandedValuePaths))
    ].join("")
  });
}

export function renderIssuesPanel(events: DevtoolsEventLike[]): string {
  const issues = events.filter((event) =>
    event.type.startsWith("error:") ||
    event.type.includes("warn") ||
    event.type.includes("hydration") ||
    event.level === "error" ||
    event.level === "warn"
  );

  const errorCount = issues.filter((event) => event.level === "error" || event.type.startsWith("error:")).length;
  const warnCount = issues.filter((event) => event.level === "warn" || event.type.includes("warn")).length;

  if (issues.length === 0) {
    return renderPageShell({
      title: "Issues and Warnings",
      accentClass: "is-red",
      subtitle: "Errors: 0 | Warnings: 0",
      body: renderPageSection("Issue feed", `<div class="empty-state">No issues detected.</div>`, "is-full")
    });
  }

  return renderPageShell({
    title: "Issues and Warnings",
    accentClass: "is-red",
    subtitle: `Errors: ${errorCount} | Warnings: ${warnCount}`,
    pills: [`${issues.length} surfaced events`],
    body: renderPageSection("Issue feed", `
      <ul class="stack-list">
        ${issues.slice(-50).map((issue) => `
          <li class="stack-item ${issue.level === "error" || issue.type.startsWith("error:") ? "issue-error" : "issue-warn"}">
            <span class="item-label">[${escapeHtml(issue.type)}]</span>
            <span>${escapeHtml(issueMessage(issue))}</span>
          </li>
        `).join("")}
      </ul>
    `, "is-full")
  });
}

export function renderLogsPanel(state: LogsStateLike): string {
  const logs = state.events.slice(-100).filter((event) => {
    if (state.logFilter === "all") return true;
    return event.type.includes(state.logFilter);
  });

  return renderPageShell({
    title: "Event Logs",
    accentClass: "is-blue",
    subtitle: `Total events: ${state.events.length}`,
    pills: [`filter: ${state.logFilter}`],
    body: [
      renderPageSection("Filters", `
        <div class="button-row">
          ${(["all", "component", "signal", "effect", "error", "hub", "route"] as const).map((filter) => `
            <button class="filter-button ${state.logFilter === filter ? "is-active" : ""}" data-log-filter="${filter}">${filter}</button>
          `).join("")}
        </div>
      `, "is-full"),
      renderPageSection("Recent events", logs.length === 0 ? `<div class="empty-state">No events.</div>` : `
        <ul class="stack-list log-list">
          ${logs.map((log) => `
            <li class="stack-item">
              <span class="accent-text is-cyan">[${escapeHtml(log.type)}]</span>
              <span>${escapeHtml(summarizeLog(log))}</span>
            </li>
          `).join("")}
        </ul>
      `, "is-full")
    ].join("")
  });
}

export function renderTimelinePanel(state: TimelineStateLike): string {
  const timeline = buildTimeline(state.events, 250);
  const cursor = timeline.length === 0 ? -1 : Math.max(0, Math.min(state.timelineCursor, timeline.length - 1));
  const replayedCount = timeline.length === 0 ? 0 : replayEventsAtIndex(timeline, cursor).length;

  return renderPageShell({
    title: "Timeline and Replay",
    accentClass: "is-green",
    subtitle: `Replaying ${replayedCount} / ${timeline.length} events`,
    pills: [timeline.length === 0 ? "timeline empty" : `cursor ${cursor}`],
    body: [
      renderPageSection("Replay cursor", timeline.length > 0 ? `
        <div class="range-wrap">
          <input class="timeline-slider" type="range" min="0" max="${Math.max(0, timeline.length - 1)}" value="${Math.max(0, cursor)}" data-timeline-cursor="true" />
          <div class="tiny-muted">Cursor: ${cursor}</div>
        </div>
      ` : `<div class="empty-state">No events in timeline.</div>`, "is-full"),
      renderPageSection("Replay feed", timeline.length === 0 ? `<div class="empty-state">No events in timeline.</div>` : `
        <ul class="stack-list log-list">
          ${timeline.map((entry, index) => `
            <li class="stack-item ${index <= cursor ? "timeline-active" : "timeline-inactive"}">
              <span class="item-label">[${escapeHtml(entry.type)}]</span>
              <span>${escapeHtml(entry.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `, "is-full")
    ].join("")
  });
}
