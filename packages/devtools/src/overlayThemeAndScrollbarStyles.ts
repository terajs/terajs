import { overlayResponsiveThemeStyles } from "./overlayResponsiveThemeStyles.js";
import { overlaySurfaceUtilityStyles } from "./overlaySurfaceUtilityStyles.js";
import { overlayScrollbarStyles } from "./overlayScrollbarStyles.js";

export const overlayThemeAndScrollbarStyles = [
  overlayResponsiveThemeStyles,
  overlaySurfaceUtilityStyles,
  overlayScrollbarStyles,
].join("\n");