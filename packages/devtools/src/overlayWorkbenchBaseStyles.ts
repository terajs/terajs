export const overlayWorkbenchBaseStyles = `

  .devtools-workbench,
  .devtools-utility-panel {
    width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0;
    flex: 1 1 auto;
    background: var(--tera-surface-page);
  }

  .devtools-workbench {
    display: grid;
    grid-template-columns: clamp(260px, 27vw, 340px) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
    height: 100%;
    gap: 0;
    overflow: hidden;
    align-items: stretch;
  }

  .devtools-utility-panel {
    overflow: hidden;
  }

  .devtools-workbench-sidebar,
  .devtools-workbench-main,
  .devtools-utility-panel {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .devtools-workbench-sidebar {
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    background: var(--tera-surface-pane);
    box-shadow: none;
  }

  .devtools-workbench-main,
  .devtools-utility-panel {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-workbench-main {
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    background: var(--tera-surface-pane-muted);
    box-shadow: none;
  }

  .devtools-workbench-header,
  .devtools-utility-panel-header {
    display: grid;
    gap: 8px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--tera-separator-strong);
    background: var(--tera-surface-pane-strong);
  }

  .devtools-workbench-main-header,
  .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
  }

  .devtools-workbench-title {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .devtools-workbench-subtitle {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.55;
  }

  .devtools-workbench-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .workbench-search {
    flex: 1 1 240px;
    min-width: 0;
  }

  .workbench-search-input {
    width: 100%;
    height: 36px;
    padding: 0 11px;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 10px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    font-size: 12px;
    line-height: 1.4;
    outline: none;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }

  .workbench-search-input::placeholder {
    color: rgba(147, 167, 203, 0.58);
  }

  .workbench-search-input:focus {
    border-color: var(--tera-tone-accent);
    background: var(--tera-surface-pane-strong);
    box-shadow: none;
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body,
  .devtools-utility-panel-body {
    flex: 1;
    min-height: 0;
    height: 100%;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 12px;
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body {
    overflow: auto;
    padding: 14px;
  }

  .devtools-utility-panel-body {
    overflow: auto;
  }

  .devtools-workbench-list {
    display: grid;
    gap: 4px;
    align-content: flex-start;
  }

  .devtools-workbench-list-group {
    padding: 8px 4px 2px;
    color: var(--tera-tone-label);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .devtools-workbench-list-item {
    appearance: none;
    width: 100%;
    display: grid;
    gap: 6px;
    padding: 11px 12px;
    border: 1px solid rgba(48, 72, 108, 0.82);
    border-left: 2px solid rgba(109, 158, 232, 0.4);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(11, 22, 39, 0.96), rgba(14, 25, 44, 0.92));
    color: var(--tera-cloud);
    text-align: left;
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .devtools-workbench-list-item:hover {
    background: linear-gradient(180deg, rgba(18, 33, 56, 0.98), rgba(15, 29, 49, 0.94));
    border-color: rgba(103, 181, 255, 0.34);
  }

  .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(20, 45, 74, 0.98), rgba(17, 34, 58, 0.96));
    border-color: rgba(103, 215, 255, 0.58);
    border-left-color: rgba(103, 215, 255, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(53, 198, 255, 0.08);
  }

  .devtools-workbench-list-item.is-error {
    border-color: rgba(255, 107, 139, 0.28);
    border-left-color: var(--tera-tone-error);
    background: linear-gradient(180deg, rgba(34, 18, 28, 0.96), rgba(18, 16, 28, 0.9));
  }

  .devtools-workbench-list-item.is-warn {
    border-color: rgba(232, 136, 62, 0.32);
    border-left-color: var(--tera-tone-warn);
    background: linear-gradient(180deg, rgba(36, 24, 14, 0.96), rgba(19, 16, 22, 0.92));
  }

  .devtools-workbench-list-item-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .devtools-workbench-list-item-title {
    min-width: 0;
    color: var(--tera-cloud);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  .devtools-workbench-list-item-badge {
    margin-left: auto;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(39, 63, 102, 0.84);
    color: rgba(236, 245, 255, 0.92);
    font-family: var(--tera-code-font);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .devtools-workbench-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
  }

  .devtools-workbench-fact {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .devtools-workbench-fact-label {
    color: var(--tera-tone-label);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .devtools-workbench-fact-value {
    color: var(--tera-cloud);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .devtools-workbench-lead {
    color: rgba(231, 240, 255, 0.92);
    font-size: 13px;
    line-height: 1.65;
  }

  .devtools-workbench-intro {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid #263753;
    border-radius: 18px;
    background: #0b1627;
  }

  .devtools-workbench-intro-copy {
    display: grid;
    gap: 6px;
  }

  .devtools-workbench-intro-title {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 16px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .devtools-workbench-intro-description {
    color: rgba(227, 238, 255, 0.82);
    font-size: 13px;
    line-height: 1.7;
    max-width: 72ch;
  }

  .devtools-workbench-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .devtools-workbench-metric {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid rgba(52, 79, 118, 0.78);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(16, 26, 45, 0.94), rgba(12, 21, 35, 0.9));
  }
`;