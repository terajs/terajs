export const overlaySignalsJournalInvestigationStyles = `

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
`;