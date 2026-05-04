import { overlayFabAndShellStyles } from "./overlayFabAndShellStyles.js";
import { overlayInnerWorkbenchStyles } from "./overlayInnerWorkbenchStyles.js";
import { overlayInspectorAndRuntimeStyles } from "./overlayInspectorAndRuntimeStyles.js";
import { overlayPanelAndContentStyles } from "./overlayPanelAndContentStyles.js";
import { overlaySignalsPanelStyles } from "./overlaySignalsPanelStyles.js";
import { overlayThemeAndScrollbarStyles } from "./overlayThemeAndScrollbarStyles.js";
import { overlayValueAndInteractiveStyles } from "./overlayValueAndInteractiveStyles.js";

export const overlayStyles = [
  overlayFabAndShellStyles,
  overlayPanelAndContentStyles,
  overlayInspectorAndRuntimeStyles,
  overlaySignalsPanelStyles,
  overlayValueAndInteractiveStyles,
  overlayThemeAndScrollbarStyles,
  overlayInnerWorkbenchStyles
].join("\n");
