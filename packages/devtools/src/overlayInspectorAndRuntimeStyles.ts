import { overlayAIDiagnosticsStyles } from "./overlayAIDiagnosticsStyles.js";
import { overlayRuntimeResultsStyles } from "./overlayRuntimeResultsStyles.js";
import { overlayTimelineSignalStyles } from "./overlayTimelineSignalStyles.js";
import { overlayComponentInspectorStyles } from "./overlayComponentInspectorStyles.js";

export const overlayInspectorAndRuntimeStyles = [
  overlayAIDiagnosticsStyles,
  overlayRuntimeResultsStyles,
  overlayTimelineSignalStyles,
  overlayComponentInspectorStyles,
].join("\n");