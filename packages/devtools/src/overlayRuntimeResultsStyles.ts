export const overlayRuntimeResultsStyles = `

  .signals-summary-list > .signals-summary-row:last-child,
  .signals-detail-stack > .signals-section-block:last-child,
  .meta-panel-detail-stack > .meta-panel-section-block:last-child,
  .iframe-panel-stack > .iframe-panel-section-block:last-child,
  .ai-diagnostics-detail-stack > .ai-diagnostics-section-block:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .signals-summary-label,
  .signals-section-heading,
  .meta-panel-section-heading,
  .iframe-panel-section-heading {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-label,
  #terajs-devtools-root[data-theme="light"] .signals-section-heading,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-heading,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-heading {
    color: var(--tera-title-ink);
  }

  .signals-summary-value {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .signals-summary-note {
    color: rgba(200, 220, 246, 0.88);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.7;
    letter-spacing: 0.01em;
    font-size: 12px;
    line-height: 1.4;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-value {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-note {
    color: var(--tera-light-text-muted);
  }

  .iframe-results-pane {
    min-width: 0;
  }

  .iframe-results-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0;
  }

  .iframe-results-item {
    position: relative;
    display: grid;
    gap: 6px;
    padding: 10px 10px 10px 16px;
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: 6px;
    background: transparent;
    box-shadow: none;
    min-width: 0;
  }

  .iframe-results-item::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 999px;
    background: var(--tera-separator-strong);
    opacity: 0.72;
  }

  .iframe-results-item.is-error {
    border-color: transparent;
    background: transparent;
  }

  .iframe-results-item.is-warn {
    border-color: transparent;
    background: transparent;
  }

  .iframe-results-item.is-error::before {
    background: var(--tera-tone-error);
    opacity: 1;
  }

  .iframe-results-item.is-warn::before {
    background: var(--tera-tone-warn);
    opacity: 1;
  }

  .iframe-results-item-head {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .iframe-results-item-copy {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .iframe-results-item-title-row {
    display: flex;
    align-items: flex-start;
    gap: 0;
    min-width: 0;
  }

  .iframe-results-item-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: #bcd2ff;
  }

  .iframe-results-item-kicker-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .iframe-results-item-kicker {
    display: inline-flex;
    align-items: center;
    min-height: 0;
    padding: 0;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: var(--tera-tone-label);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .iframe-results-item-title {
    color: var(--tera-cloud);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .iframe-results-item-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .iframe-results-item-summary {
    color: rgba(210, 224, 245, 0.72);
    font-size: 12px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .iframe-results-item-detail {
    display: grid;
    gap: 8px;
    padding-top: 2px;
    border-top: 1px solid rgba(50, 215, 255, 0.08);
  }

  .iframe-results-item-detail[open] {
    padding-top: 8px;
  }

  .iframe-results-item-detail-toggle {
    cursor: pointer;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    list-style: none;
  }

  .iframe-results-item-detail-toggle::-webkit-details-marker {
    display: none;
  }

  .iframe-results-item-detail-toggle::before {
    content: ">";
    display: inline-block;
    margin-right: 8px;
    color: var(--tera-cyan);
    transition: transform 120ms ease;
  }

  .iframe-results-item-detail[open] .iframe-results-item-detail-toggle::before {
    transform: rotate(90deg);
  }

  .iframe-results-item-detail-body {
    min-width: 0;
  }

  .iframe-results-item-detail-body .structured-value-viewer {
    max-height: min(280px, 40vh);
  }

  .iframe-results-item.is-event {
    gap: 6px;
    padding: 10px 10px 10px 16px;
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: 6px;
    background: transparent;
    box-shadow: none;
  }

  .iframe-results-item.is-event:last-child {
    padding-bottom: 10px;
    border-bottom: 0;
  }

  .iframe-results-item.is-event .iframe-results-item-kicker-row {
    align-items: flex-start;
  }

  .iframe-results-item.is-event .iframe-results-item-title {
    font-size: 13px;
    letter-spacing: -0.01em;
    text-transform: none;
  }

  .iframe-results-item.is-event .iframe-results-item-summary {
    color: rgba(210, 224, 245, 0.68);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-event {
    border-color: var(--tera-separator);
    background: transparent;
  }

  .timeline-control-panel {
    display: grid;
    gap: 10px;
  }

  .timeline-control-summary {
    display: grid;
    gap: 4px;

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter] {
    border-left-width: 3px;
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="all"] {
    border-left-color: rgba(103, 215, 255, 0.88);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="issues"] {
    border-left-color: var(--tera-tone-warn);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="route"] {
    border-left-color: rgba(126, 163, 255, 0.88);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="component"] {
    border-left-color: rgba(145, 176, 255, 0.88);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="signal"] {
    border-left-color: rgba(88, 224, 255, 0.9);
  }

  .timeline-panel-layout .devtools-workbench-list-item[data-timeline-filter="effect"] {
    border-left-color: rgba(75, 221, 177, 0.92);
  }
`;