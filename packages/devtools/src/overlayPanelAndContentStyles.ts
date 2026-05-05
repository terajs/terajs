import { overlayComponentPanelStyles } from "./overlayComponentPanelStyles.js";
import { overlayPanelShellStyles } from "./overlayPanelShellStyles.js";
import { overlaySidebarNavigationStyles } from "./overlaySidebarNavigationStyles.js";
import { overlayAIPanelStyles } from "./overlayAIPanelStyles.js";
import { overlayAIBridgeStyles } from "./overlayAIBridgeStyles.js";

export const overlayPanelAndContentStyles = [
  overlayComponentPanelStyles,
  overlayPanelShellStyles,
  overlaySidebarNavigationStyles,
  overlayAIPanelStyles,
  overlayAIBridgeStyles,
].join("\n");