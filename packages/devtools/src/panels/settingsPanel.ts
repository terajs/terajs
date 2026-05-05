import { renderPageSection, renderPageShell } from "./layout.js";

type OverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type OverlaySize = "normal" | "large" | "fullscreen";

interface SettingsStateLike {
  overlayPosition: OverlayPosition;
  overlayPanelSize: OverlaySize;
  persistOverlayPreferences: boolean;
}

export function renderSettingsPanel(state: SettingsStateLike): string {
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

  return renderPageShell({
    title: "Devtools Settings",
    accentClass: "is-blue",
    subtitle: "Layout, persistence, and session controls",
    pills: [`dock: ${state.overlayPosition}`, `size: ${state.overlayPanelSize}`],
    body: [
      renderPageSection("Overlay Position", `
        <div class="button-row">
          ${positionChoices.map((choice) => `
            <button
              class="select-button ${state.overlayPosition === choice.value ? "is-selected" : ""}"
              data-layout-position="${choice.value}"
              type="button"
            >${choice.label}</button>
          `).join("")}
        </div>
      `),
      renderPageSection("Panel Size", `
        <div class="button-row">
          ${panelSizes.map((choice) => `
            <button
              class="select-button ${state.overlayPanelSize === choice.value ? "is-selected" : ""}"
              data-layout-size="${choice.value}"
              type="button"
            >${choice.label}</button>
          `).join("")}
        </div>
      `),
      renderPageSection("Persist Preferences", `
        <div class="muted-text">Store position and size in local storage for the next session.</div>
        <div class="button-row">
          <button
            class="toolbar-button ${state.persistOverlayPreferences ? "is-active" : ""}"
            data-layout-persist-toggle="true"
            type="button"
          >${state.persistOverlayPreferences ? "Enabled" : "Disabled"}</button>
        </div>
      `),
      renderPageSection("Session Actions", `
        <div class="button-row">
          <button class="toolbar-button danger-button" data-clear-events="true">Clear All Events</button>
        </div>
      `)
    ].join("")
  });
}