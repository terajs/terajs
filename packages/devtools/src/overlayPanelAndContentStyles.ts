export const overlayPanelAndContentStyles = `
  .component-drilldown-headline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--tera-border);
    padding: 0 0 8px;
  }

  .component-drilldown-id {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .component-drilldown-path {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    font-weight: 700;
  }

  .component-drilldown-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  .inspector-surface {
    display: grid;
    align-content: flex-start;
    gap: 8px;
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: auto;
    overflow-x: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-headline {
    border-bottom-color: var(--tera-light-border-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-path {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree,
  #terajs-devtools-root[data-theme="light"] .components-screen-inspector {
    background: var(--tera-surface-pane);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-header {
    background: var(--tera-surface-pane-muted);
    border-bottom-color: var(--tera-separator);
  }

  .components-screen-tree .components-screen-header {
    background: linear-gradient(180deg, rgba(22, 37, 71, 0.84), rgba(12, 20, 38, 0.78));
    border-bottom-color: rgba(47, 109, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree .components-screen-header {
    background: var(--tera-surface-pane-muted);
    border-bottom-color: var(--tera-separator);
  }

  .devtools-tabs {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: rgba(13, 13, 13, 0.84);
    display: flex;
    flex-direction: row;
    overflow: auto hidden;
    padding: 6px;
    gap: 6px;
    backdrop-filter: blur(12px);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs {
    background: var(--tera-surface-sidebar);
    border-right-color: var(--tera-light-border);
    border-bottom-color: var(--tera-light-border);
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
  }

  .tab-button,
  .toolbar-button,
  .filter-button,
  .select-button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 8px 10px;
    background: rgba(46, 46, 46, 0.76);
    color: var(--tera-cloud);
    cursor: pointer;
    font: inherit;
    font-weight: 500;
    line-height: 1.4;
    text-align: left;
    transition: transform 120ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 38px;
    text-align: left;
  }

  .toolbar-button--icon-only {
    justify-content: center;
    width: 40px;
    min-width: 40px;
    min-height: 40px;
    padding: 0;
  }

  .toolbar-button--compact,
  .select-button--compact {
    min-height: 34px;
    padding: 7px 10px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.35;
  }

  .tab-button {
    white-space: nowrap;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .devtools-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    color: currentColor;
  }

  .devtools-icon svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .devtools-icon--sm {
    width: 14px;
    height: 14px;
  }

  .devtools-icon--md {
    width: 16px;
    height: 16px;
  }

  .devtools-icon--lg {
    width: 18px;
    height: 18px;
  }

  .devtools-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    border: 1px solid rgba(50, 215, 255, 0.18);
    background: linear-gradient(180deg, rgba(50, 215, 255, 0.12), rgba(47, 109, 255, 0.14));
    color: var(--tera-cyan);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .devtools-icon-badge--title {
    width: 32px;
    height: 32px;
    border-radius: 12px;
  }

  .devtools-icon-badge--button,
  .devtools-icon-badge--heading,
  .devtools-icon-badge--metric {
    width: 24px;
    height: 24px;
    border-radius: 9px;
  }

  .tab-button-content,
  .toolbar-button-content {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .devtools-title-row,
  .devtools-heading-row,
  .metric-label-row {
    display: inline-flex;
    align-items: center;
    gap: 0;
    min-width: 0;
  }

  .devtools-heading-row.has-icon {
    gap: 10px;
  }

  .tab-button-content,
  .toolbar-button-content {
    width: 100%;
  }

  .tab-button-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: 9px;
  }

  .tab-button-label,
  .toolbar-button-label {
    color: inherit;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .devtools-heading-text {
    color: var(--tera-tone-label);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .toolbar-button-label {
    text-align: left;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    font-size: 12px;
    font-weight: 550;
    line-height: 1.4;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: rgba(50, 215, 255, 0.32);
    background: rgba(50, 215, 255, 0.14);
    transform: translateY(-1px);
  }

  .toolbar-button:disabled,
  .toolbar-button:disabled:hover {
    cursor: wait;
    transform: none;
    opacity: 0.82;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .toolbar-button:hover,
  #terajs-devtools-root[data-theme="light"] .filter-button:hover,
  #terajs-devtools-root[data-theme="light"] .select-button:hover {
    border-color: var(--tera-light-border-strong);
    background: rgba(255, 255, 255, 0.96);
    color: var(--tera-light-accent-strong);
    transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .filter-button.is-active,
  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-active,
  #terajs-devtools-root[data-theme="light"] .select-button.is-selected {
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
    box-shadow: inset 0 0 0 1px rgba(79, 140, 255, 0.16);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-icon-badge {
    border-color: var(--tera-light-border);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(230, 241, 255, 0.94));
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs .tab-button.is-active {
    background: linear-gradient(180deg, #2b6edc, #1a4daa);
    color: #ffffff;
    border-color: rgba(26, 77, 170, 0.72);
    box-shadow: 0 12px 24px rgba(31, 88, 214, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs .tab-button.is-active:hover {
    background: linear-gradient(180deg, #2f76e8, #1c56bc);
    color: #ffffff;
    transform: none;
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .toolbar-button.is-active,
  .select-button.is-selected {
    background: linear-gradient(135deg, var(--tera-blue), var(--tera-cyan));
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(47, 109, 255, 0.3);
  }

  .toolbar-button.is-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .toolbar-button.is-loading::before {
    content: "";
    width: 11px;
    height: 11px;
    flex: 0 0 auto;
    border: 2px solid rgba(255, 255, 255, 0.82);
    border-right-color: transparent;
    border-radius: 999px;
    animation: tera-toolbar-spin 0.85s linear infinite;
  }

  @keyframes tera-toolbar-spin {
    to {
      transform: rotate(360deg);
    }
  }

  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-loading::before {
    border-color: rgba(31, 88, 214, 0.82);
    border-right-color: transparent;
  }

  .danger-button {
    background: linear-gradient(135deg, #9f1239, #dc2626);
    color: #ffffff;
  }

  .devtools-panel {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    overflow: hidden;
    padding: 12px;
    background: linear-gradient(180deg, rgba(26, 26, 26, 0.72), rgba(13, 13, 13, 0.9));
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .devtools-panel > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .devtools-panel--iframe {
    padding: 0;
  }

  .devtools-panel--iframe > * {
    width: 100%;
    height: 100%;
  }

  .devtools-panel-iframe-shell {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .devtools-panel-iframe {
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 100%;
    border: 0;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: var(--tera-light-shell-bg);
    color: var(--tera-light-text-strong);
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
  }

  .devtools-page {
    display: grid;
    gap: 12px;
  }

  .panel-hero {
    display: grid;
    gap: 8px;
    padding: 18px 18px 16px;
    border: 1px solid var(--tera-border);
    border-radius: 22px;
    background:
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.12), transparent 28%),
      linear-gradient(135deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.08) 58%, rgba(111, 109, 255, 0.12)),
      rgba(8, 16, 31, 0.92);
    box-shadow: 0 22px 44px rgba(2, 8, 20, 0.26);
  }

  .panel-hero-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .panel-hero-pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.2);
    background: rgba(7, 18, 35, 0.72);
    color: var(--tera-mist);
    font-size: 11px;
    font-family: var(--tera-code-font);
  }

  .panel-section-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .panel-section-card {
    min-height: 0;
  }

  .panel-section-card.is-full {
    grid-column: 1 / -1;
  }

  .panel-section-heading {
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--tera-cloud);
  }

  .panel-section-heading,
  .signals-section-heading,
  .meta-panel-section-heading,
  .iframe-panel-section-heading,
  .ai-diagnostics-nav-title {
    margin-bottom: 0;
  }

  .ai-panel {
    border: 1px solid rgba(50, 215, 255, 0.3);
    background: linear-gradient(180deg, rgba(17, 45, 94, 0.46), rgba(5, 11, 24, 0.92));
    box-shadow: 0 0 34px rgba(47, 109, 255, 0.2), 0 0 62px rgba(50, 215, 255, 0.16);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.16), transparent 36%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 28%),
      linear-gradient(180deg, rgba(238, 246, 255, 0.98), rgba(221, 235, 255, 0.96));
    border-color: var(--tera-light-border-strong);
    box-shadow: var(--tera-light-shadow);
  }

  .ai-workbench-shell {
    padding: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 26%),
      radial-gradient(circle at center, rgba(90, 79, 212, 0.08), transparent 36%),
      linear-gradient(180deg, rgba(10, 18, 33, 0.98), rgba(5, 9, 18, 0.98));
  }

  .ai-workbench-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .ai-workbench-pane {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.9), rgba(5, 9, 18, 0.96));
    border-bottom: 1px solid var(--tera-border);
  }

  .ai-workbench-pane:last-child {
    border-bottom: 0;
  }

  .ai-workbench-rail {
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .ai-workbench-main {
    background: linear-gradient(180deg, rgba(11, 23, 45, 0.94), rgba(6, 12, 25, 0.98));
  }

  .ai-workbench-body {
    display: grid;
    gap: 14px;
    align-content: flex-start;
  }

  .ai-workbench-block {
    display: grid;
    gap: 8px;
  }

  .ai-workbench-message-card {
    margin: 0;
  }

  .ai-workbench-details {
    border: 1px solid rgba(50, 215, 255, 0.2);
    border-radius: 14px;
    background: rgba(7, 18, 35, 0.56);
    overflow: hidden;
  }

  .ai-workbench-details summary {
    cursor: pointer;
    list-style: none;
    padding: 12px 14px;
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .ai-workbench-details summary::-webkit-details-marker {
    display: none;
  }

  .ai-workbench-details-body {
    padding: 0 14px 14px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-shell {
    background:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.08), transparent 26%),
      radial-gradient(circle at top right, rgba(106, 84, 215, 0.06), transparent 24%),
      radial-gradient(circle at center right, rgba(11, 122, 153, 0.05), transparent 24%),
      var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-pane {
    background: var(--tera-surface-pane);
    color: var(--tera-light-text-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-rail {
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details {
    background: var(--tera-surface-section-strong);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details summary {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background:
      linear-gradient(135deg, rgba(63, 124, 255, 0.08), rgba(106, 84, 215, 0.06) 42%, rgba(11, 122, 153, 0.05) 68%),
      var(--tera-surface-section-strong);
    border-color: var(--tera-separator);
    box-shadow: var(--tera-light-shadow);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(235, 245, 255, 0.9));
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .panel-section-heading {
    color: var(--tera-light-text-strong);
  }

  .ask-ai-button {
    background: rgba(34, 66, 124, 0.58);
    color: #f4f8ff;
    border: 1px solid rgba(97, 156, 255, 0.26);
    box-shadow: none;
  }

  .ask-ai-button:hover {
    background: rgba(42, 79, 145, 0.62);
  }

  #terajs-devtools-root[data-theme="light"] .ask-ai-button {
    background: rgba(73, 126, 255, 0.12);
    color: var(--tera-light-text-strong);
    border-color: rgba(73, 126, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .ask-ai-button:hover {
    background: rgba(73, 126, 255, 0.18);
    color: var(--tera-light-text-strong);
  }

  .devtools-tabs {
    border-right: 0;
    border-bottom: 0;
    padding: 10px 8px;
    gap: 8px;
    background: transparent;
  }

  .tab-button,
  .toolbar-button,
  .filter-button,
  .select-button {
    border-radius: 6px;
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    font-weight: 500;
    line-height: 1.4;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    min-height: 38px;
    padding: 8px 12px;
    border-color: var(--tera-separator);
    background: var(--tera-surface-section);
    color: rgba(229, 239, 255, 0.88);
  }

  .tab-button {
    min-width: 52px;
    min-height: 46px;
    padding: 0;
    justify-content: center;
    position: relative;
  }

  .tab-button::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 8px;
    width: 24px;
    height: 1px;
    border-radius: 999px;
    transform: translateX(-50%);
    background: var(--tera-tone-info-muted);
    opacity: 0.44;
    pointer-events: none;
  }

  .tab-button-content {
    justify-content: center;
  }

  .tab-button .tab-button-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .devtools-sidebar .tab-button,
  .components-screen-sidebar .tab-button {
    width: 100%;
  }

  .devtools-icon-badge {
    width: 20px;
    height: 20px;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: #c8d8ff;
    box-shadow: none;
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .toolbar-button.is-active,
  .select-button.is-selected {
    border-color: var(--tera-tone-accent-soft);
    background: var(--tera-surface-row-active);
    color: #ffffff;
    box-shadow: inset 0 0 0 1px rgba(83, 203, 255, 0.1);
  }

  .tab-button.is-active::after {
    background: var(--tera-tone-info);
    opacity: 0.92;
  }

  .tab-button.is-active .devtools-icon-badge,
  .toolbar-button.is-active .devtools-icon-badge,
  .filter-button.is-active .devtools-icon-badge,
  .select-button.is-selected .devtools-icon-badge {
    background: transparent;
    color: #ffffff;
    border: 0;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-row-hover);
    transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .toolbar-button:hover,
  #terajs-devtools-root[data-theme="light"] .filter-button:hover,
  #terajs-devtools-root[data-theme="light"] .select-button:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .filter-button.is-active,
  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-active,
  #terajs-devtools-root[data-theme="light"] .select-button.is-selected {
    background: var(--tera-surface-row-active);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-tone-accent-soft);
    box-shadow: inset 0 0 0 1px rgba(63, 124, 255, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button::after {
    background: var(--tera-tone-info-muted);
    opacity: 0.52;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active::after {
    background: var(--tera-tone-info);
    opacity: 0.88;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-icon-badge {
    color: var(--tera-light-text-soft);
  }

  .devtools-sidebar .tab-button,
  .components-screen-sidebar .tab-button {
    border: 0;
    border-left: 3px solid transparent;
    border-radius: 0;
    min-height: 56px;
    padding: 0;
    background: transparent;
    flex: 0 0 56px;
  }

  .devtools-sidebar .tab-button:hover,
  .components-screen-sidebar .tab-button:hover {
    border-left-color: rgba(108, 147, 255, 0.34);
    background: var(--tera-surface-row-hover);
  }

  .devtools-sidebar .tab-button.is-active,
  .components-screen-sidebar .tab-button.is-active {
    border-left-color: rgba(53, 198, 255, 0.72);
    background: var(--tera-surface-row-active);
    box-shadow: none;
  }

  .devtools-sidebar .tab-button-content,
  .components-screen-sidebar .tab-button-content {
    justify-content: center;
  }

  .devtools-sidebar .tab-button-icon-wrap,
  .components-screen-sidebar .tab-button-icon-wrap {
    width: 38px;
    height: 38px;
  }

  .devtools-sidebar .devtools-icon-badge,
  .components-screen-sidebar .devtools-icon-badge {
    width: 32px;
    height: 32px;
  }

  .devtools-sidebar .devtools-icon,
  .components-screen-sidebar .devtools-icon {
    width: 22px;
    height: 22px;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .tab-button:hover {
    background: var(--tera-surface-row-hover);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .tab-button.is-active {
    border-left-color: rgba(63, 124, 255, 0.62);
    background: var(--tera-surface-row-active);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar .devtools-icon-badge,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .devtools-icon-badge {
    color: var(--tera-light-accent-strong);
  }

  .danger-button {
    background: rgba(96, 22, 51, 0.84);
    border-color: rgba(255, 113, 150, 0.24);
  }

  .devtools-panel-shell {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .devtools-panel-shell-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(108, 147, 255, 0.16);
  }

  .devtools-panel-shell-copy {
    display: grid;
    gap: 3px;
  }

  .devtools-panel-shell-kicker {
    color: var(--tera-cyan);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell-kicker {
    color: var(--tera-light-accent-strong);
  }

  .devtools-panel-shell-title-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .devtools-panel-shell-icon {
    width: 18px;
    height: 18px;
    border-radius: 0;
  }

  .devtools-panel-shell-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .devtools-panel-shell-summary {
    color: rgba(225, 236, 255, 0.72);
    font-size: 11px;
    line-height: 1.4;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell-summary {
    color: var(--tera-light-text-muted);
  }

  .devtools-panel {
    flex: 1;
    min-height: 0;
    padding: 0;
    background: transparent;
    scrollbar-color: rgba(76, 123, 255, 0.42) rgba(9, 17, 31, 0.2);
  }

  .panel-hero-pills {
    gap: 12px;
    margin-top: 2px;
  }

  .panel-hero-pill {
    padding: 0 0 0 10px;
    border: 0;
    border-left: 2px solid rgba(76, 123, 255, 0.38);
    border-radius: 0;
    background: transparent;
    color: var(--tera-mist);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: transparent;
    border-left-color: rgba(106, 84, 215, 0.32);
    color: var(--tera-light-text-soft);
  }

  .devtools-page {
    gap: 10px;
  }

  .panel-hero {
    display: grid;
    gap: 4px;
    padding: 0 0 12px;
    border: 0;
    border-bottom: 1px solid rgba(108, 147, 255, 0.16);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .ai-panel {
    border-radius: 8px;
    background: rgba(10, 18, 31, 0.42);
    border-color: rgba(145, 173, 214, 0.12);
    box-shadow: none;
  }

  .ai-workbench-shell,
  .ai-workbench-pane,
  .ai-workbench-rail,
  .ai-workbench-main {
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background: var(--tera-surface-section-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel,
  #terajs-devtools-root[data-theme="light"] .ai-panel {
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-shell {
    background:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.08), transparent 26%),
      radial-gradient(circle at top right, rgba(106, 84, 215, 0.06), transparent 24%),
      var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-pane {
    background: var(--tera-surface-pane);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-rail {
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  .panel-hero .panel-subtitle {
    max-width: 72ch;
  }

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 160px;
    max-height: min(52vh, 420px);
    border: 1px solid var(--tera-separator);
    border-radius: 6px;
    padding: 12px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.55;
    white-space: pre;
    overflow: auto;
    overflow-wrap: normal;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-prompt {
    background: var(--tera-surface-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-separator);
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 108px;
    border: 1px solid var(--tera-separator);
    border-radius: 6px;
    padding: 12px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: var(--tera-surface-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-separator);
  }

  .ai-hint {
    display: block;
    margin-top: 4px;
    color: rgba(147, 167, 203, 0.96);
    line-height: 1.45;
  }

  .ai-prompt-panel {
    min-height: 0;
  }

  .devtools-section-subheader,
  .ai-section-subheader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .devtools-section-subcontrols,
  .ai-section-subcontrols {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .devtools-section-subcontrols .select-button,
  .ai-section-subcontrols .select-button {
    white-space: nowrap;
  }

  .ai-prompt-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .ai-prompt-copy-button .toolbar-button-content {
    justify-content: center;
  }

  #terajs-devtools-root[data-theme="light"] .ai-hint {
    color: var(--tera-light-text-muted);
  }

  .ai-diagnostics-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(180px, auto) minmax(0, 1fr);
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    overflow: hidden;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane,
  .ai-diagnostics-layout .ai-diagnostics-detail-pane {
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane,
  .ai-diagnostics-layout .ai-diagnostics-detail-pane {
    display: flex;
    flex-direction: column;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane .components-screen-body {
    flex: 1;
    overflow: visible;
    padding: 10px;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-header {
    flex: 0 0 auto;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 10px;
  }

  .ai-diagnostics-layout .components-tree-pane {
    border-right: 0;
    border-bottom: 1px solid var(--tera-separator);
    background: var(--tera-surface-pane);
  }

  .ai-diagnostics-layout .components-inspector-pane {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
    border-bottom-color: var(--tera-separator);
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-inspector-pane {
    background: var(--tera-surface-pane-muted);
  }

  .ai-diagnostics-section-block .button-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    margin-top: 8px;
  }

  .ai-bridge-section--spotlight {
    padding: 14px 16px 16px;
    border: 1px solid rgba(76, 123, 255, 0.28);
    border-left: 3px solid var(--tera-blue);
    border-radius: 14px;
    background:
      linear-gradient(180deg, rgba(76, 123, 255, 0.12), rgba(53, 198, 255, 0.05) 52%, rgba(7, 16, 29, 0) 100%),
      rgba(12, 22, 39, 0.78);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .ai-bridge-live-pill {
    border-left-color: rgba(53, 198, 255, 0.68);
    background: rgba(18, 38, 68, 0.88);
    color: var(--tera-cloud);
  }

  .ai-bridge-live-pill.is-ready {
    box-shadow: inset 0 0 0 1px rgba(53, 198, 255, 0.16);
  }

  .ai-bridge-primary-action {
    border-color: rgba(110, 190, 255, 0.26);
    background:
      radial-gradient(circle at 18% 22%, rgba(83, 235, 255, 0.2), transparent 34%),
      radial-gradient(circle at 82% 74%, rgba(255, 122, 168, 0.14), transparent 38%),
      linear-gradient(135deg, rgba(11, 22, 39, 0.96), rgba(16, 34, 61, 0.94));
    color: #f7fbff;
    box-shadow: 0 16px 28px rgba(8, 24, 52, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .ai-bridge-primary-action:hover {
    border-color: rgba(144, 214, 255, 0.34);
    background:
      radial-gradient(circle at 16% 20%, rgba(83, 235, 255, 0.24), transparent 36%),
      radial-gradient(circle at 80% 72%, rgba(255, 122, 168, 0.18), transparent 40%),
      linear-gradient(135deg, rgba(14, 28, 48, 0.98), rgba(20, 42, 74, 0.96));
    color: #ffffff;
  }

  .ai-bridge-primary-action .toolbar-button-label {
    font-weight: 750;
    letter-spacing: 0.01em;
  }

  .ai-bridge-connect-action:disabled,
  .ai-bridge-connect-action:disabled:hover,
  .ai-bridge-connect-action.is-disabled,
  .ai-bridge-connect-action.is-disabled:hover {
    border-color: rgba(92, 123, 168, 0.22);
    background:
      linear-gradient(135deg, rgba(11, 18, 31, 0.92), rgba(16, 24, 39, 0.9));
    color: rgba(188, 206, 233, 0.64);
    box-shadow: none;
  }

  .ai-diagnostics-section-block .toolbar-button {
    min-height: 40px;
    justify-content: flex-start;
  }

  .ai-diagnostics-section-block .toolbar-button-content {
    justify-content: flex-start;
  }

  #terajs-devtools-root[data-theme="light"] .ai-bridge-section--spotlight {
    border-color: rgba(38, 93, 203, 0.2);
    border-left-color: var(--tera-light-accent-strong);
    background:
      linear-gradient(180deg, rgba(63, 124, 255, 0.14), rgba(53, 198, 255, 0.05) 52%, rgba(255, 255, 255, 0) 100%),
      rgba(248, 251, 255, 0.96);
  }

  #terajs-devtools-root[data-theme="light"] .ai-bridge-live-pill {
    border-left-color: rgba(38, 93, 203, 0.44);
    background: rgba(236, 244, 255, 0.98);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-bridge-primary-action {
    border-color: rgba(38, 93, 203, 0.22);
    background:
      radial-gradient(circle at 18% 20%, rgba(83, 235, 255, 0.18), transparent 34%),
      radial-gradient(circle at 82% 76%, rgba(255, 122, 168, 0.12), transparent 36%),
      linear-gradient(135deg, rgba(16, 31, 57, 0.96), rgba(28, 54, 92, 0.94));
    color: #ffffff;
    box-shadow: 0 16px 28px rgba(26, 63, 124, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .ai-bridge-primary-action:hover {
    border-color: rgba(144, 214, 255, 0.3);
    background:
      radial-gradient(circle at 16% 20%, rgba(83, 235, 255, 0.22), transparent 36%),
      radial-gradient(circle at 80% 72%, rgba(255, 122, 168, 0.16), transparent 40%),
      linear-gradient(135deg, rgba(18, 35, 64, 0.98), rgba(31, 60, 102, 0.96));
    color: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .ai-bridge-connect-action:disabled,
  #terajs-devtools-root[data-theme="light"] .ai-bridge-connect-action:disabled:hover,
  #terajs-devtools-root[data-theme="light"] .ai-bridge-connect-action.is-disabled,
  #terajs-devtools-root[data-theme="light"] .ai-bridge-connect-action.is-disabled:hover {
    border-color: rgba(103, 130, 172, 0.24);
    background: linear-gradient(135deg, rgba(31, 46, 71, 0.84), rgba(44, 62, 92, 0.82));
    color: rgba(237, 245, 255, 0.72);
    box-shadow: none;
  }

`;
