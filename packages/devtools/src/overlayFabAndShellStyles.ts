export const overlayFabAndShellStyles = `
  :host {
    all: initial;
  }

  .fab-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: auto;
  }

  .fab-shell.is-left {
    align-items: flex-start;
  }

  .fab-shell.is-center {
    align-items: center;
  }

  .fab-shell.is-top {
    flex-direction: column-reverse;
  }

  .devtools-fab {
    appearance: none;
    border: 1px solid rgba(50, 215, 255, 0.36);
    border-radius: 999px;
    background: linear-gradient(135deg, #2f6dff, #32d7ff);
    color: #ffffff;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.01em;
    min-width: 118px;
    height: 42px;
    padding: 0 18px;
    cursor: pointer;
    box-shadow: 0 12px 28px rgba(47, 109, 255, 0.32);
    transition: transform 120ms ease, box-shadow 140ms ease;
    position: relative;
    z-index: 3;
  }

  .devtools-fab:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(50, 215, 255, 0.28);
  }

  .devtools-fab:focus-visible {
    outline: 2px solid rgba(50, 215, 255, 0.75);
    outline-offset: 2px;
  }

  .overlay-frame {
    position: relative;
    width: min(var(--terajs-overlay-panel-width, 1040px), calc(100vw - 12px));
    max-width: calc(100vw - 12px);
    height: min(var(--terajs-overlay-panel-height, 720px), calc(100vh - 12px));
    max-height: calc(100vh - 12px);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--tera-shadow);
    background:
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.16), transparent 28%),
      radial-gradient(circle at bottom left, rgba(111, 109, 255, 0.16), transparent 34%),
      var(--tera-surface-page);
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
    z-index: 2;
  }

  .fab-shell.is-center .overlay-frame {
    transform-origin: bottom center;
  }

  .fab-shell.is-top .overlay-frame {
    transform-origin: top right;
  }

  .fab-shell.is-top.is-left .overlay-frame {
    transform-origin: top left;
  }

  .fab-shell.is-top.is-center .overlay-frame {
    transform-origin: top center;
  }

  @media (min-width: 861px) {
    .overlay-frame {
      width: min(var(--terajs-overlay-panel-width, 1040px), calc(100vw - 24px));
      max-width: calc(100vw - 24px);
      height: min(var(--terajs-overlay-panel-height, 720px), calc(100vh - 24px));
      max-height: calc(100vh - 24px);
      border-radius: 18px;
    }
  }

  .overlay-frame.is-hidden {
    display: none;
  }

  #terajs-devtools-root {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  #terajs-devtools-shell[data-theme="light"],
  #terajs-devtools-root[data-theme="light"] {
    color: var(--tera-light-text-strong);
  }

  .devtools-shell {
    --tera-sidebar-width: 100%;
    --tera-components-tree-width: minmax(0, 1fr);
    --tera-components-column-padding: 10px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--panel-bg, transparent);
    color: inherit;
  }

  .devtools-shell-stage {
    position: relative;
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .devtools-shell-stage > .devtools-body {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-shell {
    --panel-bg: var(--tera-light-shell-bg);
  }

  .devtools-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-areas: "brand active actions";
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--tera-border);
    background:
      radial-gradient(circle at 82% 14%, rgba(255, 112, 168, 0.14), transparent 26%),
      radial-gradient(circle at 18% -6%, rgba(80, 234, 255, 0.16), transparent 34%),
      linear-gradient(120deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.1) 58%, transparent),
      rgba(13, 19, 32, 0.94);
    backdrop-filter: blur(14px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      radial-gradient(circle at top right, rgba(255, 112, 168, 0.12), transparent 24%),
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.18), transparent 36%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.16), transparent 30%),
      radial-gradient(circle at center, rgba(50, 215, 255, 0.08), transparent 46%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(235, 245, 255, 0.93));
    border-bottom-color: var(--tera-light-border);
  }

  .devtools-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    grid-area: actions;
    justify-self: end;
    margin-left: 0;
  }

  .devtools-window-controls {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .devtools-window-controls .toolbar-button--window-control {
    width: 34px;
    min-width: 34px;
    min-height: 34px;
    border-radius: 8px;
    padding: 0;
    background: rgba(10, 17, 31, 0.4);
    color: rgba(222, 236, 255, 0.88);
    box-shadow: none;
  }

  .devtools-window-controls .toolbar-button--window-control:hover {
    background: rgba(53, 198, 255, 0.14);
    color: #f3fbff;
    transform: none;
  }

  .devtools-window-controls .toolbar-button--window-control.is-active {
    background: rgba(53, 198, 255, 0.16);
    border-color: rgba(103, 215, 255, 0.36);
    color: #f3fbff;
    box-shadow: inset 0 0 0 1px rgba(53, 198, 255, 0.14);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-window-controls .toolbar-button--window-control {
    background: rgba(255, 255, 255, 0.9);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-window-controls .toolbar-button--window-control:hover {
    background: #ffffff;
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-window-controls .toolbar-button--window-control.is-active {
    background: rgba(224, 240, 255, 0.92);
    border-color: var(--tera-light-border-strong);
    color: var(--tera-light-accent-strong);
    box-shadow: inset 0 0 0 1px rgba(79, 140, 255, 0.14);
  }

  .devtools-header-center {
    grid-area: active;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    justify-self: center;
  }

  .devtools-host-controls-panel {
    position: absolute;
    inset: 12px;
    z-index: 6;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
    padding: 12px;
    overflow: hidden;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 8px;
    background: var(--tera-surface-pane);
    box-shadow: none;
    backdrop-filter: blur(18px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-panel {
    border-color: var(--tera-separator);
    background: var(--tera-surface-pane);
  }

  @media (min-width: 901px) {
    .devtools-host-controls-panel {
      inset: 14px 14px 14px auto;
      width: min(420px, calc(100% - 28px));
    }
  }

  .devtools-host-controls-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--tera-separator);
  }

  .devtools-host-controls-scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
    display: grid;
    gap: 8px;
    padding-right: 0;
  }

  .devtools-host-controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
    align-content: start;
  }

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

  .components-screen-inspector .components-screen-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-x: hidden;
  }

  .ai-panel-screen .components-screen-inspector .components-screen-body {
    overflow: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-body {
    scrollbar-color: var(--tera-tone-accent) var(--tera-surface-pane-muted);
  }

  .components-screen-inspector .component-drilldown-shell {
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;
  }

  .component-drilldown-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 8px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  .devtools-fab-cluster {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px;
    border: 1px solid rgba(116, 192, 255, 0.28);
    border-radius: 999px;
    background:
      radial-gradient(circle at 18% 28%, rgba(75, 230, 255, 0.18), transparent 32%),
      radial-gradient(circle at 84% 72%, rgba(255, 112, 168, 0.16), transparent 36%),
      linear-gradient(135deg, rgba(6, 14, 28, 0.98), rgba(10, 20, 37, 0.92));
    box-shadow: 0 14px 28px rgba(4, 10, 22, 0.28), 0 0 22px rgba(53, 198, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(18px);
  }

  .devtools-fab-cluster::before {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: inherit;
    background:
      radial-gradient(circle at 18% 20%, rgba(75, 230, 255, 0.24), transparent 36%),
      radial-gradient(circle at 82% 78%, rgba(255, 112, 168, 0.18), transparent 40%);
    filter: blur(18px);
    opacity: 0.48;
    pointer-events: none;
    z-index: -1;
  }

  .devtools-fab {
    min-width: 128px;
    height: 42px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border-color: rgba(144, 214, 255, 0.28);
    background:
      radial-gradient(circle at 18% 20%, rgba(83, 235, 255, 0.16), transparent 34%),
      radial-gradient(circle at 82% 76%, rgba(255, 122, 168, 0.12), transparent 38%),
      linear-gradient(135deg, rgba(9, 16, 28, 0.98), rgba(17, 29, 48, 0.96));
    color: #f8fbff;
    font-weight: 760;
    letter-spacing: 0.02em;
    text-shadow: none;
    box-shadow: 0 12px 24px rgba(8, 24, 52, 0.28), 0 0 20px rgba(76, 123, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .devtools-fab-label {
    font-size: 14px;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(120deg, #dbfbff 0%, #83ebff 22%, #8fe1ff 48%, #ffd0de 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: none;
  }

  .devtools-fab:hover {
    transform: translateY(-1px);
    border-color: rgba(164, 223, 255, 0.36);
    background:
      radial-gradient(circle at 18% 20%, rgba(83, 235, 255, 0.2), transparent 36%),
      radial-gradient(circle at 82% 76%, rgba(255, 122, 168, 0.16), transparent 40%),
      linear-gradient(135deg, rgba(12, 20, 34, 0.99), rgba(21, 35, 58, 0.97));
    box-shadow: 0 14px 28px rgba(8, 24, 52, 0.34), 0 0 22px rgba(76, 123, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    filter: none;
  }

  .devtools-fab-switch {
    appearance: none;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(118, 196, 255, 0.28);
    border-radius: 999px;
    background:
      radial-gradient(circle at 28% 24%, rgba(75, 230, 255, 0.22), transparent 34%),
      radial-gradient(circle at 74% 76%, rgba(255, 112, 168, 0.16), transparent 38%),
      linear-gradient(140deg, rgba(12, 23, 42, 0.92), rgba(14, 26, 48, 0.88));
    color: #8fe9ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 18px rgba(8, 17, 32, 0.22);
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
  }

  .devtools-fab-switch:hover {
    transform: translateY(-1px);
    border-color: rgba(144, 214, 255, 0.44);
    background:
      radial-gradient(circle at 26% 22%, rgba(75, 230, 255, 0.28), transparent 36%),
      radial-gradient(circle at 74% 74%, rgba(255, 112, 168, 0.18), transparent 40%),
      linear-gradient(140deg, rgba(16, 29, 54, 0.96), rgba(18, 33, 58, 0.9));
  }

  .devtools-fab-switch.is-active {
    border-color: rgba(144, 214, 255, 0.56);
    background: linear-gradient(135deg, rgba(47, 109, 255, 0.46), rgba(53, 198, 255, 0.32), rgba(255, 112, 168, 0.18));
    color: #fef6ff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 22px rgba(53, 198, 255, 0.2);
  }

  .devtools-fab-switch:focus-visible {
    outline: 2px solid rgba(53, 198, 255, 0.72);
    outline-offset: 2px;
  }

  .devtools-fab-switch-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    filter: drop-shadow(0 0 10px rgba(53, 198, 255, 0.22));
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab-cluster {
    border-color: var(--tera-separator-strong);
    background:
      radial-gradient(circle at 16% 18%, rgba(63, 124, 255, 0.12), transparent 36%),
      radial-gradient(circle at 84% 74%, rgba(106, 84, 215, 0.08), transparent 38%),
      linear-gradient(135deg, rgba(246, 249, 253, 0.96), rgba(229, 236, 245, 0.94));
    box-shadow: 0 14px 28px rgba(88, 109, 145, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.72);
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab-cluster::before {
    background:
      radial-gradient(circle at 18% 20%, rgba(63, 124, 255, 0.18), transparent 36%),
      radial-gradient(circle at 82% 78%, rgba(106, 84, 215, 0.12), transparent 40%);
    opacity: 0.28;
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab {
    border-color: var(--tera-separator-strong);
    background:
      radial-gradient(circle at 18% 20%, rgba(63, 124, 255, 0.12), transparent 34%),
      radial-gradient(circle at 82% 76%, rgba(11, 122, 153, 0.08), transparent 38%),
      linear-gradient(135deg, rgba(251, 253, 255, 0.96), rgba(236, 242, 249, 0.94));
    color: var(--tera-light-text-strong);
    box-shadow: 0 12px 24px rgba(88, 109, 145, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab-label {
    background: linear-gradient(120deg, #1f4a8a 0%, #2f6ec7 48%, #0b7a99 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab:hover {
    border-color: rgba(101, 130, 172, 0.28);
    background:
      radial-gradient(circle at 18% 20%, rgba(63, 124, 255, 0.15), transparent 36%),
      radial-gradient(circle at 82% 76%, rgba(11, 122, 153, 0.1), transparent 40%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(239, 245, 251, 0.96));
    box-shadow: 0 14px 28px rgba(88, 109, 145, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.84);
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab-switch {
    border-color: var(--tera-separator-strong);
    background: linear-gradient(140deg, rgba(246, 249, 253, 0.96), rgba(230, 237, 246, 0.94));
    color: var(--tera-light-accent-strong);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 8px 18px rgba(88, 109, 145, 0.14);
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab-switch:hover {
    border-color: rgba(101, 130, 172, 0.28);
    background: linear-gradient(140deg, rgba(251, 253, 255, 0.98), rgba(236, 242, 249, 0.96));
  }

  #terajs-devtools-shell[data-theme="light"] .devtools-fab-switch.is-active {
    border-color: rgba(63, 124, 255, 0.32);
    background:
      linear-gradient(135deg, rgba(63, 124, 255, 0.22), rgba(11, 122, 153, 0.14), rgba(106, 84, 215, 0.12)),
      linear-gradient(140deg, rgba(246, 249, 253, 0.96), rgba(232, 239, 247, 0.94));
    color: var(--tera-light-accent-strong);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78), 0 0 18px rgba(63, 124, 255, 0.14);
  }

  .overlay-frame {
    background: var(--tera-shell-bg);
  }

  .devtools-shell {
    background: transparent;
  }

  .devtools-header {
    gap: 12px;
    padding: 14px 18px 12px;
    border-bottom: 1px solid var(--tera-border);
    background:
      linear-gradient(180deg, rgba(9, 17, 31, 0.82), rgba(9, 17, 31, 0.7)),
      radial-gradient(circle at top left, rgba(76, 123, 255, 0.14), transparent 34%);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(246, 250, 255, 0.76)),
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.12), transparent 34%);
  }

  .devtools-brand {
    display: flex;
    align-items: center;
    min-width: 0;
    grid-area: brand;
    justify-self: start;
  }

  .devtools-brand-mark {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(108, 147, 255, 0.22);
    background: linear-gradient(135deg, rgba(63, 124, 255, 0.16), rgba(122, 99, 255, 0.1));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--tera-cloud);
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-brand-mark {
    color: var(--tera-light-text-strong);
    background: linear-gradient(135deg, rgba(63, 124, 255, 0.18), rgba(53, 198, 255, 0.1) 58%, rgba(106, 84, 215, 0.14));
  }

  .devtools-brand-copy {
    display: grid;
    gap: 1px;
    min-width: 0;
    align-content: center;
  }

  .devtools-brand-heading {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .devtools-kicker {
    color: var(--tera-cyan);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-kicker {
    color: var(--tera-light-accent-strong);
  }

  .devtools-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.02em;
    text-transform: none;
  }

  .devtools-active-view {
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
    text-align: center;
    text-shadow: 0 0 16px rgba(242, 247, 255, 0.14);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-active-view {
    color: var(--tera-light-accent-strong);
  }

  .devtools-subtitle {
    font-size: 11px;
    letter-spacing: 0.01em;
    line-height: 1.5;
  }

  .devtools-status-rail {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .devtools-status-pill {
    display: grid;
    align-content: center;
    gap: 2px;
    min-height: 0;
    padding: 0 0 0 10px;
    border: 0;
    border-left: 1px solid rgba(108, 147, 255, 0.28);
    border-radius: 0;
    background: transparent;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-status-pill {
    color: var(--tera-light-text-strong);
    border-left-color: rgba(106, 84, 215, 0.22);
  }

  .devtools-status-label {
    color: var(--tera-mist);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .devtools-status-value {
    font-family: var(--tera-heading-font);
    font-size: 12px;
    font-weight: 550;
    letter-spacing: -0.01em;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-status-label {
    color: var(--tera-light-text-muted);
  }

  .devtools-body {
    gap: 0;
  }

  .devtools-sidebar {
    padding: 0;
  }

  .devtools-sidebar-frame,
  .components-screen-sidebar {
    width: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    position: relative;
    background: var(--tera-surface-sidebar);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar-frame,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar {
    background: var(--tera-surface-sidebar);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree {
    background: var(--tera-surface-pane);
    border-bottom-color: var(--tera-separator);
  }

  .devtools-sidebar-frame::after,
  .components-screen-sidebar::after {
    content: "";
    position: absolute;
    top: 10px;
    bottom: 10px;
    right: 0;
    width: 1px;
    background: linear-gradient(180deg, transparent, var(--tera-tone-accent-soft), transparent);
    box-shadow: 0 0 14px var(--tera-tone-accent-soft);
    pointer-events: none;
  }

  .devtools-canvas {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 0;
    display: flex;
    overflow: hidden;
  }

  @media (max-width: 720px) {
    .devtools-fab-cluster {
      position: fixed;
      right: 12px;
      bottom: 12px;
      z-index: 7;
    }

    .devtools-fab,
    .devtools-fab-switch {
      position: static;
    }

    .devtools-header {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        "brand actions"
        "active active";
      padding: 12px 12px 10px;
    }

    .devtools-status-rail {
      width: 100%;
      margin-left: 0;
    }

    .devtools-brand-heading {
      gap: 8px;
    }

    .devtools-header-center {
      justify-self: center;
      padding-top: 2px;
    }

    .devtools-active-view {
      font-size: 12px;
      letter-spacing: 0.08em;
    }

    .devtools-canvas {
      padding: 0;
    }
  }

`;
