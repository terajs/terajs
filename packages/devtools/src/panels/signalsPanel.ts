import { type DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderIframeComponentsScreen,
  renderWorkbenchIntroState,
  renderWorkbenchList,
  renderWorkbenchMetrics,
  type WorkbenchListItem,
} from "./iframeShells.js";
import {
  buildSignalWorkbenchModel,
  type SignalWorkbenchEntry,
  type SignalWorkbenchModel,
  type SignalWorkbenchViewMode,
} from "./runtimeWorkbenchModels.js";

interface SignalsStateLike {
  events: DevtoolsEventLike[];
  selectedSignalKey: string | null;
  signalSearchQuery?: string;
  signalViewMode?: SignalWorkbenchViewMode;
  expandedValuePaths: Set<string>;
}

export function renderSignalsPanel(state: SignalsStateLike): string {
  const searchQuery = state.signalSearchQuery ?? "";
  const viewMode = state.signalViewMode ?? "active";
  const model = buildSignalWorkbenchModel(state.events, state.selectedSignalKey, searchQuery, viewMode);
  const selected = model.selected;

  return renderIframeComponentsScreen({
    className: `signals-panel-screen signals-panel-screen--${viewMode}`,
    treeAriaLabel: "Signals navigator",
    treeToolbar: `
      <div class="signals-filter-stack">
        ${renderSignalsModeToolbar(model, viewMode)}
        ${renderSignalsSearchInput(searchQuery)}
      </div>
    `,
    treeBody: renderSignalsNavigator(model, selected, searchQuery, viewMode),
    detailAriaLabel: "Signal inspector",
    detailTitle: "Signal inspector",
    detailSubtitle: selected?.title ?? buildInspectorSubtitle(selected, viewMode),
    detailBody: selected
      ? renderSignalsInspector(state, selected)
      : renderSignalsEmptyState(model, viewMode, searchQuery),
  });
}

function renderSignalsModeToolbar(model: SignalWorkbenchModel, viewMode: SignalWorkbenchViewMode): string {
  return `
    <div class="workbench-filter-row signals-mode-row">
      <button
        class="workbench-filter-button ${viewMode === "active" ? "is-active" : ""}"
        type="button"
        data-signal-mode="active"
      >${escapeHtml(`Active values ${model.visibleRegistryCount}`)}</button>
      <button
        class="workbench-filter-button ${viewMode === "recent" ? "is-active" : ""}"
        type="button"
        data-signal-mode="recent"
      >${escapeHtml(`Recent updates ${model.visibleUpdateCount}`)}</button>
    </div>
  `;
}

function renderSignalsSearchInput(value: string): string {
  return `
    <label class="workbench-search">
      <input
        class="workbench-search-input"
        type="search"
        value="${escapeHtml(value)}"
        placeholder="Search signals, refs, or previews"
        data-signal-search="true"
      />
    </label>
  `;
}

function renderSignalsNavigator(
  model: SignalWorkbenchModel,
  selected: SignalWorkbenchEntry | null,
  searchQuery: string,
  viewMode: SignalWorkbenchViewMode,
): string {
  if (model.entries.length === 0) {
    return renderWorkbenchIntroState({
      title: searchQuery.trim().length > 0
        ? `No ${viewMode === "active" ? "active values" : "recent updates"} match this search.`
        : viewMode === "active"
          ? "No retained active values yet."
          : "No recent signal events yet.",
      description: searchQuery.trim().length > 0
        ? "Broaden the search or switch modes."
        : viewMode === "active"
          ? "Signals will appear here after the runtime retains them in the active registry."
          : "Signals will appear here after reactive updates are emitted by the runtime.",
      note: searchQuery.trim().length > 0 ? "Broaden the search or switch modes." : undefined,
    });
  }

  return renderWorkbenchList(model.entries.map((entry) => toSignalsWorkbenchListItem(entry, selected?.key ?? null)));
}

function toSignalsWorkbenchListItem(entry: SignalWorkbenchEntry, selectedKey: string | null): WorkbenchListItem {
  const badge = entry.group === "updates"
    ? "UPDATE"
    : entry.type
      ? entry.type.toUpperCase()
      : "SIGNAL";

  return {
    title: entry.title,
    summary: entry.summary || "No preview available",
    meta: entry.meta || (entry.group === "updates" ? "Live event" : "Retained registry slot"),
    badge,
    active: selectedKey === entry.key,
    attributes: {
      "data-signal-key": entry.key,
      "aria-pressed": selectedKey === entry.key ? "true" : "false",
    }
  };
}

function renderSignalsInspector(state: SignalsStateLike, selected: SignalWorkbenchEntry): string {
  return `
    <div class="signals-inspector-surface">
      <div class="devtools-value-surface signals-tree-surface">
        ${renderValueExplorer(selected.value, `signals.${selected.key}`, state.expandedValuePaths)}
      </div>
    </div>
  `;
}

function renderSignalsEmptyState(
  model: SignalWorkbenchModel,
  viewMode: SignalWorkbenchViewMode,
  searchQuery: string,
): string {
  return renderWorkbenchIntroState({
    title: "Choose one reactive value",
    description: searchQuery.trim().length > 0
      ? `Search is narrowing the rail to ${String(model.entries.length)} visible row${model.entries.length === 1 ? "" : "s"}.`
      : viewMode === "active"
        ? "Pick a retained value from the left rail."
        : "Pick a recent update from the left rail.",
    metrics: buildSignalMetrics(model),
    note: searchQuery.trim().length > 0
      ? `Search is narrowing the rail to ${String(model.entries.length)} visible row${model.entries.length === 1 ? "" : "s"}.`
      : undefined,
  });
}

function buildSignalMetrics(model: SignalWorkbenchModel) {
  return [
    { label: "Shown", value: String(model.entries.length) },
    { label: "Recent", value: String(model.visibleUpdateCount) },
    { label: "Active", value: String(model.visibleRegistryCount) },
    { label: "Effects", value: String(model.effectRuns) },
  ] as const;
}

function buildNavigatorSubtitle(model: SignalWorkbenchModel, viewMode: SignalWorkbenchViewMode): string {
  return viewMode === "active"
    ? `${model.entries.length} shown of ${model.registryCount} retained values`
    : `${model.entries.length} shown of ${model.updateCount} recent updates`;
}

function buildInspectorSubtitle(selected: SignalWorkbenchEntry | null, viewMode: SignalWorkbenchViewMode): string {
  if (!selected) {
    return viewMode === "active"
      ? "Pick one retained signal from the left rail."
      : "Pick one recent signal update from the left rail.";
  }

  return selected.summary || selected.meta || (selected.group === "updates" ? "Latest emitted value" : "Retained current value");
}