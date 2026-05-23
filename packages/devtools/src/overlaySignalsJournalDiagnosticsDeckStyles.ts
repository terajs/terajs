export const overlaySignalsJournalDiagnosticsDeckStyles = `

  .devtools-utility-panel.diagnostics-deck {
    --diagnostics-accent: var(--tera-tone-accent-soft);
    --diagnostics-accent-strong: var(--tera-tone-accent);
    background: var(--tera-surface-page);
  }

  .devtools-utility-panel.diagnostics-deck--performance {
    --diagnostics-accent: var(--tera-tone-accent-soft);
    --diagnostics-accent-strong: var(--tera-tone-accent);
    background:
      radial-gradient(circle at top right, rgba(53, 198, 255, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(12, 22, 39, 0.96), rgba(8, 16, 29, 0.9));
  }

  .devtools-utility-panel.diagnostics-deck--sanity {
    --diagnostics-accent: var(--tera-tone-accent-soft);
    --diagnostics-accent-strong: var(--tera-tone-accent);
  }

  .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator);
  }

  .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-body {
    background: var(--tera-surface-page);
  }

  .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-header {
    background: rgba(14, 26, 45, 0.84);
    border-bottom-color: rgba(145, 173, 214, 0.14);
  }

  .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-body {
    background: linear-gradient(180deg, rgba(13, 24, 43, 0.86), rgba(9, 18, 33, 0.78));
  }

  .devtools-utility-panel.diagnostics-deck--performance .diagnostics-note {
    background: rgba(14, 26, 45, 0.68);
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-stack {
    gap: 16px;
  }
`;