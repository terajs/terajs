import { componentTreeStyles } from "./componentTreeStyles.js";

export const overlayComponentInspectorStyles = `

  #terajs-devtools-root[data-theme="light"] .signals-summary-row,
  #terajs-devtools-root[data-theme="light"] .signals-section-block,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item,
  #terajs-devtools-root[data-theme="light"] .signals-list-item {
    background: transparent;
    border-color: var(--tera-separator);
  }

  .ai-diagnostics-nav-list {
    gap: 0;
  }

  .iframe-results-item-icon-wrap,
  .iframe-results-item-kicker,
  .signals-list-type-pill {
    border-color: transparent;
    background: transparent;
    color: var(--tera-title-ink);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-icon-wrap,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item-kicker,
  #terajs-devtools-root[data-theme="light"] .signals-list-type-pill {
    color: var(--tera-title-ink);
  }

  .ai-diagnostics-nav-button {
    border-radius: 8px;
    min-height: 38px;
    padding: 10px 12px;
    background: transparent;
  }

  .ai-diagnostics-nav-button::before {
    display: none;
  }

  .ai-diagnostics-nav-button:hover {
    background: var(--tera-surface-row-hover);
    border-color: var(--tera-separator);
  }

  .ai-diagnostics-nav-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent-soft);
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button {
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover {
    background: var(--tera-surface-row-hover);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent-soft);
    box-shadow: none;
  }

  .timeline-control-panel {
    gap: 12px;
    padding: 2px 0 8px 16px;
    border: 0;
    border-bottom: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent-soft);
  }

  .timeline-control-summary {
    gap: 6px;
  }

  .timeline-control-count {
    color: rgba(228, 238, 252, 0.88);
    font-size: 14px;
    letter-spacing: 0.02em;
  }

  .timeline-control-note {
    color: rgba(179, 198, 229, 0.72);
  }

  .timeline-results-section .iframe-results-item.is-event {
    padding-left: 16px;
  }

  .timeline-results-section .iframe-results-item.is-event:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  .timeline-results-section .iframe-results-item.is-event .iframe-results-item-kicker {
    color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .timeline-control-panel {
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .timeline-control-note {
    color: var(--tera-light-text-muted);
  }

  .ai-diagnostics-nav-title {
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-preview {
    color: var(--tera-light-text-strong);
  }

  @media (max-width: 720px) {
    .meta-panel-layout,
    .issues-panel-layout,
    .logs-panel-layout,
    .signals-layout,
    .ai-diagnostics-layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }

    .meta-panel-layout .components-tree-pane,
    .issues-panel-layout .components-tree-pane,
    .logs-panel-layout .components-tree-pane,
    .signals-summary-pane,
    .ai-diagnostics-layout .components-tree-pane {
      border-right: 0;
      border-bottom: 1px solid var(--tera-border);
    }

    #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane,
    #terajs-devtools-root[data-theme="light"] .issues-panel-layout .components-tree-pane,
    #terajs-devtools-root[data-theme="light"] .logs-panel-layout .components-tree-pane,
    #terajs-devtools-root[data-theme="light"] .signals-summary-pane,
    #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
      border-bottom-color: var(--tera-light-border);
    }
  }

  .component-select-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
  }

  .component-row-title {
    display: inline-block;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .component-row-meta {
    font-family: var(--tera-code-font);
    white-space: nowrap;
  }

  .component-detail-card {
    margin-top: 12px;
  }

  .components-layout {
    display: grid;
    gap: 10px;
  }

  .components-split-pane {
    display: grid;
    grid-template-columns: minmax(260px, 44%) minmax(320px, 56%);
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    overflow: hidden;
    min-height: 340px;
    background: rgba(8, 16, 30, 0.46);
  }

  #terajs-devtools-root[data-theme="light"] .components-split-pane {
    background: rgba(255, 255, 255, 0.72);
    border-color: var(--tera-light-border);
    box-shadow: none;
  }

  .components-tree-pane,
  .components-inspector-pane {
    min-width: 0;
    min-height: 0;
    padding: 10px 12px;
    overflow: auto;
  }

${componentTreeStyles}

  .inspector-cascade {
    display: grid;
    gap: 10px;
  }

  .inspector-cascade-block {
    display: grid;
    gap: 8px;
    border-left: 1px solid var(--tera-border);
    padding-left: 10px;
  }

  .inspector-cascade-title {
    color: var(--tera-cloud);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-cascade-title {
    color: var(--tera-light-text-strong);
  }

  .inspector-keyvalue-list {
    display: grid;
    gap: 0;
    border-top: 1px solid rgba(145, 173, 214, 0.08);
  }

  .inspector-keyvalue-row {
    display: grid;
    grid-template-columns: 124px minmax(0, 1fr);
    gap: 14px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(145, 173, 214, 0.08);
    font-size: 12px;
    line-height: 1.45;
  }

  .inspector-keyvalue-key {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .inspector-keyvalue-value {
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
    overflow-wrap: anywhere;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-row {
    border-bottom-color: rgba(112, 148, 214, 0.12);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-key {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-value {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-title {
    color: var(--tera-light-text-muted);
  }

  .inspector-ai-panel {
    display: grid;
    gap: 12px;
  }

  .inspector-ai-block {
    display: grid;
    gap: 8px;
  }

  .inspector-ai-title {
    color: var(--tera-mist);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .inspector-ai-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .inspector-ai-tag {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 0 0 10px;
    border-radius: 0;
    border: 0;
    border-left: 2px solid rgba(76, 123, 255, 0.34);
    background: transparent;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.2;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-tag {
    border-left-color: rgba(106, 84, 215, 0.28);
    color: var(--tera-light-text-soft);
  }
`;