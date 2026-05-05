import type { SafeDocumentContext } from "../documentContext.js";
import { collectMetaEntries, type DevtoolsEventLike } from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderValueExplorer } from "../inspector/valueExplorer.js";
import {
  renderIframeComponentsScreen,
  renderWorkbenchFacts,
  renderWorkbenchIntroState,
  renderWorkbenchList,
  renderWorkbenchMetrics,
} from "./iframeShells.js";
import { buildMetaPanelItems, findSelectedMetaPanelItem, type MetaPanelItem } from "./metaPanelItems.js";

interface MetaStateLike {
  events: DevtoolsEventLike[];
  selectedMetaKey: string | null;
  metaSearchQuery?: string;
  expandedValuePaths: Set<string>;
}

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

function renderWorkbenchSearchInput(value: string, placeholder: string, dataAttribute: string): string {
  return `
    <label class="workbench-search">
      <input class="workbench-search-input" type="search" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${dataAttribute} />
    </label>
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

function buildMetaMetrics(items: readonly MetaPanelItem[]) {
  const componentCount = items.filter((item) => item.groupLabel === "Components").length;
  const routeCount = items.filter((item) => item.groupLabel === "Route metadata").length;
  const aiCount = items.filter((item) => item.groupLabel === "AI snapshots").length;
  const docCount = items.filter((item) => item.groupLabel === "Document head").length;

  return [
    { label: "Surfaces", value: String(items.length) },
    { label: "Route", value: String(routeCount), tone: routeCount > 0 ? "accent" : "neutral" },
    { label: "Components", value: String(componentCount), tone: componentCount > 0 ? "accent" : "neutral" },
    { label: "AI", value: String(aiCount), tone: aiCount > 0 ? "accent" : "neutral" },
    { label: "Head", value: String(docCount), tone: docCount > 0 ? "accent" : "neutral" },
  ] as const;
}

function formatMetaSurfaceLabel(item: MetaPanelItem): string {
  if (item.groupLabel === "Route metadata") {
    return "Route";
  }

  if (item.groupLabel === "Document head") {
    return "Head";
  }

  if (item.groupLabel === "AI snapshots") {
    return "AI";
  }

  return "Component";
}

function renderSelectedDataStage(content: string): string {
  return `<div class="devtools-value-surface">${content}</div>`;
}