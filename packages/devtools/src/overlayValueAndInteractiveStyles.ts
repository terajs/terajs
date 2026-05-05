import { overlayRuntimeHistoryStyles } from "./overlayRuntimeHistoryStyles.js";
import { overlayValueTreeStyles } from "./overlayValueTreeStyles.js";
import { overlayStructuredValueStyles } from "./overlayStructuredValueStyles.js";

export const overlayValueAndInteractiveStyles = [
  overlayRuntimeHistoryStyles,
  overlayValueTreeStyles,
  overlayStructuredValueStyles,
].join("\n");