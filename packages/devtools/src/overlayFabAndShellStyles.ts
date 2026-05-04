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
    --tera-black: #05070f;
    --tera-carbon: #0d1320;
    --tera-graphite: #1d2940;
    --tera-blue: #2f6dff;
    --tera-cyan: #32d7ff;
    --tera-purple: #6f6dff;
    --tera-mist: #93a7cb;
    --tera-cloud: #f2f7ff;
    --tera-body-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --tera-heading-font: "Space Grotesk", "Inter", sans-serif;
    --tera-code-font: "JetBrains Mono", "Fira Code", monospace;
    --tera-surface: var(--tera-carbon);
    --tera-border: rgba(147, 167, 203, 0.18);
    --tera-panel-glow: linear-gradient(145deg, rgba(47, 109, 255, 0.16), rgba(50, 215, 255, 0.11) 44%, rgba(111, 109, 255, 0.1));
    --tera-shadow: 0 24px 60px rgba(2, 8, 20, 0.52);
    --tera-surface-page: linear-gradient(180deg, rgba(8, 15, 27, 0.98), rgba(5, 9, 18, 0.98));
    --tera-surface-pane: rgba(11, 20, 36, 0.88);
    --tera-surface-pane-muted: rgba(9, 17, 31, 0.78);
    --tera-surface-pane-strong: rgba(13, 24, 43, 0.94);
    --tera-surface-row-hover: rgba(24, 39, 63, 0.52);
    --tera-surface-row-active: rgba(30, 48, 78, 0.78);
    --tera-surface-raised: rgba(14, 26, 45, 0.92);
    --tera-surface-section: rgba(12, 22, 38, 0.72);
    --tera-surface-section-strong: rgba(10, 19, 33, 0.94);
    --tera-separator: rgba(145, 173, 214, 0.12);
    --tera-separator-strong: rgba(145, 173, 214, 0.18);
    --tera-tone-accent: rgba(53, 198, 255, 0.78);
    --tera-tone-accent-soft: rgba(53, 198, 255, 0.16);
    --tera-tone-warn: rgba(232, 136, 62, 0.84);
    --tera-tone-warn-soft: rgba(232, 136, 62, 0.18);
    --tera-tone-error: rgba(255, 107, 139, 0.84);
    --tera-tone-error-soft: rgba(255, 107, 139, 0.16);
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

  #terajs-devtools-root[data-theme="light"] {
    --tera-light-text-strong: var(--tera-light-cyan-ink);
    --tera-light-text-soft: #5f5ed9;
    --tera-light-text-muted: #746fe8;
    --tera-light-accent: #2f6dff;
    --tera-light-accent-strong: #1f58d6;
    --tera-light-accent-violet: #5a4fd4;
    --tera-light-accent-soft: rgba(47, 109, 255, 0.14);
    --tera-light-accent-soft-strong: rgba(47, 109, 255, 0.22);
    --tera-light-border: rgba(79, 140, 255, 0.28);
    --tera-light-border-strong: rgba(88, 201, 255, 0.34);
    --tera-light-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(47, 109, 255, 0.24), transparent 30%),
      radial-gradient(circle at 92% 8%, rgba(90, 79, 212, 0.2), transparent 26%),
      radial-gradient(circle at 70% 32%, rgba(50, 215, 255, 0.16), transparent 24%),
      linear-gradient(180deg, rgba(251, 254, 255, 0.99), rgba(230, 242, 255, 0.98));
    --tera-light-panel-bg:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 34%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.11), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(235, 245, 255, 0.98));
    --tera-light-panel-alt:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 32%),
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.1), transparent 28%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
    --tera-light-panel-emphasis:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.18), transparent 38%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 30%),
      linear-gradient(180deg, rgba(238, 246, 255, 0.99), rgba(216, 225, 255, 0.97));
    --tera-light-panel-raised: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 246, 255, 0.96));
    --tera-light-panel-raised-soft: linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(231, 241, 255, 0.97));
    --tera-light-shadow: 0 18px 38px rgba(47, 109, 255, 0.16), 0 0 26px rgba(90, 79, 212, 0.12);
    --tera-light-cyan-ink: #0b7ea6;
    --tera-light-purple-ink: #5647c8;
    --tera-light-red-ink: #b2204f;
    --tera-light-amber-ink: #9a4d17;
    --tera-light-mint-ink: #0f8d77;
    --tera-surface-page: linear-gradient(180deg, rgba(250, 253, 255, 0.99), rgba(232, 241, 255, 0.98));
    --tera-surface-pane: rgba(255, 255, 255, 0.88);
    --tera-surface-pane-muted: rgba(246, 250, 255, 0.82);
    --tera-surface-pane-strong: rgba(240, 247, 255, 0.96);
    --tera-surface-row-hover: rgba(73, 126, 255, 0.08);
    --tera-surface-row-active: rgba(73, 126, 255, 0.14);
    --tera-surface-raised: rgba(255, 255, 255, 0.94);
    --tera-surface-section: rgba(248, 251, 255, 0.86);
    --tera-surface-section-strong: rgba(242, 248, 255, 0.96);
    --tera-separator: rgba(112, 148, 214, 0.12);
    --tera-separator-strong: rgba(112, 148, 214, 0.18);
    --tera-tone-accent: rgba(63, 124, 255, 0.82);
    --tera-tone-accent-soft: rgba(63, 124, 255, 0.14);
    --tera-tone-warn: rgba(214, 115, 42, 0.84);
    --tera-tone-warn-soft: rgba(214, 115, 42, 0.16);
    --tera-tone-error: rgba(178, 32, 79, 0.84);
    --tera-tone-error-soft: rgba(178, 32, 79, 0.14);
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
    height: 40px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border-color: rgba(122, 174, 255, 0.34);
    background: linear-gradient(135deg, rgba(8, 20, 43, 0.98), rgba(16, 42, 82, 0.94));
    color: #f8fbff;
    font-weight: 650;
    letter-spacing: 0.01em;
    text-shadow: none;
    box-shadow: 0 10px 22px rgba(8, 24, 52, 0.34), 0 0 18px rgba(76, 123, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .devtools-fab-label {
    background: linear-gradient(120deg, #83ebff 0%, #4c7bff 36%, #8a7dff 68%, #ff7aa8 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: none;
  }

  .devtools-fab:hover {
    transform: translateY(-1px);
    border-color: rgba(137, 191, 255, 0.42);
    background: linear-gradient(135deg, rgba(11, 27, 56, 0.98), rgba(20, 50, 96, 0.94));
    box-shadow: 0 14px 28px rgba(8, 24, 52, 0.4), 0 0 22px rgba(76, 123, 255, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.1);
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

  .overlay-frame {
    --tera-black: #07101d;
    --tera-carbon: #0f192a;
    --tera-graphite: #18263d;
    --tera-blue: #4c7bff;
    --tera-cyan: #35c6ff;
    --tera-purple: #7a63ff;
    --tera-mint: #39d3b0;
    --tera-amber: #ffbf66;
    --tera-rose: #ff7196;
    --tera-title-ink: var(--tera-cyan);
    --tera-tone-primary: #9cb8ff;
    --tera-tone-primary-soft: rgba(156, 184, 255, 0.16);
    --tera-tone-primary-muted: rgba(156, 184, 255, 0.8);
    --tera-tone-info: #8ddfff;
    --tera-tone-info-soft: rgba(53, 198, 255, 0.16);
    --tera-tone-info-muted: rgba(141, 223, 255, 0.78);
    --tera-tone-tertiary: #c7b8ff;
    --tera-tone-tertiary-soft: rgba(122, 99, 255, 0.16);
    --tera-tone-tertiary-muted: rgba(199, 184, 255, 0.8);
    --tera-tone-success: #7fe2c4;
    --tera-tone-success-soft: rgba(57, 211, 176, 0.16);
    --tera-tone-success-muted: rgba(127, 226, 196, 0.78);
    --tera-tone-warn-muted: rgba(255, 198, 129, 0.82);
    --tera-tone-error-muted: rgba(255, 158, 184, 0.82);
    --tera-tone-label: rgba(157, 193, 243, 0.82);
    --tera-mist: #9db3d6;
    --tera-cloud: #eef5ff;
    --tera-border: rgba(145, 173, 214, 0.14);
    --tera-border-strong: rgba(108, 147, 255, 0.22);
    --tera-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(76, 123, 255, 0.18), transparent 30%),
      radial-gradient(circle at 100% 8%, rgba(122, 99, 255, 0.14), transparent 26%),
      radial-gradient(circle at 74% 28%, rgba(57, 211, 176, 0.08), transparent 22%),
      linear-gradient(180deg, rgba(7, 16, 29, 0.98), rgba(10, 18, 31, 0.97));
    --tera-panel-glow: linear-gradient(145deg, rgba(76, 123, 255, 0.08), rgba(53, 198, 255, 0.04) 48%, rgba(122, 99, 255, 0.05));
    --tera-shadow: 0 28px 62px rgba(2, 8, 20, 0.48);
    background: var(--tera-shell-bg);
  }

  #terajs-devtools-root[data-theme="light"] {
    --tera-light-text-strong: #17396a;
    --tera-light-text-soft: #526ea7;
    --tera-light-text-muted: #6780af;
    --tera-light-accent: #3f7cff;
    --tera-light-accent-strong: #265dcb;
    --tera-light-accent-violet: #6a54d7;
    --tera-light-accent-soft: rgba(63, 124, 255, 0.12);
    --tera-light-accent-soft-strong: rgba(63, 124, 255, 0.2);
    --tera-light-border: rgba(112, 148, 214, 0.24);
    --tera-light-border-strong: rgba(63, 124, 255, 0.32);
    --tera-light-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(63, 124, 255, 0.18), transparent 30%),
      radial-gradient(circle at 100% 8%, rgba(106, 84, 215, 0.14), transparent 26%),
      radial-gradient(circle at 74% 28%, rgba(57, 211, 176, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(249, 252, 255, 0.99), rgba(232, 241, 252, 0.98));
    --tera-light-panel-bg:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.1), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(240, 246, 255, 0.96));
    --tera-light-panel-alt:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.11), transparent 34%),
      radial-gradient(circle at top right, rgba(106, 84, 215, 0.08), transparent 28%),
      linear-gradient(180deg, rgba(245, 250, 255, 0.98), rgba(233, 242, 255, 0.97));
    --tera-light-panel-emphasis:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.14), transparent 38%),
      radial-gradient(circle at top right, rgba(53, 198, 255, 0.1), transparent 28%),
      linear-gradient(180deg, rgba(237, 245, 255, 0.98), rgba(221, 233, 252, 0.97));
    --tera-light-panel-raised: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.95));
    --tera-light-panel-raised-soft: linear-gradient(180deg, rgba(248, 252, 255, 0.96), rgba(238, 245, 255, 0.95));
    --tera-light-shadow: 0 20px 40px rgba(63, 124, 255, 0.12);
    --tera-light-cyan-ink: #0b7a99;
    --tera-light-purple-ink: #5c44c9;
    --tera-light-red-ink: #ae2d58;
    --tera-light-amber-ink: #a5541a;
    --tera-light-mint-ink: #0f8570;
    --tera-title-ink: var(--tera-light-cyan-ink);
    --tera-tone-primary: #265dcb;
    --tera-tone-primary-soft: rgba(38, 93, 203, 0.1);
    --tera-tone-primary-muted: rgba(38, 93, 203, 0.78);
    --tera-tone-info: var(--tera-light-cyan-ink);
    --tera-tone-info-soft: rgba(11, 122, 153, 0.1);
    --tera-tone-info-muted: rgba(11, 122, 153, 0.76);
    --tera-tone-tertiary: var(--tera-light-purple-ink);
    --tera-tone-tertiary-soft: rgba(92, 68, 201, 0.1);
    --tera-tone-tertiary-muted: rgba(92, 68, 201, 0.76);
    --tera-tone-success: var(--tera-light-mint-ink);
    --tera-tone-success-soft: rgba(15, 133, 112, 0.1);
    --tera-tone-success-muted: rgba(15, 133, 112, 0.76);
    --tera-tone-warn-muted: rgba(165, 84, 26, 0.78);
    --tera-tone-error-muted: rgba(174, 45, 88, 0.78);
    --tera-tone-label: #4b79bf;
    --tera-surface-page: linear-gradient(180deg, rgba(250, 253, 255, 0.99), rgba(232, 241, 255, 0.98));
    --tera-surface-pane: rgba(255, 255, 255, 0.88);
    --tera-surface-pane-muted: rgba(246, 250, 255, 0.82);
    --tera-surface-pane-strong: rgba(240, 247, 255, 0.96);
    --tera-surface-row-hover: rgba(73, 126, 255, 0.08);
    --tera-surface-row-active: rgba(73, 126, 255, 0.14);
    --tera-surface-raised: rgba(255, 255, 255, 0.94);
    --tera-surface-section: rgba(248, 251, 255, 0.86);
    --tera-surface-section-strong: rgba(242, 248, 255, 0.96);
    --tera-separator: rgba(112, 148, 214, 0.12);
    --tera-separator-strong: rgba(112, 148, 214, 0.18);
    --tera-tone-accent: rgba(63, 124, 255, 0.82);
    --tera-tone-accent-soft: rgba(63, 124, 255, 0.14);
    --tera-tone-warn: rgba(214, 115, 42, 0.84);
    --tera-tone-warn-soft: rgba(214, 115, 42, 0.16);
    --tera-tone-error: rgba(178, 32, 79, 0.84);
    --tera-tone-error-soft: rgba(178, 32, 79, 0.14);
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
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar-frame,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar {
    background: var(--tera-surface-pane-muted);
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
