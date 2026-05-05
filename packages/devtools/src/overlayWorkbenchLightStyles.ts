export const overlayWorkbenchLightStyles = `

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-error {
    border-color: rgba(206, 76, 119, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-accent {
    border-color: rgba(15, 141, 119, 0.22);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-accent .devtools-workbench-metric-value {
    color: var(--tera-light-mint-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-warn .devtools-workbench-metric-value {
    color: var(--tera-light-amber-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-error .devtools-workbench-metric-value {
    color: var(--tera-light-red-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-step::before {
    background: var(--tera-surface-row-active);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-note {
    border-top-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-section-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-label {
    background: var(--tera-surface-row-active);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-toggle::after,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-subtitle {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-value-surface {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-section-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench .iframe-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel .iframe-panel-section-block {
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-filter-button {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-section);
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-search-input {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-raised);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-search-input::placeholder {
    color: rgba(76, 101, 138, 0.58);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-search-input:focus {
    border-color: var(--tera-tone-accent);
    background: var(--tera-surface-pane);
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .workbench-filter-button:hover {
    background: var(--tera-surface-row-hover);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-filter-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent-soft);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.signals-inspector-panel {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .signals-mode-row .workbench-filter-button {
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: var(--tera-tone-accent-soft);
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent);
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item::after {
    color: rgba(76, 101, 138, 0.48);
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item.is-active::after {
    color: rgba(41, 82, 168, 0.88);
  }

  #terajs-devtools-root[data-theme="light"] .signals-selection-note {
    border-color: var(--tera-tone-accent-soft);
    background: var(--tera-surface-section-strong);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.investigation-journal {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.investigation-journal .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.investigation-journal .devtools-utility-panel-body {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-hero {
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-kicker,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-subtitle {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-hero-title,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-feed,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-detail {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-header {
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item {
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item:hover {
    border-color: transparent;
    background: var(--tera-surface-row-hover);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item-badge {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .iframe-panel-section-block {
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance {
    background:
      radial-gradient(circle at top right, rgba(63, 124, 255, 0.06), transparent 26%),
      var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-body {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-body {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-deck-hero {
    background: transparent;
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance .diagnostics-note {
    background: var(--tera-surface-section-strong);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item {
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-title,
  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-badge {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-summary,
  #terajs-devtools-root[data-theme="light"] .diagnostics-note {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-note {
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel {
    background:
      radial-gradient(circle at top right, rgba(73, 126, 255, 0.08), transparent 24%),
      var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-header {
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-list-item {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-list-item:hover {
    border-color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-list-item-badge {
    color: var(--tera-light-text-strong);
  }

  .devtools-workbench,
  .devtools-utility-panel,
  .devtools-workbench.investigation-panel,
  .devtools-utility-panel.diagnostics-deck {
    background: var(--tera-surface-page);
  }

  .devtools-workbench {
    gap: 0;
  }

  .devtools-workbench-sidebar,
  .devtools-workbench-main,
  .devtools-utility-panel {
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    box-shadow: none;
  }

  .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator-strong);
  }

  .devtools-workbench-main,
  .devtools-utility-panel,
  .investigation-journal-detail {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-utility-panel.diagnostics-deck--router,
  .devtools-utility-panel.diagnostics-deck--sanity {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-workbench-header,
  .devtools-utility-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 12px;
    background: var(--tera-surface-pane-strong);
    border-bottom: 1px solid var(--tera-separator-strong);
  }
`;