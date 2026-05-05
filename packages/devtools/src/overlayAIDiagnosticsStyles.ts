export const overlayAIDiagnosticsStyles = `

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
`;