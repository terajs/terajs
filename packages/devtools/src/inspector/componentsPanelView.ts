import { escapeHtml } from "./shared.js";
import {
  buildComponentTree,
  collectComponentDrilldown,
  collectExpandableTreeKeys,
  collectMountedComponents,
  expandSelectedTreePath,
  resolveSelectedComponent,
  type ComponentTreeNode,
  type MountedComponentEntry
} from "./componentData.js";
import type { DevtoolsEventLike } from "./dataCollectors.js";

export interface ComponentsPanelViewState {
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  componentTreeInitialized: boolean;
  componentTreeVersion: number;
  expandedComponentTreeVersion: number;
  expandedComponentNodeKeys: Set<string>;
  selectedComponentKey: string | null;
  selectedComponentActivityVersion: number;
  componentSearchQuery: string;
  componentInspectorQuery: string;
  expandedInspectorSections: Set<string>;
  expandedValuePaths: Set<string>;
  events: DevtoolsEventLike[];
}

export interface ComponentsPanelView {
  componentsCount: number;
  visibleCount: number;
  rootCount: number;
  hasSelection: boolean;
  selectedLabel: string;
  treeMarkup: string;
  inspectorMarkup: string;
}

interface CachedComponentsPanelViewState {
  componentTreeVersion: number;
  searchQuery: string;
  components: MountedComponentEntry[];
  visibleComponents: MountedComponentEntry[];
  tree: {
    roots: ComponentTreeNode[];
    parentByKey: Map<string, string>;
  };
  selectedComponentKey: string | null;
  selectedSearchQuery: string;
  selectedComponentTreeVersion: number;
  selected: MountedComponentEntry | null;
  treeMarkupKey: string;
  treeMarkup: string;
  drilldownKey: string | null;
  drilldownVersion: number;
  drilldown: ReturnType<typeof collectComponentDrilldown> | null;
}

const componentsPanelViewCache = new WeakMap<object, CachedComponentsPanelViewState>();

export function buildComponentsPanelView<TState extends ComponentsPanelViewState>(
  state: TState,
  renderComponentDrilldownInspector: (
    state: TState,
    selected: MountedComponentEntry,
    drilldown: ReturnType<typeof collectComponentDrilldown>
  ) => string
): ComponentsPanelView {
  const cache = getCachedComponentsPanelViewState(state);
  const searchQuery = state.componentSearchQuery.trim().toLowerCase();

  if (cache.componentTreeVersion !== state.componentTreeVersion || cache.searchQuery !== searchQuery) {
    const components = collectMountedComponents(state.mountedComponents);
    cache.componentTreeVersion = state.componentTreeVersion;
    cache.searchQuery = searchQuery;
    cache.components = components;
    cache.visibleComponents = searchQuery.length === 0
      ? components
      : components.filter((component) => {
        return component.scope.toLowerCase().includes(searchQuery)
          || component.key.toLowerCase().includes(searchQuery)
          || String(component.instance).includes(searchQuery);
      });
    cache.tree = buildComponentTree(cache.visibleComponents);
    cache.selectedComponentKey = null;
    cache.selected = null;
    cache.treeMarkupKey = "";
    cache.treeMarkup = "";
    cache.drilldownKey = null;
    cache.drilldown = null;
  }

  const components = cache.components;
  const visibleComponents = cache.visibleComponents;
  const tree = cache.tree;

  if (components.length === 0) {
    state.componentTreeInitialized = false;
  }

  if (!state.componentTreeInitialized && tree.roots.length > 0) {
    const expandableKeys = collectExpandableTreeKeys(tree.roots);
    for (const key of expandableKeys) {
      state.expandedComponentNodeKeys.add(key);
    }
    state.componentTreeInitialized = true;
  }

  if (
    cache.selectedComponentKey !== state.selectedComponentKey
    || cache.selectedSearchQuery !== searchQuery
    || cache.selectedComponentTreeVersion !== state.componentTreeVersion
  ) {
    cache.selectedComponentKey = state.selectedComponentKey;
    cache.selectedSearchQuery = searchQuery;
    cache.selectedComponentTreeVersion = state.componentTreeVersion;
    cache.selected = resolveSelectedComponent(visibleComponents, state.selectedComponentKey);
    cache.drilldownKey = null;
    cache.drilldown = null;
  }

  const selected = cache.selected;
  const hasSelection = state.selectedComponentKey !== null;
  const selectedKey = selected?.key ?? null;

  expandSelectedTreePath(state.expandedComponentNodeKeys, selectedKey, tree.parentByKey);

  const drilldown = resolveCachedDrilldown(state, cache, selected);

  const treeMarkupKey = [
    state.componentTreeVersion,
    state.expandedComponentTreeVersion,
    searchQuery,
    selectedKey ?? ""
  ].join("|");

  if (cache.treeMarkupKey !== treeMarkupKey) {
    cache.treeMarkupKey = treeMarkupKey;
    cache.treeMarkup = visibleComponents.length === 0
      ? `<div class="empty-state">${components.length === 0 ? "No components mounted." : "No components match the current filter."}</div>`
      : tree.roots.length === 0
      ? `<div class="empty-state">No component hierarchy available.</div>`
      : `
        <ul class="component-tree-list">
          ${renderComponentTree(tree.roots, selectedKey, state.expandedComponentNodeKeys)}
        </ul>
      `;
  }

  const treeMarkup = cache.treeMarkup;

  const inspectorMarkup = !selected || !drilldown
    ? `<div class="empty-state">${visibleComponents.length === 0 ? "Adjust the component filter to continue." : "Select a component to inspect its state drill-down."}</div>`
    : renderComponentDrilldownInspector(state, selected, drilldown);

  return {
    componentsCount: components.length,
    visibleCount: visibleComponents.length,
    rootCount: tree.roots.length,
    hasSelection,
    selectedLabel: selected ? `<${selected.scope}>` : hasSelection ? "Selection unavailable" : "",
    treeMarkup,
    inspectorMarkup
  };
}

