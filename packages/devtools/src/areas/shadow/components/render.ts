import {
  collectComponentDrilldown,
  type MountedComponentEntry
} from "../../../inspector/componentData.js";
import {
  buildComponentsPanelView,
  type ComponentsPanelViewState
} from "../../../inspector/componentsPanelView.js";
import { escapeHtml } from "../../../inspector/shared.js";
import { renderDevtoolsTitleRow } from "../../../devtoolsIcons.js";

export interface ShadowComponentsAreaState extends ComponentsPanelViewState {}

export type ShadowComponentsDrilldownRenderer<TState extends ShadowComponentsAreaState> = (
  state: TState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
) => string;

export interface ComponentsScrollSnapshot {
  treeTop: number;
  treeLeft: number;
  inspectorBodyTop: number;
  inspectorBodyLeft: number;
  inspectorSurfaceTop: number;
  inspectorSurfaceLeft: number;
}

export function renderShadowComponentsArea<TState extends ShadowComponentsAreaState>(
  state: TState,
  tabs: readonly string[],
  renderTabRail: (state: TState, tabs: readonly string[]) => string,
  renderComponentDrilldownInspector: ShadowComponentsDrilldownRenderer<TState>
): string {
  const view = buildComponentsPanelView(state, renderComponentDrilldownInspector);
  const inspectorSubtitle = view.hasSelection
    ? view.selectedLabel
    : "Select a component from the tree to inspect its state without shifting the layout.";
  const inspectorPlaceholder = view.hasSelection
    ? "Filter state..."
    : "Select a component to filter state";

  return `
    <div class="components-screen">
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
      <section class="components-screen-inspector" aria-label="Component inspector">
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              ${renderDevtoolsTitleRow("State Inspector", "is-cyan", "components")}
              <div class="panel-subtitle">${escapeHtml(inspectorSubtitle)}</div>
            </div>
            <input
              class="components-screen-filter"
              data-component-inspector-query="true"
              type="search"
              placeholder="${escapeHtml(inspectorPlaceholder)}"
              value="${escapeHtml(state.componentInspectorQuery)}"
              ${view.hasSelection ? "" : "disabled"}
            />
          </div>
        </div>
        <div class="components-screen-body">
          ${view.inspectorMarkup}
        </div>
      </section>
    </div>
  `;
}

export function patchShadowComponentsArea<TState extends ShadowComponentsAreaState>(options: {
  root: HTMLElement;
  state: TState;
  renderComponentDrilldownInspector: ShadowComponentsDrilldownRenderer<TState>;
  updateHeaderEventCount: () => void;
  renderFallback: () => void;
  refreshTree: boolean;
  refreshInspector: boolean;
}): void {
  const componentsScreen = options.root.querySelector<HTMLElement>(".components-screen");
  if (!componentsScreen) {
    options.renderFallback();
    return;
  }

  const scrollSnapshot = captureComponentsScrollPositions(options.root);
  const view = buildComponentsPanelView(options.state, options.renderComponentDrilldownInspector);
  options.updateHeaderEventCount();

  const inspectorPanel = options.root.querySelector<HTMLElement>(".components-screen-inspector");
  if (!inspectorPanel) {
    options.renderFallback();
    return;
  }

  const inspectorSubtitle = options.root.querySelector<HTMLElement>(".components-screen-inspector .panel-subtitle");
  if (inspectorSubtitle) {
    inspectorSubtitle.textContent = view.hasSelection
      ? view.selectedLabel
      : "Select a component from the tree to inspect its state without shifting the layout.";
  }

  const inspectorFilter = options.root.querySelector<HTMLInputElement>(".components-screen-inspector .components-screen-filter");
  if (inspectorFilter) {
    inspectorFilter.disabled = !view.hasSelection;
    inspectorFilter.placeholder = view.hasSelection ? "Filter state..." : "Select a component to filter state";
  }

  if (options.refreshTree) {
    const treeBody = options.root.querySelector<HTMLElement>(".components-screen-tree .components-screen-body");
    if (!treeBody) {
      options.renderFallback();
      return;
    }
    treeBody.innerHTML = view.treeMarkup;
  }

  if (options.refreshInspector) {
    const inspectorBody = options.root.querySelector<HTMLElement>(".components-screen-inspector .components-screen-body");
    if (!inspectorBody) {
      options.renderFallback();
      return;
    }
    inspectorBody.innerHTML = view.inspectorMarkup;
  }

  scheduleComponentsScrollRestore(options.root, scrollSnapshot);
}

export function captureComponentsScrollPositions(root: HTMLElement): ComponentsScrollSnapshot {
  const treeBody = root.querySelector<HTMLElement>(".components-screen-tree .components-screen-body");
  const inspectorBody = root.querySelector<HTMLElement>(".components-screen-inspector .components-screen-body");
  const inspectorSurface = root.querySelector<HTMLElement>(".components-screen-inspector .inspector-surface");

  return {
    treeTop: treeBody?.scrollTop ?? 0,
    treeLeft: treeBody?.scrollLeft ?? 0,
    inspectorBodyTop: inspectorBody?.scrollTop ?? 0,
    inspectorBodyLeft: inspectorBody?.scrollLeft ?? 0,
    inspectorSurfaceTop: inspectorSurface?.scrollTop ?? 0,
    inspectorSurfaceLeft: inspectorSurface?.scrollLeft ?? 0
  };
}

function restoreComponentsScrollPositions(root: HTMLElement, snapshot: ComponentsScrollSnapshot): void {
  const treeBody = root.querySelector<HTMLElement>(".components-screen-tree .components-screen-body");
  const inspectorBody = root.querySelector<HTMLElement>(".components-screen-inspector .components-screen-body");
  const inspectorSurface = root.querySelector<HTMLElement>(".components-screen-inspector .inspector-surface");

  if (treeBody) {
    treeBody.scrollTop = snapshot.treeTop;
    treeBody.scrollLeft = snapshot.treeLeft;
  }

  if (inspectorBody) {
    inspectorBody.scrollTop = snapshot.inspectorBodyTop;
    inspectorBody.scrollLeft = snapshot.inspectorBodyLeft;
  }

  if (inspectorSurface) {
    inspectorSurface.scrollTop = snapshot.inspectorSurfaceTop;
    inspectorSurface.scrollLeft = snapshot.inspectorSurfaceLeft;
  }
}

export function scheduleComponentsScrollRestore(root: HTMLElement, snapshot: ComponentsScrollSnapshot): void {
  restoreComponentsScrollPositions(root, snapshot);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      restoreComponentsScrollPositions(root, snapshot);
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoreComponentsScrollPositions(root, snapshot);
      });
    });
  }
}