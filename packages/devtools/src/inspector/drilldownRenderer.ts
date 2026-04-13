import { escapeHtml, normalizeInspectorQuery } from "./shared.js";
import type { MountedComponentEntry } from "./componentData.js";

export type InspectorSectionKey = "overview" | "props" | "reactive" | "route" | "meta" | "ai" | "dom" | "activity";

export interface InspectorDrilldownState {
  events: Array<{ type: string; payload?: Record<string, unknown> }>;
  componentInspectorQuery: string;
  expandedInspectorSections: Set<InspectorSectionKey>;
  expandedValuePaths: Set<string>;
}

export interface InspectorDrilldownSnapshot {
  mounts: number;
  unmounts: number;
  updates: number;
  errors: number;
  propsSnapshot: unknown;
  metaSnapshot: unknown;
  aiSnapshot: unknown;
  routeSnapshot: unknown;
  reactiveState: Array<{ key: string; preview: string }>;
  domPreview: string[];
  recent: Array<{ type: string; summary: string }>;
}

export interface InspectorSectionRenderers {
  overview(selected: MountedComponentEntry, drilldown: InspectorDrilldownSnapshot, query: string): string;
  props(state: InspectorDrilldownState, selected: MountedComponentEntry, drilldown: InspectorDrilldownSnapshot, query: string): string;
  dom(drilldown: InspectorDrilldownSnapshot, query: string): string;
  reactive(state: InspectorDrilldownState, selected: MountedComponentEntry, drilldown: InspectorDrilldownSnapshot, query: string): string;
  route(state: InspectorDrilldownState, drilldown: InspectorDrilldownSnapshot, query: string): string;
  meta(state: InspectorDrilldownState, drilldown: InspectorDrilldownSnapshot, query: string): string;
  ai(state: InspectorDrilldownState, drilldown: InspectorDrilldownSnapshot, query: string): string;
  activity(drilldown: InspectorDrilldownSnapshot, query: string): string;
}

export function isInspectorSectionKey(value: unknown): value is InspectorSectionKey {
  return value === "overview"
    || value === "props"
    || value === "reactive"
    || value === "route"
    || value === "meta"
    || value === "ai"
    || value === "dom"
    || value === "activity";
}

export function renderComponentDrilldownInspector(
  state: InspectorDrilldownState,
  selected: MountedComponentEntry,
  drilldown: InspectorDrilldownSnapshot,
  renderers: InspectorSectionRenderers
): string {
  const query = normalizeInspectorQuery(state.componentInspectorQuery);
  const lifecycleSummary = `Mounts ${drilldown.mounts} · Updates ${drilldown.updates} · Errors ${drilldown.errors}`;

  const sections = [
    {
      key: "overview",
      label: "identity",
      summary: `${selected.scope} · ${drilldown.mounts} mount${drilldown.mounts === 1 ? "" : "s"} · ${drilldown.updates} update${drilldown.updates === 1 ? "" : "s"}`,
      body: renderers.overview(selected, drilldown, query)
    },
    {
      key: "props",
      label: "script",
      body: renderers.props(state, selected, drilldown, query)
    },
    {
      key: "dom",
      label: "dom snapshot",
      body: renderers.dom(drilldown, query)
    },
    {
      key: "reactive",
      label: "reactive",
      body: renderers.reactive(state, selected, drilldown, query)
    },
    {
      key: "route",
      label: "routing",
      body: renderers.route(state, drilldown, query)
    },
    {
      key: "meta",
      label: "meta",
      body: renderers.meta(state, drilldown, query)
    },
    {
      key: "ai",
      label: "ai",
      body: renderers.ai(state, drilldown, query)
    },
    {
      key: "activity",
      label: "activity",
      body: renderers.activity(drilldown, query)
    }
  ] satisfies Array<{ key: InspectorSectionKey; label: string; summary?: string; body: string }>;

  const visibleSections = sections.filter((section) => section.body.trim().length > 0);

  return `
    <div class="component-drilldown-shell">
      <div class="component-drilldown-headline">
        <div class="component-drilldown-id">
          <span class="component-drilldown-path">&lt;${escapeHtml(selected.scope)}&gt;</span>
          ${selected.aiPreview ? `<span class="muted-text">${escapeHtml(selected.aiPreview)}</span>` : ""}
        </div>
        <div class="component-drilldown-meta">${lifecycleSummary}</div>
      </div>
      <div class="inspector-surface inspector-cascade">
        ${visibleSections.length === 0
          ? `<div class="empty-state">No inspector data matches the current filter.</div>`
          : visibleSections.map((section) => renderCollapsibleInspectorSection(state, section.key, section.label, section.body, section.summary)).join("")}
      </div>
    </div>
  `;
}

function renderCollapsibleInspectorSection(
  state: InspectorDrilldownState,
  key: InspectorSectionKey,
  title: string,
  body: string,
  summary?: string
): string {
  const expanded = state.expandedInspectorSections.has(key);

  return `
    <section class="inspector-section">
      <button
        class="inspector-section-toggle"
        data-action="toggle-inspector-section"
        data-inspector-section="${key}"
        type="button"
        aria-expanded="${expanded ? "true" : "false"}"
      >
        <span class="inspector-section-chevron">${expanded ? "▾" : "▸"}</span>
        <span class="inspector-section-heading">
          <span class="inspector-section-title">${escapeHtml(title)}</span>
          ${summary ? `<span class="inspector-section-summary">${escapeHtml(summary)}</span>` : ""}
        </span>
      </button>
      ${expanded ? `<div class="inspector-section-body">${body}</div>` : ""}
    </section>
  `;
}
