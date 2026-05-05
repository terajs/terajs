export const overlaySurfaceUtilityStyles = `

  .item-label,
  .accent-text {
    font-weight: 700;
  }

  .item-label,
  .metric-value,
  .tiny-muted {
    font-family: var(--tera-code-font);
  }

  .issue-error {
    border-color: rgba(255, 107, 139, 0.28);
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffd6de;
  }

  .issue-warn {
    border-color: var(--tera-tone-warn-soft);
    background: var(--tera-surface-section);
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .issue-error {
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a1738;
  }

  #terajs-devtools-root[data-theme="light"] .issue-warn {
    background: var(--tera-surface-section);
    color: var(--tera-light-text-strong);
  }

  @media (min-width: 901px) {
    .devtools-shell {
      --tera-sidebar-width: 92px;
      --tera-components-tree-width: clamp(260px, 23vw, 330px);
      --tera-components-column-padding: 14px;
    }

    .devtools-sidebar .devtools-tabs,
    .components-screen-sidebar .devtools-tabs {
      height: 100%;
      flex: 1;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      border-radius: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      padding: 8px 0;
      gap: 0;
    }

    #terajs-devtools-root[data-theme="light"] .devtools-sidebar .devtools-tabs,
    #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .devtools-tabs {
      background: transparent;
      border-color: transparent;
    }
  }

  @media (max-width: 720px) {
    .devtools-header-actions {
      width: 100%;
    }

    .devtools-status-pill {
      flex: 1 1 calc(50% - 5px);
    }

    .devtools-tabs {
      padding: 10px;
      gap: 10px;
    }

    .tab-button {
      min-width: 52px;
    }

    .devtools-panel-shell {
      padding: 10px 8px 8px;
      border-radius: 0;
    }

    .devtools-panel-shell-title {
      font-size: 18px;
    }

    .components-screen,
    .signals-layout,
    .ai-diagnostics-layout,
    .meta-panel-layout,
    .issues-panel-layout,
    .logs-panel-layout,
    .iframe-single-panel {
      margin: 0;
      border-radius: 0;
    }
  }

  .stack-item,
  .detail-card,
  .metric-card {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
    border-radius: 0;
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .stack-item,
  #terajs-devtools-root[data-theme="light"] .detail-card,
  #terajs-devtools-root[data-theme="light"] .metric-card {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
  }

  .metric-card {
    min-height: 0;
    padding: 10px 0 10px 14px;
    gap: 8px;
    border-left: 0;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .metric-card {
    background: transparent;
  }

  .stack-item {
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0 10px 14px;
    border: 0;
    line-height: 1.45;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-separator-strong);
  }

  .issue-error {
    border-left: 0;
    border-color: transparent;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-error);
    color: var(--tera-cloud);
  }

  .issue-warn {
    border-left: 0;
    border-color: transparent;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-warn);
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .issue-error {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .issue-warn {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item {
    border-color: transparent;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-error {
    border-color: transparent;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-warn {
    border-color: transparent;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-title,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item-kicker,
  #terajs-devtools-root[data-theme="light"] .timeline-control-count {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-meta,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item-summary,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item-detail-toggle,
  #terajs-devtools-root[data-theme="light"] .timeline-control-note {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-kicker {
    border-color: transparent;
    background: transparent;
  }

  .performance-item {
    border-left: 2px solid var(--tera-tone-accent);
  }

  .button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .ai-connection-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .ai-connection-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 0 0 10px;
    border-radius: 0;
    border: 0;
    border-left: 2px solid rgba(108, 147, 255, 0.3);
    background: transparent;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.2;
  }

  .ai-connection-pill::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: rgba(147, 167, 203, 0.5);
    flex: 0 0 auto;
  }

  .ai-connection-pill.is-ready {
    border-left-color: rgba(53, 198, 255, 0.62);
    color: var(--tera-cloud);
  }

  .ai-connection-pill.is-ready::before {
    background: var(--tera-cyan);
    box-shadow: 0 0 10px rgba(50, 215, 255, 0.45);
  }

  .ai-connection-pill.is-idle::before {
    background: rgba(147, 167, 203, 0.52);
  }

  #terajs-devtools-root[data-theme="light"] .ai-connection-pill {
    border-left-color: rgba(106, 84, 215, 0.28);
    background: transparent;
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-connection-pill.is-ready {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-connection-pill.is-ready::before {
    background: var(--tera-light-accent-strong);
    box-shadow: 0 0 10px rgba(47, 109, 255, 0.2);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    margin: 12px 0;
  }

  .metric-value {
    margin-top: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .metric-value {
    color: #181818;
  }

  .range-wrap {
    margin: 12px 0;
  }

  .timeline-slider {
    width: 100%;
    accent-color: var(--tera-blue);
  }

  #terajs-devtools-root::-webkit-scrollbar,
  .devtools-panel::-webkit-scrollbar,
  .devtools-tabs::-webkit-scrollbar,
  .components-screen-body::-webkit-scrollbar,
  .stack-list::-webkit-scrollbar,
  .signals-list::-webkit-scrollbar,
  .ai-prompt::-webkit-scrollbar,
  .ai-response::-webkit-scrollbar,
  .inspector-code::-webkit-scrollbar,
  .runtime-history-scroll::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
`;