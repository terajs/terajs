export const overlayWorkbenchDenseStyles = `

  .devtools-workbench-title {
    font-size: 14px;
  }

  .devtools-workbench-subtitle {
    font-size: 11px;
    letter-spacing: 0.01em;
    text-transform: none;
  }

  .devtools-workbench-title.is-blue,
  .devtools-workbench-title.is-cyan,
  .devtools-workbench-title.is-purple,
  .devtools-workbench-title.is-green,
  .devtools-workbench-title.is-amber,
  .devtools-workbench-title.is-red,
  .devtools-workbench-intro-title.is-blue,
  .devtools-workbench-intro-title.is-cyan,
  .devtools-workbench-intro-title.is-purple,
  .devtools-workbench-intro-title.is-green,
  .devtools-workbench-intro-title.is-amber,
  .devtools-workbench-intro-title.is-red,
  .investigation-journal-section-title.is-blue,
  .investigation-journal-section-title.is-cyan,
  .investigation-journal-section-title.is-purple,
  .investigation-journal-section-title.is-green,
  .investigation-journal-section-title.is-amber,
  .investigation-journal-section-title.is-red,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-cyan,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-purple,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-green,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-amber,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-red,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-cyan,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-purple,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-green,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-amber,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-red,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-cyan,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-purple,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-green,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-amber,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-red {
    color: var(--tera-title-ink);
  }

  .devtools-utility-panel-header-main {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .devtools-utility-panel-toolbar {
    display: grid;
    gap: 6px;
    flex: 1 1 340px;
    justify-items: end;
    min-width: 0;
  }

  .devtools-utility-panel-toolbar > * {
    width: min(100%, 560px);
  }

  .devtools-workbench-toolbar {
    gap: 8px;
  }

  .workbench-search-input {
    height: 36px;
    border-radius: 12px;
    background: var(--tera-surface-raised);
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body,
  .devtools-utility-panel-body {
    padding: 12px;
  }

  .devtools-utility-panel.diagnostics-deck--router .devtools-utility-panel-body,
  .devtools-utility-panel.diagnostics-deck--sanity .devtools-utility-panel-body {
    background: transparent;
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body,
  .investigation-journal-feed,
  .investigation-journal-detail,
  .devtools-utility-panel-body {
    scrollbar-width: thin;
  }

  .devtools-workbench-list {
    gap: 0;
  }

  .devtools-workbench-list-group {
    padding: 10px 0 4px;
  }

  .devtools-workbench-list-item {
    position: relative;
    gap: 6px;
    min-height: 40px;
    padding: 9px 10px 9px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
  }

  .devtools-workbench-list-item::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 999px;
    background: var(--tera-separator-strong);
    opacity: 0;
    transition: opacity 140ms ease, background 140ms ease;
  }

  .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  .devtools-workbench-list-item:hover::before {
    background: var(--tera-tone-accent-soft);
    opacity: 1;
  }

  .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  .devtools-workbench-list-item.is-active::before {
    background: var(--tera-tone-accent);
    opacity: 1;
  }

  .ai-panel-screen .devtools-workbench-list-item:hover {
    background: rgba(79, 166, 255, 0.12);
  }

  .ai-panel-screen .devtools-workbench-list-item:hover::before {
    background: rgba(127, 214, 255, 0.78);
  }

  .ai-panel-screen .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(74, 143, 240, 0.28), rgba(19, 39, 72, 0.5));
    box-shadow: inset 3px 0 0 #7fd6ff;
  }

  .ai-panel-screen .devtools-workbench-list-item.is-active::before {
    background: #7fd6ff;
  }

  .devtools-workbench-list-item.is-warn {
    border-color: transparent;
  }

  .devtools-workbench-list-item.is-warn::before {
    background: var(--tera-tone-warn);
    opacity: 0.82;
  }

  .devtools-workbench-list-item.is-error {
    border-color: transparent;
  }

  .devtools-workbench-list-item.is-error::before {
    background: var(--tera-tone-error);
    opacity: 0.82;
  }

  .devtools-workbench-list-item-badge {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: rgba(147, 167, 203, 0.72);
    font-weight: 700;
  }

  .devtools-workbench-list-item.is-warn .devtools-workbench-list-item-badge {
    color: var(--tera-tone-warn);
  }

  .devtools-workbench-list-item.is-error .devtools-workbench-list-item-badge {
    color: var(--tera-tone-error);
  }

  .devtools-workbench-intro {
    gap: 10px;
    padding: 2px 0 2px 16px;
    border: 0;
    border-left: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent-soft);
  }

  .devtools-workbench-note {
    padding-top: 10px;
    border-top: 1px solid var(--tera-separator);
  }

  .devtools-workbench-metrics {
    gap: 8px;
  }

  .devtools-workbench-metric {
    min-height: 0;
    padding: 8px 0 8px 16px;
    border: 0;
    border-left: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-separator-strong);
  }

  .devtools-workbench-metric.is-warn {
    box-shadow: inset 3px 0 0 var(--tera-tone-warn);
  }

  .devtools-workbench-metric.is-error {
    box-shadow: inset 3px 0 0 var(--tera-tone-error);
  }

  .devtools-workbench-metric.is-accent {
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  .devtools-value-surface {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .devtools-value-surface .structured-value-viewer {
    border-top: 0;
  }

  .devtools-value-surface .inspector-code {
    border-top: 1px solid var(--tera-separator);
  }

  .investigation-journal-shell {
    gap: 12px;
    height: 100%;
  }

  .investigation-journal-grid {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
    height: 100%;
  }

  .investigation-journal-feed,
  .investigation-journal-detail {
    gap: 12px;
    padding: 14px 16px 16px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .investigation-journal-feed {
    background: transparent;
  }

  .investigation-journal-detail {
    min-height: 0;
    padding: 14px 18px 18px;
  }

  .investigation-journal-section-header {
    display: grid;
    align-content: center;
    gap: 6px;
    min-height: 56px;
    padding: 4px 0 14px;
    border-bottom: 1px solid var(--tera-separator);
  }

  .investigation-journal--logs .investigation-journal-section-title,
  .investigation-journal--timeline .investigation-journal-section-title,
  .investigation-journal--queue .investigation-journal-section-title {
    color: var(--tera-title-ink);
  }

  .investigation-journal--logs .investigation-journal-section-subtitle,
  .investigation-journal--timeline .investigation-journal-section-subtitle,
  .investigation-journal--queue .investigation-journal-section-subtitle {
    color: var(--tera-tone-label);
  }

  .investigation-journal--issues .investigation-journal-section-title {
    color: var(--tera-amber);
  }
`;