export const overlayShellComponentsStyles = `

  .devtools-host-controls-section {
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 10px 0 0;
    border: 0;
    border-top: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-section {
    border-color: var(--tera-separator);
    background: transparent;
  }

  .devtools-host-controls-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--tera-cloud);
  }

  .devtools-host-controls-button-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
    gap: 8px;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-scroll {
    scrollbar-color: rgba(47, 109, 255, 0.45) rgba(214, 226, 246, 0.82);
  }

  .devtools-title {
    font-family: var(--tera-heading-font);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--tera-cloud);
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-title {
    color: var(--tera-light-text-strong);
  }

  @media (max-width: 720px) {
    .overlay-frame {
      position: fixed;
      inset: 0;
      width: 100vw;
      max-width: 100vw;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
      border-left: 0;
      border-right: 0;
      border-bottom: 0;
    }

    .devtools-fab {
      position: fixed;
      right: 12px;
      bottom: 12px;
      min-width: 0;
      height: 40px;
      padding: 0 14px;
      z-index: 7;
    }

    .devtools-host-controls-panel {
      inset: 0;
      width: auto;
      border-radius: 0;
      border-left: 0;
      border-right: 0;
      border-bottom: 0;
      padding: 16px 14px 14px;
    }
  }

  .devtools-subtitle,
  .panel-subtitle,
  .muted-text,
  .tiny-muted,
  .metric-label {
    color: rgba(207, 223, 247, 0.82);
    font-size: 12px;
    line-height: 1.55;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-subtitle,
  #terajs-devtools-root[data-theme="light"] .panel-subtitle,
  #terajs-devtools-root[data-theme="light"] .muted-text,
  #terajs-devtools-root[data-theme="light"] .tiny-muted,
  #terajs-devtools-root[data-theme="light"] .metric-label {
    color: var(--tera-light-text-muted);
  }

  .devtools-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: contain;
  }

  .devtools-sidebar {
    display: flex;
    min-width: 0;
    min-height: 0;
  }

  .devtools-sidebar .devtools-tabs {
    width: 100%;
    height: auto;
  }

  .components-screen {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(220px, 40%) minmax(0, 1fr);
    flex: 1;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: contain;
    background: var(--tera-surface-page);
  }

  .components-screen.is-inspector-hidden {
    grid-template-rows: auto minmax(0, 1fr);
  }

  .components-screen--iframe {
    grid-template-rows: minmax(220px, 40%) minmax(0, 1fr);
  }

  .components-screen--iframe.is-inspector-hidden {
    grid-template-rows: minmax(0, 1fr);
  }

  .components-screen-sidebar {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .components-screen-sidebar .devtools-tabs {
    width: 100%;
    height: auto;
  }

  .components-screen-tree,
  .components-screen-inspector {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--tera-surface-pane);
  }

  .components-screen-tree {
    grid-column: 1;
    grid-row: 2;
    border-right: 0;
    border-bottom: 1px solid var(--tera-separator);
    background: var(--tera-surface-pane-strong);
  }

  .components-screen-inspector {
    grid-column: 1;
    grid-row: 3;
  }

  .components-screen--iframe .components-screen-tree {
    grid-row: 1;
  }

  .components-screen--iframe .components-screen-inspector {
    grid-row: 2;
  }

  .components-screen.is-inspector-hidden .components-screen-tree {
    border-right: 0;
    border-bottom: 0;
  }

  .components-screen-header {
    padding: 10px 12px 9px;
    border-bottom: 1px solid var(--tera-separator);
    background: transparent;
  }

  .components-screen-header-row {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .components-screen-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .components-screen-pill {
    display: inline-flex;
    align-items: center;
    min-height: 18px;
    padding: 0 0 0 10px;
    border: 0;
    border-left: 2px solid rgba(122, 99, 255, 0.42);
    border-radius: 0;
    background: transparent;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .components-screen-search,
  .components-screen-filter {
    width: 100%;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 6px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  .components-screen-search:focus,
  .components-screen-filter:focus {
    border-color: var(--tera-tone-accent);
    box-shadow: 0 0 0 1px var(--tera-tone-accent-soft);
  }

  .components-screen-filter:disabled {
    cursor: not-allowed;
    border-color: var(--tera-separator);
    background: var(--tera-surface-pane-muted);
    color: var(--tera-mist);
    box-shadow: none;
    opacity: 0.8;
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-search,
  #terajs-devtools-root[data-theme="light"] .components-screen-filter {
    background: var(--tera-surface-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-search:focus,
  #terajs-devtools-root[data-theme="light"] .components-screen-filter:focus {
    border-color: var(--tera-tone-accent);
    box-shadow: 0 0 0 1px var(--tera-tone-accent-soft), 0 10px 22px rgba(47, 109, 255, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-filter:disabled {
    border-color: #d0dbef;
    background: #edf3fc;
    color: var(--tera-light-text-muted);
    box-shadow: none;
  }

  .components-screen-header .component-tree-toolbar {
    margin-bottom: 0;
  }

  .components-screen-tree .components-screen-search {
    width: 100%;
  }

  .components-screen-body {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    padding: 12px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--tera-tone-accent) var(--tera-surface-pane-muted);
  }
`;