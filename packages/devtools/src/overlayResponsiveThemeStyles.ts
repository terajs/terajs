export const overlayResponsiveThemeStyles = `

  @media (min-width: 901px) {
    .devtools-shell {
      --tera-sidebar-width: 136px;
      --tera-components-tree-width: clamp(240px, 28vw, 320px);
      --tera-components-column-padding: 14px;
    }

    .devtools-body {
      flex-direction: row;
    }

    .devtools-sidebar {
      flex: 0 0 var(--tera-sidebar-width);
    }

    .components-screen {
      grid-template-columns: var(--tera-sidebar-width) var(--tera-components-tree-width) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }

    .components-screen.is-inspector-hidden {
      grid-template-columns: var(--tera-sidebar-width) minmax(0, 1fr);
    }

    .components-screen--iframe {
      grid-template-columns: var(--tera-components-tree-width) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }

    .components-screen--iframe.is-inspector-hidden {
      grid-template-columns: minmax(0, 1fr);
    }

    .components-screen-sidebar {
      grid-column: 1;
      grid-row: 1;
    }

    .components-screen-sidebar .devtools-tabs {
      width: 100%;
      height: 100%;
    }

    .components-screen-tree {
      grid-column: 2;
      grid-row: 1;
      border-right: 1px solid var(--tera-border);
      border-bottom: 0;
    }

    .components-screen--iframe .components-screen-tree {
      grid-column: 1;
      grid-row: 1;
    }

    .components-screen-inspector {
      grid-column: 3;
      grid-row: 1;
    }

    .components-screen--iframe .components-screen-inspector {
      grid-column: 2;
      grid-row: 1;
    }

    .components-screen-header-row {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    .components-screen-search,
    .components-screen-filter {
      width: min(270px, 52%);
    }

    .components-screen-tree .components-screen-search {
      width: 100%;
    }

    .devtools-sidebar .devtools-tabs,
    .components-screen-sidebar .devtools-tabs {
      width: 100%;
      height: 100%;
    }

    .devtools-tabs {
      width: 100%;
      border-right: 1px solid var(--tera-border);
      border-bottom: 0;
      flex-direction: column;
      overflow: auto;
      padding: 10px 8px;
      gap: 8px;
    }

    .devtools-sidebar .tab-button,
    .components-screen-sidebar .tab-button {
      justify-content: flex-start;
      min-height: 42px;
      padding: 10px 12px;
      text-align: left;
    }

    .panel-section-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metrics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ai-diagnostics-layout,
    .meta-panel-layout,
    .issues-panel-layout,
    .logs-panel-layout,
    .signals-layout {
      grid-template-columns: clamp(220px, 24vw, 290px) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }

    .ai-diagnostics-layout .components-tree-pane {
      border-right: 1px solid rgba(50, 215, 255, 0.26);
      border-bottom: 0;
    }

    .signals-summary-pane {
      border-right: 1px solid rgba(50, 215, 255, 0.26);
      border-bottom: 0;
    }

    #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
      border-right-color: var(--tera-light-border);
    }

    #terajs-devtools-root[data-theme="light"] .signals-summary-pane {
      border-right-color: var(--tera-light-border);
    }
  }

  @media (max-width: 720px) {
    .devtools-header {
      padding: 12px 12px 10px;
    }

    .devtools-title {
      font-size: 17px;
    }

    .devtools-header-actions {
      width: 100%;
    }

    .devtools-header-actions .toolbar-button {
      flex: 1 1 calc(50% - 4px);
    }

    .devtools-header-actions .toolbar-button--icon-only {
      flex: 0 0 auto;
    }

    .devtools-tabs {
      padding: 8px;
      gap: 8px;
    }

    .tab-button {
      min-width: 116px;
      justify-content: flex-start;
    }

    .devtools-panel {
      padding: 10px;
    }

    .devtools-panel--iframe {
      padding: 0;
    }

    .panel-hero {
      padding: 16px 14px 14px;
      border-radius: 18px;
    }

    .components-screen,
    .signals-layout,
    .ai-diagnostics-layout,
    .meta-panel-layout,
    .issues-panel-layout,
    .logs-panel-layout,
    .iframe-single-panel {
      margin: -10px;
    }
  }

  .panel-title {
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
    letter-spacing: -0.02em;
    line-height: 1.35;
    text-transform: none;
  }

  .is-blue { color: var(--tera-tone-primary); }
  .is-blue-soft { color: var(--tera-tone-primary-muted); }
  .is-green { color: var(--tera-tone-success); }
  .is-green-soft { color: var(--tera-tone-success-muted); }
  .is-purple { color: var(--tera-tone-tertiary); }
  .is-purple-soft { color: var(--tera-tone-tertiary-muted); }
  .is-red { color: var(--tera-tone-error); }
  .is-red-soft { color: var(--tera-tone-error-muted); }
  .is-cyan { color: var(--tera-tone-info); }
  .is-cyan-soft { color: var(--tera-tone-info-muted); }
  .is-amber { color: var(--tera-tone-warn); }
  .is-amber-soft { color: var(--tera-tone-warn-muted); }

  .panel-title.is-blue,
  .panel-title.is-cyan,
  .panel-title.is-purple,
  .panel-title.is-green,
  .panel-title.is-amber,
  .panel-title.is-red {
    color: var(--tera-title-ink);
  }

  .empty-state {
    padding: 12px 0;
    color: rgba(207, 223, 247, 0.78);
    font-size: 13px;
    line-height: 1.55;
  }

  #terajs-devtools-root[data-theme="light"] .empty-state {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-tag {
    border-color: var(--tera-light-border);
    background: rgba(47, 109, 255, 0.08);
    color: var(--tera-light-text-soft);
  }

  .stack-list {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .stack-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .compact-list {
    max-height: 180px;
  }

  .log-list {
    max-height: 320px;
  }

  .stack-item,
  .detail-card,
  .metric-card {
    background: var(--tera-panel-glow), rgba(26, 26, 26, 0.96);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 12px;
  }

  .metric-card {
    display: grid;
    gap: 12px;
    align-content: start;
    min-height: 98px;
  }

  #terajs-devtools-root[data-theme="light"] .stack-item,
  #terajs-devtools-root[data-theme="light"] .detail-card,
  #terajs-devtools-root[data-theme="light"] .metric-card {
    background: linear-gradient(145deg, rgba(47, 109, 255, 0.06), rgba(50, 215, 255, 0.05) 52%, rgba(255, 255, 255, 0.94));
    border-color: rgba(46, 46, 46, 0.12);
  }

  .stack-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .inspector-cascade .stack-item {
    background: transparent;
    border: 0;
    border-left: 1px solid rgba(50, 215, 255, 0.18);
    border-radius: 0;
    padding: 2px 0 2px 10px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-cascade .stack-item {
    border-left-color: rgba(54, 118, 210, 0.22);
  }
`;