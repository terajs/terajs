import {
  collectComponentDrilldown,
  type MountedComponentEntry
} from "./inspector/componentData.js";
import {
  buildComponentsPanelView,
  type ComponentsPanelViewState
} from "./inspector/componentsPanelView.js";
import { escapeHtml } from "./inspector/shared.js";

type AppShellState = ComponentsPanelViewState & {
  activeTab: string;
  eventCount: number;
  theme: "dark" | "light";
};

type DrilldownRenderer<TState extends AppShellState> = (
  state: TState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
) => string;

export function renderAppShell<TState extends AppShellState>(
  state: TState,
  tabs: readonly string[],
  renderPanel: (state: TState) => string,
  renderComponentDrilldownInspector: DrilldownRenderer<TState>
): string {
  const bodyMarkup = state.activeTab === "Components"
    ? renderComponentsScreen(state, tabs, renderComponentDrilldownInspector)
    : renderStandardBody(state, tabs, renderPanel);

  return `
    <div class="devtools-shell">
      <div class="devtools-header">
        <div>
          <div class="devtools-title">Terajs DevTools</div>
          <div class="devtools-subtitle">Events: ${state.eventCount}</div>
        </div>
        <button class="toolbar-button" data-theme-toggle="true">${state.theme === "dark" ? "Light Theme" : "Dark Theme"}</button>
      </div>
      ${bodyMarkup}
    </div>
  `;
}

function renderTabRail<TState extends AppShellState>(state: TState, tabs: readonly string[]): string {
  return `
    <div class="devtools-tabs">
      ${tabs.map((tab) => `
        <button class="tab-button ${state.activeTab === tab ? "is-active" : ""}" data-tab="${escapeHtml(tab)}">${escapeHtml(tab)}</button>
      `).join("")}
    </div>
  `;
}

function renderStandardBody<TState extends AppShellState>(state: TState, tabs: readonly string[], renderPanel: (state: TState) => string): string {
  return `
    <div class="devtools-body">
      ${renderTabRail(state, tabs)}
      <div class="devtools-panel">
        ${renderPanel(state)}
      </div>
    </div>
  `;
}

function renderComponentsScreen<TState extends AppShellState>(
  state: TState,
  tabs: readonly string[],
  renderComponentDrilldownInspector: DrilldownRenderer<TState>
): string {
  const view = buildComponentsPanelView(state, renderComponentDrilldownInspector);

  return `
    <div class="components-screen${view.hasSelection ? "" : " is-inspector-hidden"}">
      <aside class="components-screen-sidebar">
        ${renderTabRail(state, tabs)}
      </aside>
      <section class="components-screen-tree" aria-label="Components navigator">
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <input
              class="components-screen-search"
              data-component-search-query="true"
              type="search"
              placeholder="Find components..."
              value="${escapeHtml(state.componentSearchQuery)}"
            />
          </div>
        </div>
        <div class="components-screen-body">
          ${view.treeMarkup}
        </div>
      </section>
      ${view.hasSelection ? `
        <section class="components-screen-inspector" aria-label="Component inspector">
          <div class="components-screen-header">
            <div class="components-screen-header-row">
              <div>
                <div class="panel-title is-cyan">State Inspector</div>
                <div class="panel-subtitle">${escapeHtml(view.selectedLabel)}</div>
              </div>
              <input
                class="components-screen-filter"
                data-component-inspector-query="true"
                type="search"
                placeholder="Filter state..."
                value="${escapeHtml(state.componentInspectorQuery)}"
              />
            </div>
          </div>
          <div class="components-screen-body">
            ${view.inspectorMarkup}
          </div>
        </section>
      ` : ""}
    </div>
  `;
}
