import { escapeHtml, matchesInspectorQuery } from "./shared.js";
import { renderValueExplorer } from "./valueExplorer.js";

export interface InspectorSelectedComponent {
  scope: string;
  instance: number;
}

export interface InspectorDrilldownSnapshot {
  mounts: number;
  updates: number;
  unmounts: number;
  errors: number;
  reactiveState: Array<{ key: string; preview: string }>;
  routeSnapshot?: unknown;
  metaSnapshot?: unknown;
  aiSnapshot?: unknown;
  domPreview: string[];
  recent: Array<{ type: string; summary: string }>;
}

export function renderInspectorOverviewPanel(
  selected: InspectorSelectedComponent,
  drilldown: InspectorDrilldownSnapshot,
  query: string
): string {
  const identitySource = {
    scope: selected.scope,
    instance: selected.instance,
    mounts: drilldown.mounts,
    updates: drilldown.updates,
    unmounts: drilldown.unmounts,
    reactiveKeys: drilldown.reactiveState.length,
    errors: drilldown.errors
  };

  if (query.length > 0 && !matchesInspectorQuery(query, "identity", identitySource)) {
    return "";
  }

  return `
    <div class="inspector-keyvalue-list">
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">scope</span><span class="inspector-keyvalue-value">${escapeHtml(selected.scope)}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">instance</span><span class="inspector-keyvalue-value">${selected.instance}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">mounts</span><span class="inspector-keyvalue-value">${drilldown.mounts}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">updates</span><span class="inspector-keyvalue-value">${drilldown.updates}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">unmounts</span><span class="inspector-keyvalue-value">${drilldown.unmounts}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">reactive keys</span><span class="inspector-keyvalue-value">${drilldown.reactiveState.length}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">errors</span><span class="inspector-keyvalue-value">${drilldown.errors}</span></div>
    </div>
  `;
}

export function renderInspectorRoutePanel(
  drilldown: InspectorDrilldownSnapshot,
  query: string,
  expandedValuePaths: Set<string>
): string {
  const routeSnapshot = drilldown.routeSnapshot;
  if (!hasInspectorSnapshotData(routeSnapshot)) {
    return query.length > 0 ? "" : `<div class="empty-state">No routing snapshot captured for this component yet.</div>`;
  }

  if (query.length > 0 && !matchesInspectorQuery(query, "routing", routeSnapshot)) {
    return "";
  }

  return renderValueExplorer(routeSnapshot, "route", expandedValuePaths);
}

export function renderInspectorMetaPanel(
  drilldown: InspectorDrilldownSnapshot,
  query: string,
  expandedValuePaths: Set<string>
): string {
  const metaSnapshot = drilldown.metaSnapshot;
  if (!hasInspectorSnapshotData(metaSnapshot)) {
    return query.length > 0 ? "" : `<div class="empty-state">No meta snapshot captured for this component yet.</div>`;
  }

  if (query.length > 0 && !matchesInspectorQuery(query, "meta", metaSnapshot)) {
    return "";
  }

  return renderValueExplorer(metaSnapshot, "meta", expandedValuePaths);
}

export function renderInspectorAiPanel(
  drilldown: InspectorDrilldownSnapshot,
  query: string,
  expandedValuePaths: Set<string>
): string {
  const aiSnapshot = drilldown.aiSnapshot;
  if (!hasInspectorSnapshotData(aiSnapshot)) {
    return query.length > 0 ? "" : `<div class="empty-state">No AI snapshot captured for this component yet.</div>`;
  }

  const aiTags = collectInspectorAiTags(aiSnapshot);
  const aiSummary = readInspectorStringField(aiSnapshot, "summary");
  const aiIntent = readInspectorStringField(aiSnapshot, "intent");
  const aiAudience = readInspectorStringField(aiSnapshot, "audience");

  if (query.length > 0 && !matchesInspectorQuery(query, "ai", aiSnapshot, aiTags, aiSummary, aiIntent, aiAudience)) {
    return "";
  }

  return `
    <div class="inspector-ai-panel">
      ${aiTags.length > 0 ? `
        <div class="inspector-ai-block">
          <div class="inspector-ai-title">tags</div>
          <div class="inspector-ai-tags">
            ${aiTags.map((tag) => `<span class="inspector-ai-tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      ` : ""}
      ${(aiSummary || aiIntent || aiAudience) ? `
        <div class="inspector-keyvalue-list">
          ${aiSummary ? `<div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">summary</span><span class="inspector-keyvalue-value">${escapeHtml(aiSummary)}</span></div>` : ""}
          ${aiIntent ? `<div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">intent</span><span class="inspector-keyvalue-value">${escapeHtml(aiIntent)}</span></div>` : ""}
          ${aiAudience ? `<div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">audience</span><span class="inspector-keyvalue-value">${escapeHtml(aiAudience)}</span></div>` : ""}
        </div>
      ` : ""}
      ${renderValueExplorer(aiSnapshot, "ai", expandedValuePaths)}
    </div>
  `;
}

function collectInspectorAiTags(aiSnapshot: unknown): string[] {
  const record = asInspectorRecord(aiSnapshot);
  if (!record) {
    return [];
  }

  const tags = [
    ...readInspectorStringList(record.tags),
    ...readInspectorStringList(record.keywords),
    ...readInspectorStringList(record.entities)
  ];

  return Array.from(new Set(tags));
}

function readInspectorStringField(value: unknown, key: string): string | undefined {
  const record = asInspectorRecord(value);
  const field = record?.[key];
  return typeof field === "string" && field.trim().length > 0 ? field : undefined;
}

function readInspectorStringList(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function asInspectorRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function hasInspectorSnapshotData(value: unknown): boolean {
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

export function renderInspectorDomPanel(drilldown: InspectorDrilldownSnapshot, query: string): string {
  const visibleDomPreview = query.length === 0
    ? drilldown.domPreview
    : drilldown.domPreview.filter((line) => line.toLowerCase().includes(query));

  return visibleDomPreview.length === 0
    ? `<div class="empty-state">${query.length > 0 ? "No DOM snapshot lines match the current filter." : "No DOM snapshot available for this component yet."}</div>`
    : `<pre class="inspector-code">${escapeHtml(visibleDomPreview.join("\n"))}</pre>`;
}

export function renderInspectorActivityPanel(drilldown: InspectorDrilldownSnapshot, query: string): string {
  const visibleRecent = query.length === 0
    ? drilldown.recent
    : drilldown.recent.filter((entry) => matchesInspectorQuery(query, entry.type, entry.summary));

  return visibleRecent.length === 0
    ? `<div class="empty-state">${query.length > 0 ? "No activity entries match the current filter." : "No component-specific events captured yet."}</div>`
    : `
      <ul class="stack-list activity-feed">
        ${visibleRecent.map((entry) => `
          <li class="stack-item">
            <span class="item-label">[${escapeHtml(entry.type)}]</span>
            <span>${escapeHtml(entry.summary)}</span>
          </li>
        `).join("")}
      </ul>
    `;
}
