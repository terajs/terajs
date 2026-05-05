export const overlaySignalsPanelStyles = `
  .signals-panel-screen .devtools-workbench-list-item-title {
    font-family: var(--tera-code-font);
  }

  .signals-screen {
    display: grid;
    grid-template-columns: minmax(270px, 320px) minmax(0, 1fr);
    min-height: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    background: var(--tera-surface-page);
  }

  .signals-screen-navigator,
  .signals-screen-inspector {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  .signals-screen-navigator {
    background: var(--tera-surface-pane);
    border-right: 1px solid var(--tera-separator);
  }

  .signals-screen-inspector {
    background: var(--tera-surface-pane-muted);
  }

  .signals-screen-header {
    display: grid;
    gap: 10px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--tera-separator);
  }

  .signals-screen-title-block {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .signals-screen-kicker {
    color: var(--tera-cyan);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .signals-screen-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.25;
  }

  .signals-screen-subtitle {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.5;
  }

  .signals-filter-stack {
    display: grid;
    gap: 8px;
  }

  .signals-screen-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .signals-screen-body--navigator {
    padding: 10px;
  }

  .signals-screen-body--inspector {
    padding: 14px 16px;
  }

  .signals-nav-list {
    display: grid;
    gap: 8px;
    align-content: start;
  }

  .signals-nav-button {
    appearance: none;
    width: 100%;
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--tera-separator);
    border-radius: 14px;
    background: var(--tera-surface-section);
    text-align: left;
    cursor: pointer;
  }

  .signals-nav-button:hover {
    border-color: var(--tera-tone-accent);
    background: var(--tera-surface-row-hover);
  }

  .signals-nav-button.is-active {
    border-color: var(--tera-tone-accent);
    background: var(--tera-surface-row-active);
    box-shadow: inset 0 0 0 1px var(--tera-tone-accent-soft);
  }

  .signals-nav-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .signals-nav-secondary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .signals-nav-title {
    color: var(--tera-cloud);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .signals-nav-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid var(--tera-separator-strong);
    background: var(--tera-surface-section-strong);
    color: var(--tera-cyan);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .signals-nav-preview {
    color: var(--tera-cloud);
    font-size: 11px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .signals-nav-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .signals-nav-meta::before {
    content: "•";
    margin-right: 8px;
    color: var(--tera-tone-accent);
  }

  .signals-empty-state {
    display: grid;
    gap: 12px;
    padding: 18px;
    border: 1px dashed var(--tera-separator-strong);
    border-radius: 16px;
    background: var(--tera-surface-section);
  }

  .signals-empty-state--navigator {
    padding: 16px;
  }

  .signals-empty-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 14px;
    font-weight: 700;
  }

  .signals-empty-copy {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.55;
  }

  .signals-empty-steps {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
    color: var(--tera-cloud);
    font-size: 12px;
    line-height: 1.5;
  }

  .signals-inspector-surface {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .signals-selection-note {
    padding: 9px 11px;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 11px;
    background: var(--tera-surface-section);
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.5;
  }

  .signals-inspector-section {
    background: var(--tera-surface-section);
  }

  .signals-tree-surface {
    padding: 0;
  }

  .signals-activity-panel.runtime-history-panel {
    margin-top: 0;
    background: var(--tera-surface-section-strong);
  }

  .signals-activity-panel .runtime-history-scroll {
    max-height: none;
  }

  @media (max-width: 900px) {
    .signals-screen {
      grid-template-columns: 1fr;
    }

    .signals-screen-navigator {
      border-right: 0;
      border-bottom: 1px solid rgba(50, 215, 255, 0.14);
    }

    .signals-screen-body--navigator {
      max-height: 280px;
    }
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen {
    background: var(--tera-surface-page);
    border-color: var(--tera-separator-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-navigator {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-inspector {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-header {
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-kicker,
  #terajs-devtools-root[data-theme="light"] .signals-nav-badge {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-title,
  #terajs-devtools-root[data-theme="light"] .signals-empty-title,
  #terajs-devtools-root[data-theme="light"] .signals-nav-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-subtitle,
  #terajs-devtools-root[data-theme="light"] .signals-empty-copy,
  #terajs-devtools-root[data-theme="light"] .signals-selection-note,
  #terajs-devtools-root[data-theme="light"] .signals-nav-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-button {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-button:hover {
    background: var(--tera-surface-row-hover);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent);
    box-shadow: inset 0 0 0 1px var(--tera-tone-accent-soft);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-badge {
    background: var(--tera-surface-section-strong);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-preview,
  #terajs-devtools-root[data-theme="light"] .signals-empty-steps {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-meta::before {
    color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .signals-empty-state,
  #terajs-devtools-root[data-theme="light"] .signals-selection-note,
  #terajs-devtools-root[data-theme="light"] .signals-inspector-section,
  #terajs-devtools-root[data-theme="light"] .signals-activity-panel.runtime-history-panel {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
  }

  .signals-screen {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .signals-screen-navigator,
  .signals-screen-inspector {
    background: transparent;
  }

  .signals-screen-navigator {
    border-right: 1px solid var(--tera-separator);
  }

  .signals-screen-header {
    gap: 8px;
    padding: 10px 12px 8px;
    background: transparent;
    border-bottom: 1px solid var(--tera-separator);
  }

  .signals-screen-title {
    font-size: 14px;
  }

  .signals-screen-subtitle,
  .signals-nav-meta,
  .signals-empty-copy {
    font-size: 11px;
  }

  .signals-nav-secondary {
    gap: 6px;
  }

  .signals-screen-body--navigator,
  .signals-screen-body--inspector {
    padding: 0;
  }

  .signals-nav-list {
    gap: 0;
  }

  .signals-nav-button {
    gap: 4px;
    padding: 10px 12px 10px 14px;
    border: 0;
    border-left: 2px solid transparent;
    border-bottom: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
  }

  .signals-nav-button:hover {
    border-left-color: rgba(108, 147, 255, 0.34);
    background: var(--tera-surface-row-hover);
  }

  .signals-nav-button.is-active {
    border-left-color: var(--tera-tone-accent);
    background: var(--tera-surface-row-active);
    box-shadow: none;
  }

  .signals-nav-badge {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .signals-empty-state {
    gap: 10px;
    padding: 10px 0 12px 12px;
    border: 0;
    border-left: 2px solid var(--tera-tone-accent);
    border-radius: 0;
    background: transparent;
  }

  .signals-selection-note {
    padding: 0 0 0 10px;
    border: 0;
    border-left: 2px solid var(--tera-tone-accent);
    border-radius: 0;
    background: transparent;
  }

  .signals-tree-surface {
    border-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .signals-screen-navigator,
  #terajs-devtools-root[data-theme="light"] .signals-screen-header,
  #terajs-devtools-root[data-theme="light"] .signals-nav-button,
  #terajs-devtools-root[data-theme="light"] .signals-tree-surface {
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-button:hover {
    background: var(--tera-surface-row-hover);
    border-left-color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .signals-nav-button.is-active {
    background: var(--tera-surface-row-active);
    border-left-color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .signals-empty-state,
  #terajs-devtools-root[data-theme="light"] .signals-selection-note {
    background: transparent;
  }
`;