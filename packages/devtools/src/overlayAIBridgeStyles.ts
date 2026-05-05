export const overlayAIBridgeStyles = `

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