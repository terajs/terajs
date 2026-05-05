import { overlayShellHostStyles } from "./overlayShellHostStyles.js";
import { overlayShellComponentsStyles } from "./overlayShellComponentsStyles.js";
import { overlayShellBrandStyles } from "./overlayShellBrandStyles.js";
import { overlayShellSidebarStyles } from "./overlayShellSidebarStyles.js";

export const overlayFabAndShellStyles = [
  overlayShellHostStyles,
  overlayShellComponentsStyles,
  overlayShellBrandStyles,
  overlayShellSidebarStyles,
].join("\n");