function getCachedComponentsPanelViewState(state: object): CachedComponentsPanelViewState {
  const existing = componentsPanelViewCache.get(state);
  if (existing) {
    return existing;
  }

  const created: CachedComponentsPanelViewState = {
    componentTreeVersion: -1,
    searchQuery: "",
    components: [],
    visibleComponents: [],
    tree: {
      roots: [],
      parentByKey: new Map<string, string>()
    },
    selectedComponentKey: null,
    selectedSearchQuery: "",
    selectedComponentTreeVersion: -1,
    selected: null,
    treeMarkupKey: "",
    treeMarkup: "",
    drilldownKey: null,
    drilldownVersion: -1,
    drilldown: null
  };

  componentsPanelViewCache.set(state, created);
  return created;
}

function resolveCachedDrilldown<TState extends ComponentsPanelViewState>(
  state: TState,
  cache: CachedComponentsPanelViewState,
  selected: MountedComponentEntry | null
): ReturnType<typeof collectComponentDrilldown> | null {
  if (!selected) {
    cache.drilldownKey = null;
    cache.drilldown = null;
    cache.drilldownVersion = -1;
    return null;
  }

  if (state.selectedComponentKey === null) {
    return collectComponentDrilldown(state.events, selected.scope, selected.instance);
  }

  if (cache.drilldownKey !== selected.key || cache.drilldownVersion !== state.selectedComponentActivityVersion) {
    cache.drilldownKey = selected.key;
    cache.drilldownVersion = state.selectedComponentActivityVersion;
    cache.drilldown = collectComponentDrilldown(state.events, selected.scope, selected.instance);
  }

  return cache.drilldown;
}

function renderComponentTree(
  nodes: ComponentTreeNode[],
  selectedComponentKey: string | null,
  expandedKeys: Set<string>,
  ancestorHasNext: boolean[] = []
): string {
  return nodes.map((node, index) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = hasChildren && expandedKeys.has(node.component.key);
    const isSelected = selectedComponentKey === node.component.key;
    const hasNextSibling = index < nodes.length - 1;
    const branchClass = ancestorHasNext.length === 0
      ? "is-root"
      : hasNextSibling
        ? "is-branching"
        : "is-terminal";
    const nodeClasses = ["component-tree-node"];
    if (hasChildren) {
      nodeClasses.push("has-children");
    }
    if (isExpanded) {
      nodeClasses.push("is-expanded");
    }

    const guides = ancestorHasNext.map((hasNext) => `
      <span class="tree-indent-guide ${hasNext ? "is-continuing" : ""}"></span>
    `).join("");

    return `
      <li class="${nodeClasses.join(" ")}" style="--component-tree-depth:${ancestorHasNext.length};">
        <div class="component-tree-row" data-tree-depth="${ancestorHasNext.length}">
          <span class="component-tree-guides">${guides}</span>
          <span class="component-tree-branch ${branchClass}" aria-hidden="true"></span>
          ${hasChildren ? `
            <button
              class="component-tree-toggle"
              data-action="toggle-component-node"
              data-tree-node-key="${escapeHtml(node.component.key)}"
              aria-label="${isExpanded ? "Collapse" : "Expand"} ${escapeHtml(node.component.scope)}"
            ><span class="component-tree-chevron" aria-hidden="true">${isExpanded ? "▾" : "▸"}</span></button>
          ` : `<span class="component-tree-toggle is-placeholder" aria-hidden="true"></span>`}
          <button
            class="component-tree-select ${isSelected ? "is-active" : ""}"
            data-component-key="${escapeHtml(node.component.key)}"
            data-component-scope="${escapeHtml(node.component.scope)}"
            data-component-instance="${node.component.instance}"
          >
            <span class="component-tree-content">
              <span class="component-tree-label-row">
                <span class="component-tree-label"><span class="component-tree-label-bracket">&lt;</span><span class="component-tree-label-name">${escapeHtml(node.component.scope)}</span><span class="component-tree-label-bracket"> /&gt;</span></span>
              </span>
              ${hasChildren ? `<span class="component-tree-meta">${node.children.length} child${node.children.length === 1 ? "" : "ren"}</span>` : ""}
            </span>
          </button>
        </div>
        ${node.component.aiPreview ? `<div class="muted-text ai-hint component-ai-hint">AI: ${escapeHtml(node.component.aiPreview)}</div>` : ""}
        ${hasChildren && isExpanded ? `
          <ul class="component-tree-list component-tree-children">
            ${renderComponentTree(node.children, selectedComponentKey, expandedKeys, [...ancestorHasNext, hasNextSibling])}
          </ul>
        ` : ""}
      </li>
    `;
  }).join("");
}
