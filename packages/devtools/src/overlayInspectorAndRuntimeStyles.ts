import { componentTreeStyles } from "./componentTreeStyles.js";

export const overlayInspectorAndRuntimeStyles = `
  .ai-diagnostics-nav-list {
    display: grid;
    gap: 4px;
  }

  .ai-diagnostics-nav-button {
    appearance: none;
    width: 100%;
    justify-self: stretch;
    position: relative;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--component-tree-label-dark);
    display: flex;
    align-items: center;
    min-height: 38px;
    padding: 10px 12px;
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .ai-diagnostics-nav-button::before {
    display: none;
  }

  .ai-diagnostics-nav-button:hover {
    background: rgba(18, 31, 53, 0.28);
    border-color: rgba(145, 173, 214, 0.12);
    color: #f3fff8;
  }

  .ai-diagnostics-nav-button.is-active {
    background: rgba(24, 39, 63, 0.52);
    border-color: rgba(108, 147, 255, 0.18);
    box-shadow: none;
    color: #f4f8ff;
  }

  .ai-diagnostics-nav-button:hover::before,
  .ai-diagnostics-nav-button.is-active::before {
    display: none;
  }

  .ai-diagnostics-nav-title {
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button {
    color: var(--component-tree-label-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover {
    background: rgba(73, 126, 255, 0.08);
    border-color: rgba(112, 148, 214, 0.14);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active {
    background: rgba(73, 126, 255, 0.12);
    border-color: rgba(73, 126, 255, 0.16);
    box-shadow: none;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button::before {
    display: none;
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover::before,
  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active::before {
    background: var(--component-tree-accent-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-title {
    text-shadow: 0 0 10px rgba(50, 215, 255, 0.12);
  }

  .ai-diagnostics-detail-stack,
  .ai-diagnostics-section-block {
    display: grid;
    gap: 10px;
  }

  .ai-panel-screen .panel-title.is-cyan {
    color: var(--tera-tone-info);
  }

  .ai-panel-screen .panel-title.is-purple {
    color: var(--tera-title-ink);
  }

  .ai-panel-screen .accent-text.is-purple {
    color: var(--tera-tone-tertiary);
  }

  .ai-panel-screen .performance-item {
    border-left-color: rgba(127, 214, 255, 0.72);
  }

  .ai-panel-screen .ai-connection-pill {
    border-left-color: rgba(108, 147, 255, 0.24);
  }

  .ai-panel-screen .ai-connection-pill.is-ready {
    border-left-color: rgba(127, 214, 255, 0.62);
  }

  .ai-panel-screen .ai-connection-pill.is-ready::before {
    background: #7fd6ff;
    box-shadow: 0 0 10px rgba(127, 214, 255, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .panel-title.is-cyan {
    color: var(--tera-tone-info);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .panel-title.is-purple {
    color: var(--tera-title-ink);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .accent-text.is-purple {
    color: var(--tera-tone-tertiary);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .performance-item {
    border-left-color: rgba(83, 166, 255, 0.68);
  }

  .meta-panel-layout {
    grid-template-columns: clamp(220px, 24vw, 290px) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  .meta-panel-layout .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
    border-bottom: 0;
  }

  #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .meta-panel-layout .meta-panel-nav-pane .components-screen-body {
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .issues-panel-layout .ai-diagnostics-nav-pane .components-screen-body,
  .logs-panel-layout .ai-diagnostics-nav-pane .components-screen-body {
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .issues-panel-layout,
  .logs-panel-layout {
    grid-template-columns: clamp(220px, 24vw, 290px) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  .issues-panel-layout .components-tree-pane,
  .logs-panel-layout .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
    border-bottom: 0;
  }

  #terajs-devtools-root[data-theme="light"] .issues-panel-layout .components-tree-pane,
  #terajs-devtools-root[data-theme="light"] .logs-panel-layout .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .iframe-single-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    padding: 0;
    overflow: hidden;
    background: var(--tera-surface-page);
  }

  .iframe-single-panel .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  #terajs-devtools-root[data-theme="light"] .iframe-single-panel {
    background: var(--tera-surface-page);
  }

  .signals-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    height: calc(100% + 24px);
    margin: -12px;
    overflow: hidden;
    background: var(--tera-surface-page);
  }

  .signals-summary-pane,
  .signals-detail-pane {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .signals-summary-pane {
    border-bottom: 1px solid var(--tera-separator);
    background: var(--tera-surface-pane);
  }

  .signals-detail-pane {
    background: transparent;
  }

  .signals-summary-pane .components-screen-body,
  .signals-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  .signals-list-type-pill {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid var(--tera-separator-strong);
    background: var(--tera-surface-pane-strong);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .signals-list-detail {
    min-width: 0;
  }

  .signals-list-detail .structured-value-viewer {
    max-height: min(260px, 36vh);
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-pane {
    border-bottom-color: var(--tera-light-border);
    background: rgba(245, 250, 255, 0.72);
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-type-pill {
    border-left-color: rgba(106, 84, 215, 0.34);
    background: transparent;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-detail-pane {
    background: var(--tera-light-panel-bg);
  }

  .signals-summary-list,
  .signals-detail-stack,
  .meta-panel-detail-stack,
  .iframe-panel-stack,
  .ai-diagnostics-detail-stack {
    display: grid;
    gap: 10px;
  }

  .signals-summary-row,
  .signals-section-block,
  .meta-panel-section-block,
  .iframe-panel-section-block,
  .ai-diagnostics-section-block {
    display: grid;
    gap: 10px;
    border: 0;
    border-bottom: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
    padding: 0 0 14px;
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-row,
  #terajs-devtools-root[data-theme="light"] .signals-section-block,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-section-block {
    border-color: var(--tera-separator);
    background: transparent;
  }

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
