import { escapeHtml } from "./inspector/shared.js";
import { renderHostControlsChrome, type HostControlsState } from "./areas/host/controls.js";
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

export function renderAppShell<TState extends AppShellState>(
  state: TState,
  tabs: readonly string[],
  renderPanel: (state: TState) => string,
  renderComponentDrilldownInspector: ShadowComponentsDrilldownRenderer<TState>
): string {
  const bodyMarkup = state.activeTab === "Components"
    ? renderShadowComponentsArea(state, tabs, renderTabRail, renderComponentDrilldownInspector)
    : renderStandardBody(state, tabs, renderPanel);

  return `
    <div class="devtools-shell">
      <div class="devtools-header">
        <div>
          <div class="devtools-title">Terajs DevTools</div>
          <div class="devtools-subtitle">Events: ${state.eventCount}</div>
        </div>
        <div class="devtools-header-actions">
          <button
            class="toolbar-button ${state.hostControlsOpen ? "is-active" : ""}"
            data-host-controls-toggle="true"
            aria-expanded="${state.hostControlsOpen ? "true" : "false"}"
            type="button"
          >Settings</button>
          <button class="toolbar-button" data-theme-toggle="true" type="button">${state.theme === "dark" ? "Light Theme" : "Dark Theme"}</button>
        </div>
      </div>
      ${renderHostControlsChrome(state)}
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
