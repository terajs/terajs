import { overlaySignalsJournalDiagnosticsDeckStyles } from "./overlaySignalsJournalDiagnosticsDeckStyles.js";
import { overlaySignalsJournalInvestigationStyles } from "./overlaySignalsJournalInvestigationStyles.js";
import { overlaySignalsJournalSignalStyles } from "./overlaySignalsJournalSignalStyles.js";

export const overlaySignalsJournalStyles = [
  overlaySignalsJournalSignalStyles,
  overlaySignalsJournalInvestigationStyles,
  overlaySignalsJournalDiagnosticsDeckStyles,
].join("\n");