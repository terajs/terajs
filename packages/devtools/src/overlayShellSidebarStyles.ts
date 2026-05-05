export const overlayShellSidebarStyles = `

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