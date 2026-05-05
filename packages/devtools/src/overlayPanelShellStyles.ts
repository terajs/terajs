export const overlayPanelShellStyles = `

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
`;