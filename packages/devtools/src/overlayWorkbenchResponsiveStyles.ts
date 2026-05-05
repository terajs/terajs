export const overlayWorkbenchResponsiveStyles = `

  .investigation-journal--issues .investigation-journal-section-subtitle,
  .investigation-journal--issues .devtools-workbench-list-group {
    color: var(--tera-tone-warn);
  }

  .investigation-journal .devtools-workbench-list-item,
  .investigation-journal .devtools-workbench-list-item:hover,
  .investigation-journal .devtools-workbench-list-item.is-active {
    border-radius: 6px;
    box-shadow: none;
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-stack {
    gap: 12px;
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-section-heading {
    color: var(--tera-title-ink);
  }

  .diagnostics-deck-hero {
    gap: 10px;
    padding: 0 0 12px;
    border: 0;
    border-bottom: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
  }

  .diagnostics-feed {
    gap: 6px;
  }

  .diagnostics-feed-item {
    gap: 6px;
    padding: 10px 10px 10px 16px;
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: 6px;
    background: transparent;
  }

  .diagnostics-feed-item::before {
    opacity: 0.72;
  }

  .diagnostics-feed-item.is-accent {
    border-color: transparent;
  }

  .diagnostics-feed-item.is-warn {
    border-color: transparent;
  }

  .diagnostics-feed-item.is-error {
    border-color: transparent;
  }

  .diagnostics-feed-item-badge {
    padding: 0;
    border-radius: 0;
    background: transparent;
  }

  .diagnostics-note {
    padding: 0 0 0 12px;
    border: 0;
    border-left: 2px solid var(--tera-tone-accent-soft);
    border-radius: 0;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-header,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel-header,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-header,
  #terajs-devtools-root[data-theme="light"] .diagnostics-deck-hero,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item,
  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-feed {
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title {
    color: var(--tera-title-ink);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-subtitle {
    color: var(--tera-tone-label);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal--issues .investigation-journal-section-title {
    color: var(--tera-light-amber-ink);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal--issues .investigation-journal-section-subtitle,
  #terajs-devtools-root[data-theme="light"] .investigation-journal--issues .devtools-workbench-list-group {
    color: var(--tera-light-amber-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .devtools-workbench-list-item:hover {
    background: rgba(83, 166, 255, 0.12);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(152, 209, 255, 0.2), rgba(227, 240, 255, 0.88));
    box-shadow: inset 3px 0 0 #53a6ff;
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .devtools-workbench-list-item.is-active::before {
    background: #53a6ff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric {
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--router,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--sanity {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--router .devtools-utility-panel-body,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--sanity .devtools-utility-panel-body {
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-value-surface .structured-value-viewer,
  #terajs-devtools-root[data-theme="light"] .devtools-value-surface .inspector-code {
    border-top-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-note {
    background: var(--tera-surface-section);
  }

  @media (max-width: 900px) {
    .devtools-workbench {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(220px, 34vh) minmax(0, 1fr);
    }

    .investigation-journal-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .devtools-workbench-sidebar {
      border-bottom-color: rgba(145, 173, 214, 0.12);
    }

    #terajs-devtools-root[data-theme="light"] .devtools-workbench-sidebar {
      border-bottom-color: var(--tera-separator);
    }

    .devtools-workbench-facts {
      grid-template-columns: minmax(0, 1fr);
    }
  }

`;