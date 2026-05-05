export const overlayShellHostStyles = `

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
`;