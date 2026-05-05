export const overlaySignalsJournalStyles = `

  .signals-layout .devtools-workbench-list-item {
    position: relative;
    gap: 8px;
    padding: 12px 34px 12px 13px;
    border-color: #233752;
    border-radius: 14px;
    background: #0b1627;
  }

  .signals-layout .devtools-workbench-list-item::after {
    content: "›";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(150, 179, 232, 0.54);
    font-size: 17px;
    line-height: 1;
  }

  .signals-layout .devtools-workbench-list-item:hover {
    background: #152238;
    border-color: #4e85ff;
  }

  .signals-layout .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, #223657, #152238);
    border-color: #4e85ff;
    box-shadow: none;
  }

  .signals-layout .devtools-workbench-list-item.is-active::after {
    color: rgba(223, 239, 255, 0.84);
  }

  .signals-layout .signals-detail-value {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    height: 100%;
  }

  .signals-layout .signals-detail-stage {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .signals-layout .signals-detail-stage .structured-value-viewer,
  .signals-layout .signals-detail-stage .inspector-code {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
  }

  .signals-selection-note {
    padding: 10px 12px;
    border: 1px solid #4e85ff;
    border-radius: 12px;
    background: #12213a;
    color: rgba(213, 228, 255, 0.82);
    font-size: 12px;
    line-height: 1.55;
  }

  .devtools-utility-panel.investigation-journal {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
    background: var(--tera-surface-page);
  }

  .devtools-utility-panel.investigation-journal--issues {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
  }

  .devtools-utility-panel.investigation-journal--queue {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
  }

  .devtools-utility-panel.investigation-journal .devtools-utility-panel-header {
    background: linear-gradient(180deg, #0e192b, #0b1524);
    border-bottom-color: var(--investigation-accent);
  }

  .devtools-utility-panel.investigation-journal .devtools-utility-panel-body {
    padding: 0 16px 20px;
    background: #091423;
    overflow: hidden;
  }

  .investigation-journal-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 12px;
    align-content: start;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }

  .investigation-journal-hero {
    display: grid;
    gap: 8px;
    padding: 12px 0 10px;
    background: #091423;
  }

  .investigation-journal-kicker {
    color: rgba(147, 167, 203, 0.76);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .investigation-journal-hero-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .investigation-journal-toolbar {
    display: grid;
    gap: 8px;
  }

  .investigation-journal-toolbar .workbench-search-input {
    height: 42px;
    border-radius: 14px;
    background: #101a2c;
  }

  .investigation-journal-grid {
    display: grid;
    grid-template-columns: minmax(220px, 272px) minmax(0, 1fr);
    gap: 0;
    align-items: stretch;
    min-height: 0;
  }

  .investigation-journal-feed,
  .investigation-journal-detail {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 14px;
    padding: 18px;
    border: 1px solid #263753;
    border-radius: 0;
    background: #0d1626;
    box-shadow: none;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .investigation-journal-detail {
    gap: 18px;
    min-height: 560px;
    padding: 22px 24px;
    background: #0a1526;
  }

  .investigation-journal-section-header {
    display: grid;
    gap: 4px;
    padding-top: 2px;
    padding-bottom: 2px;
    border-bottom: 1px solid #243752;
  }

  .investigation-journal-section-title {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .investigation-journal-section-subtitle {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.5;
  }

  .investigation-journal .devtools-workbench-list {
    gap: 8px;
  }

  .investigation-journal .devtools-workbench-list-group {
    padding: 0 4px;
    color: rgba(147, 167, 203, 0.84);
  }

  .investigation-journal .devtools-workbench-list-item {
    padding: 10px 12px 10px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
  }

  .investigation-journal .devtools-workbench-list-item-title {
    font-size: 13px;
  }

  .investigation-journal .devtools-workbench-lead {
    max-width: 64ch;
  }

  .investigation-journal .devtools-workbench-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 22px;
  }

  .investigation-journal .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  .investigation-journal .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--investigation-accent-strong);
  }

  .investigation-journal .devtools-workbench-list-item-badge {
    background: transparent;
    color: rgba(147, 167, 203, 0.78);
  }

  .investigation-journal .iframe-panel-stack {
    gap: 14px;
  }

  .investigation-journal .iframe-panel-section-block {
    gap: 10px;
    padding: 0 0 14px;
    border: 0;
    border-bottom: 1px solid #243752;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .investigation-journal .iframe-panel-section-block:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .investigation-journal .iframe-panel-section-heading {
    color: var(--tera-cloud);
  }

  .investigation-journal .workbench-filter-button.is-active,
  .investigation-journal .devtools-workbench-metric.is-accent {
    border-color: var(--investigation-accent-strong);
    background: var(--investigation-accent);
  }

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