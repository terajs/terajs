import {
  clearPersistedOverlayPreferences,
  isOverlayPosition,
  isOverlaySize,
  savePersistedOverlayPreferences,
  type NormalizedOverlayOptions,
  type OverlayPreferencesPayload
} from "./overlayOptions.js";
import { applyOverlayPanelSize, applyOverlayPosition } from "./overlayHost.js";

const DEVTOOLS_LAYOUT_PREFERENCES_EVENT = "terajs:devtools:layout-preferences";

export interface OverlayLayoutPreferencesBridgeOptions {
  overlayElement(): HTMLDivElement | null;
  readOptions(): NormalizedOverlayOptions;
}

export function mountOverlayLayoutPreferencesBridge(
  options: OverlayLayoutPreferencesBridgeOptions
): (() => void) | null {
  if (typeof window === "undefined") {
    return null;
  }

  const listener: EventListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as OverlayPreferencesPayload;
    const activeOptions = options.readOptions();
    let layoutChanged = false;
    let persistenceChanged = false;

    if (typeof payload.persistPreferences === "boolean" && payload.persistPreferences !== activeOptions.persistPreferences) {
      activeOptions.persistPreferences = payload.persistPreferences;
      persistenceChanged = true;
    }

    if (isOverlayPosition(payload.position) && payload.position !== activeOptions.position) {
      activeOptions.position = payload.position;
      applyOverlayPosition(options.overlayElement(), activeOptions.position);
      layoutChanged = true;
    }

    if (isOverlaySize(payload.panelSize) && payload.panelSize !== activeOptions.panelSize) {
      activeOptions.panelSize = payload.panelSize;
      applyOverlayPanelSize(options.overlayElement(), activeOptions.panelSize);
      layoutChanged = true;
    }

    if (!layoutChanged && !persistenceChanged) {
      return;
    }

    if (activeOptions.persistPreferences) {
      savePersistedOverlayPreferences(activeOptions);
      return;
    }

    if (persistenceChanged) {
      clearPersistedOverlayPreferences();
    }
  };

  window.addEventListener(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, listener);

  return () => {
    window.removeEventListener(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, listener);
  };
}