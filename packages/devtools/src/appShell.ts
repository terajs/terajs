import { escapeHtml } from "./inspector/shared.js";
import { renderHostControlsChrome, type HostControlsState } from "./areas/host/controls.js";
import type { DevtoolsAreaHostKind } from "./areas/registry.js";
import type { DevtoolsIconName } from "./devtoolsIcons.js";
import { renderDevtoolsIcon, renderDevtoolsTabLabel } from "./devtoolsIcons.js";
import {
  renderShadowComponentsArea,
  type ShadowComponentsAreaState,
  type ShadowComponentsDrilldownRenderer
} from "./areas/shadow/components/render.js";

type AppShellState = ShadowComponentsAreaState & HostControlsState & {
  activeTab: string;
  eventCount: number;
  theme: "dark" | "light";
};

function displayTabLabel(tab: string): string {
  if (tab === "AI Diagnostics") {
    return "Bridge";
  }

  if (tab === "Sanity Check") {
    return "Sanity";
  }

  return tab;
}

function displayTabTitle(tab: string): string {
  if (tab === "AI Diagnostics") {
    return "Bridge";
  }

  return tab;
}

function resolveTabIconName(tab: string): DevtoolsIconName | undefined {
  if (tab === "AI Diagnostics") {
    return "ai";
  }

  return undefined;
}

export function renderAppShell<TState extends AppShellState>(
  state: TState,
  tabs: readonly string[],
  renderPanel: (state: TState) => string,
  renderComponentDrilldownInspector: ShadowComponentsDrilldownRenderer<TState>,
  standardPanelHostKind: DevtoolsAreaHostKind
): string {
  const bodyMarkup = state.activeTab === "Components"
    ? renderComponentsBody(state, tabs, renderComponentDrilldownInspector)
    : renderStandardBody(state, tabs, renderPanel, standardPanelHostKind);

  return `
    <div class="devtools-shell">
      <div class="devtools-header">
        <div class="devtools-brand">
          <div class="devtools-brand-copy">
            <div class="devtools-brand-heading">
              <div class="devtools-title">Tera Lens</div>
            </div>
            <div class="devtools-subtitle">Events: ${state.eventCount}</div>
          </div>
        </div>
        <div class="devtools-header-center">
          <div class="devtools-active-view">${escapeHtml(displayTabLabel(state.activeTab))}</div>
        </div>
        <div class="devtools-header-actions">
          ${renderHeaderControls(state)}
        </div>
      </div>
      <div class="devtools-shell-stage">
        ${bodyMarkup}
        ${renderHostControlsChrome(state)}
      </div>
    </div>
  `;
}

function renderHeaderControls<TState extends AppShellState>(state: TState): string {
  const wideTarget = state.overlayPanelSize === "large" ? "normal" : "large";
  const fullscreenTarget = state.overlayPanelSize === "fullscreen" ? "normal" : "fullscreen";

  return `
        <div class="devtools-window-controls" aria-label="Window controls">
          <button
            class="toolbar-button toolbar-button--icon-only toolbar-button--window-control"
            data-shell-action="minimize"
            data-window-control="minimize"
            type="button"
            aria-label="Minimize Tera Lens"
            title="Minimize"
          >${renderDevtoolsIcon("minimize", "devtools-icon--md")}</button>
          <button
            class="toolbar-button toolbar-button--icon-only toolbar-button--window-control ${state.overlayPanelSize === "large" ? "is-active" : ""}"
            data-layout-size="${wideTarget}"
            data-window-control="wide"
            type="button"
            aria-label="${state.overlayPanelSize === "large" ? "Restore standard width" : "Widen panel"}"
            title="${state.overlayPanelSize === "large" ? "Restore width" : "Wide"}"
          >${renderDevtoolsIcon(state.overlayPanelSize === "large" ? "restore" : "maximize", "devtools-icon--md")}</button>
          <button
            class="toolbar-button toolbar-button--icon-only toolbar-button--window-control ${state.overlayPanelSize === "fullscreen" ? "is-active" : ""}"
            data-layout-size="${fullscreenTarget}"
            data-window-control="fullscreen"
            type="button"
            aria-label="${state.overlayPanelSize === "fullscreen" ? "Exit fullscreen panel" : "Expand panel to fullscreen"}"
            title="${state.overlayPanelSize === "fullscreen" ? "Exit fullscreen" : "Fullscreen"}"
          >${renderDevtoolsIcon(state.overlayPanelSize === "fullscreen" ? "restore" : "fullscreen", "devtools-icon--md")}</button>
          <button
            class="toolbar-button toolbar-button--icon-only toolbar-button--window-control ${state.hostControlsOpen ? "is-active" : ""}"
            data-host-controls-toggle="true"
            aria-expanded="${state.hostControlsOpen ? "true" : "false"}"
            aria-label="${state.hostControlsOpen ? "Close workspace settings" : "Open workspace settings"}"
            title="${state.hostControlsOpen ? "Close settings" : "Settings"}"
            type="button"
            data-window-control="settings"
          >${renderDevtoolsIcon("settings", "devtools-icon--md")}</button>
        </div>
  `;
}

function renderTabRail<TState extends AppShellState>(state: TState, tabs: readonly string[]): string {
  return `
    <div class="devtools-tabs">
      ${tabs.map((tab) => `
        <button
          class="tab-button ${state.activeTab === tab ? "is-active" : ""}"
          data-tab="${escapeHtml(tab)}"
          type="button"
          title="${escapeHtml(displayTabTitle(tab))}"
          aria-label="${escapeHtml(displayTabTitle(tab))}"
        >${renderDevtoolsTabLabel(tab, displayTabLabel(tab), resolveTabIconName(tab))}</button>
      `).join("")}
    </div>
  `;
}

function renderComponentsBody<TState extends AppShellState>(
  state: TState,
  tabs: readonly string[],
  renderComponentDrilldownInspector: ShadowComponentsDrilldownRenderer<TState>
): string {
  return `
    <div class="devtools-body">
      <section class="devtools-canvas devtools-canvas--components">
        ${renderWorkbenchShell(
          state,
          () => renderShadowComponentsArea(state, tabs, renderTabRail, renderComponentDrilldownInspector),
          "shadow"
        )}
      </section>
    </div>
  `;
}

function renderStandardBody<TState extends AppShellState>(
  state: TState,
  tabs: readonly string[],
  renderPanel: (state: TState) => string,
  panelHostKind: DevtoolsAreaHostKind
): string {
  return `
    <div class="devtools-body">
      <aside class="devtools-sidebar" aria-label="DevTools navigation">
        <div class="devtools-sidebar-frame">
          ${renderTabRail(state, tabs)}
        </div>
      </aside>
      <section class="devtools-canvas">
        ${renderWorkbenchShell(state, renderPanel, panelHostKind)}
      </section>
    </div>
  `;
}

function renderWorkbenchShell<TState extends AppShellState>(
  _state: TState,
  renderPanel: (state: TState) => string,
  panelHostKind: DevtoolsAreaHostKind
): string {
  return `
    <div class="devtools-panel-shell">
      <div class="devtools-panel devtools-panel--${panelHostKind}">
        ${renderPanel(_state)}
      </div>
    </div>
  `;
}
