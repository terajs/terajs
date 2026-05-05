import { overlayWorkbenchBaseStyles } from "./overlayWorkbenchBaseStyles.js";
import { overlayWorkbenchDetailStyles } from "./overlayWorkbenchDetailStyles.js";
import { overlaySignalsJournalStyles } from "./overlaySignalsJournalStyles.js";
import { overlayDiagnosticsDeckStyles } from "./overlayDiagnosticsDeckStyles.js";
import { overlayWorkbenchLightStyles } from "./overlayWorkbenchLightStyles.js";
import { overlayWorkbenchDenseStyles } from "./overlayWorkbenchDenseStyles.js";
import { overlayWorkbenchResponsiveStyles } from "./overlayWorkbenchResponsiveStyles.js";

export const overlayInnerWorkbenchStyles = [
  overlayWorkbenchBaseStyles,
  overlayWorkbenchDetailStyles,
  overlaySignalsJournalStyles,
  overlayDiagnosticsDeckStyles,
  overlayWorkbenchLightStyles,
  overlayWorkbenchDenseStyles,
  overlayWorkbenchResponsiveStyles,
].join("\n");