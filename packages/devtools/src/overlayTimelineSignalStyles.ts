export const overlayTimelineSignalStyles = `

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="dom"] {
    border-left-color: rgba(255, 207, 120, 0.92);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="queue"] {
    border-left-color: rgba(255, 155, 98, 0.92);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="hub"] {
    border-left-color: rgba(126, 231, 216, 0.92);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="other"] {
    border-left-color: rgba(165, 188, 226, 0.84);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="signal"] .devtools-workbench-list-item-badge,
  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="all"] .devtools-workbench-list-item-badge {
    background: rgba(28, 81, 124, 0.88);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="effect"] .devtools-workbench-list-item-badge {
    background: rgba(18, 83, 69, 0.88);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="dom"] .devtools-workbench-list-item-badge,
  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="queue"] .devtools-workbench-list-item-badge,
  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="issues"] .devtools-workbench-list-item-badge {
    background: rgba(97, 63, 24, 0.92);
  }

  .timeline-results-section .iframe-results-pane {
    display: grid;
    gap: 10px;
  }

  .timeline-results-section .iframe-results-list {
    display: grid;
    gap: 10px;
  }
  }

    gap: 10px;
    padding: 0;
    border: 1px solid rgba(55, 84, 122, 0.82);
    border-left: 3px solid rgba(103, 215, 255, 0.86);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(11, 22, 39, 0.98), rgba(13, 24, 43, 0.94));
    overflow: hidden;
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    background: linear-gradient(180deg, rgba(16, 30, 52, 0.98), rgba(15, 27, 48, 0.96));
    border-color: rgba(103, 181, 255, 0.28);

  .timeline-control-note {
    color: var(--tera-mist);
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(53, 198, 255, 0.14);
    color: #98ecff;
    letter-spacing: 0.08em;
  }

  .timeline-results-section .iframe-results-item.is-event .iframe-results-item-copy {
    display: grid;
    gap: 6px;
    padding: 12px 14px 0;
  }

  .timeline-results-section .iframe-results-item.is-event .iframe-results-item-summary {
    color: rgba(184, 204, 236, 0.84);
  }

  .timeline-results-section .iframe-results-item.is-event.is-warn {
    border-left-color: var(--tera-tone-warn);
  }

  .timeline-results-section .iframe-results-item.is-warn .iframe-results-item-kicker {
    background: rgba(232, 136, 62, 0.16);
    color: #ffd39e;
  }

  .timeline-results-section .iframe-results-item.is-event.is-error {
    border-left-color: var(--tera-tone-error);
  }

  .timeline-results-section .iframe-results-item.is-error .iframe-results-item-kicker {
    background: rgba(255, 107, 139, 0.16);
    color: #ffc2d3;
  }

  .timeline-results-section .iframe-results-item-detail {
    margin: 0 14px 14px;
    padding-top: 10px;
    border-top-color: rgba(80, 123, 185, 0.22);
  }

  .timeline-results-section .iframe-results-item-detail-toggle {
    color: rgba(220, 234, 255, 0.88);
  }

  .timeline-results-section .iframe-results-item-detail-body {
    display: grid;
    gap: 10px;
    padding-top: 8px;
  }

  .timeline-event-detail-stack {
    display: grid;
    gap: 10px;
  }

  .timeline-event-detail-stack .devtools-workbench-facts {
    gap: 10px 14px;
  }

  .timeline-event-detail-stack .devtools-value-surface {
    border-left: 2px solid rgba(103, 215, 255, 0.46);
  }

  .timeline-event-empty-state {
    border: 1px solid rgba(55, 84, 122, 0.72);
    border-radius: 12px;
    background: rgba(10, 18, 31, 0.78);
  }
    line-height: 1.45;
  }

  .signals-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="all"] {
    border-left-color: #2d8dd6;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="issues"] {
    border-left-color: rgba(214, 115, 42, 0.82);
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="route"] {
    border-left-color: #5b86f1;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="component"] {
    border-left-color: #6e7fe6;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="signal"] {
    border-left-color: #1688bf;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="effect"] {
    border-left-color: #178f77;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="dom"] {
    border-left-color: #aa6a1a;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="queue"] {
    border-left-color: #b5652f;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="hub"] {
    border-left-color: #178c86;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="other"] {
    border-left-color: #6e88b8;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="signal"] .devtools-workbench-list-item-badge,
  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="all"] .devtools-workbench-list-item-badge {
    background: #e0f4ff;
    color: #0d6d95;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="effect"] .devtools-workbench-list-item-badge {
    background: #e0f7f1;
    color: #156d5b;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="dom"] .devtools-workbench-list-item-badge,
  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="queue"] .devtools-workbench-list-item-badge,
  #terajs-devtools-root[data-theme="light"] .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="issues"] .devtools-workbench-list-item-badge {
    background: #fff0e1;
    color: #9a4d17;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item.is-event {
    border-color: #c8d8f0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.96));
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item.is-event:hover {
    border-color: #8eb2ef;
    background: linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(239, 246, 255, 0.96));
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item.is-event .iframe-results-item-summary {
    color: var(--tera-light-text-muted);
    font-family: var(--tera-code-font);
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item.is-event .iframe-results-item-kicker {
    background: #e5f4ff;
    color: #0f73a0;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item.is-warn .iframe-results-item-kicker {
    background: #fff0df;
    color: #9a4d17;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item.is-error .iframe-results-item-kicker {
    background: #ffe5ee;
    color: #a32f5c;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item-detail {
    border-top-color: #d9e5f6;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-results-section .iframe-results-item-detail-toggle {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .timeline-event-detail-stack .devtools-value-surface {
    border-left-color: rgba(45, 141, 214, 0.38);
  }

  #terajs-devtools-root[data-theme="light"] .timeline-event-empty-state {
    border-color: #d7e2f3;
    background: #f8fbff;
    color: var(--tera-light-text-muted);
  }
    gap: 0;
    max-height: 420px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .signals-list-compact {
    max-height: 360px;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .signals-list-item {
    display: grid;
    gap: 6px;
    padding: 10px 0 10px 12px;
    border: 0;
    border-left: 2px solid var(--tera-separator-strong);
    border-bottom: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-item {
    border-color: var(--tera-separator);
    background: transparent;
  }

  .signals-list-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .signals-list-preview {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .iframe-single-panel,
  .signals-layout,
  .signals-summary-pane,
  .signals-detail-pane,
  .meta-panel-layout .components-tree-pane,
  .issues-panel-layout .components-tree-pane,
  .logs-panel-layout .components-tree-pane,
  .ai-diagnostics-layout .components-tree-pane {
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-single-panel,
  #terajs-devtools-root[data-theme="light"] .signals-layout,
  #terajs-devtools-root[data-theme="light"] .signals-summary-pane,
  #terajs-devtools-root[data-theme="light"] .signals-detail-pane,
  #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane,
  #terajs-devtools-root[data-theme="light"] .issues-panel-layout .components-tree-pane,
  #terajs-devtools-root[data-theme="light"] .logs-panel-layout .components-tree-pane,
  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
    background: var(--tera-surface-pane);
  }

  .signals-summary-row,
  .signals-section-block,
  .meta-panel-section-block,
  .iframe-panel-section-block,
  .iframe-results-item,
  .signals-list-item {
    border-color: var(--tera-separator);
    background: transparent;
    box-shadow: none;
  }
`;