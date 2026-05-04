type OverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type OverlaySize = "normal" | "large" | "fullscreen";

import { renderDevtoolsButtonLabel, renderDevtoolsHeadingRow, renderDevtoolsTitleRow } from "../../devtoolsIcons.js";

export interface HostControlsState {
  hostControlsOpen: boolean;
  overlayPosition: OverlayPosition;
  overlayPanelSize: OverlaySize;
  persistOverlayPreferences: boolean;
  theme: "dark" | "light";
}

export function renderHostControlsChrome(state: HostControlsState): string {
  if (!state.hostControlsOpen) {
    return "";
  }

  const positionChoices: Array<{ value: OverlayPosition; label: string }> = [
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "center", label: "Center" }
  ];

  const panelSizes: Array<{ value: OverlaySize; label: string }> = [
    { value: "normal", label: "Normal" },
    { value: "large", label: "Wide" },
    { value: "fullscreen", label: "Full Screen" }
  ];

  return `
    <div class="devtools-host-controls-panel" aria-label="Workspace settings">
      <div class="devtools-host-controls-header">
        <div>
          ${renderDevtoolsTitleRow("Workspace Settings", "is-blue", "settings")}
          <div class="panel-subtitle">Layout, theme, and session controls.</div>
        </div>
        <button class="toolbar-button toolbar-button--compact" data-host-controls-toggle="true" aria-expanded="true" type="button">${renderDevtoolsButtonLabel("Close", "settings")}</button>
      </div>
      <div class="devtools-host-controls-scroll">
        <div class="devtools-host-controls-grid">
          <section class="devtools-host-controls-section">
            ${renderDevtoolsHeadingRow("Dock Position", "devtools-host-controls-title", "settings")}
            <div class="button-row devtools-host-controls-button-grid">
            ${positionChoices.map((choice) => `
              <button
                class="select-button select-button--compact ${state.overlayPosition === choice.value ? "is-selected" : ""}"
                data-layout-position="${choice.value}"
                type="button"
              >${choice.label}</button>
            `).join("")}
            </div>
          </section>
          <section class="devtools-host-controls-section">
            ${renderDevtoolsHeadingRow("Panel Size", "devtools-host-controls-title", "settings")}
            <div class="button-row devtools-host-controls-button-grid">
            ${panelSizes.map((choice) => `
              <button
                class="select-button select-button--compact ${state.overlayPanelSize === choice.value ? "is-selected" : ""}"
                data-layout-size="${choice.value}"
                type="button"
              >${choice.label}</button>
            `).join("")}
            </div>
          </section>
          <section class="devtools-host-controls-section">
            ${renderDevtoolsHeadingRow("Theme", "devtools-host-controls-title", "theme")}
            <div class="button-row devtools-host-controls-button-grid">
              <button class="toolbar-button toolbar-button--compact" data-theme-toggle="true" type="button">${renderDevtoolsButtonLabel(state.theme === "dark" ? "Switch to Light" : "Switch to Dark", "theme")}</button>
            </div>
          </section>
          <section class="devtools-host-controls-section">
            ${renderDevtoolsHeadingRow("Remember Layout", "devtools-host-controls-title", "settings")}
            <div class="button-row devtools-host-controls-button-grid">
            <button
              class="toolbar-button toolbar-button--compact ${state.persistOverlayPreferences ? "is-active" : ""}"
              data-layout-persist-toggle="true"
              type="button"
            >${renderDevtoolsButtonLabel(state.persistOverlayPreferences ? "Enabled" : "Disabled", "settings")}</button>
            </div>
          </section>
          <section class="devtools-host-controls-section">
            ${renderDevtoolsHeadingRow("Session Controls", "devtools-host-controls-title", "settings")}
            <div class="button-row devtools-host-controls-button-grid">
              <button class="toolbar-button toolbar-button--compact danger-button" data-clear-events="true" type="button">${renderDevtoolsButtonLabel("Clear All Events", "issues")}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;
}