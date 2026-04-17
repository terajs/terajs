export const componentTreeStyles = `
  .components-tree-pane {
    --component-tree-guide-dark: rgba(118, 164, 238, 0.3);
    --component-tree-guide-light: rgba(79, 152, 255, 0.36);
    --component-tree-label-dark: #dce9ff;
    --component-tree-label-light: var(--tera-light-text-strong);
    --component-tree-meta-dark: rgba(170, 192, 230, 0.68);
    --component-tree-meta-light: var(--tera-light-text-muted);
    --component-tree-bracket-dark: rgba(120, 177, 255, 0.84);
    --component-tree-bracket-light: rgba(88, 201, 255, 0.96);
    --component-tree-accent-dark: rgba(97, 156, 255, 0.88);
    --component-tree-accent-light: rgba(73, 126, 255, 0.96);
    --component-tree-hover-dark: rgba(20, 40, 82, 0.52);
    --component-tree-hover-light: linear-gradient(90deg, rgba(47, 109, 255, 0.18), rgba(90, 79, 212, 0.12), rgba(50, 215, 255, 0.1));
    --component-tree-active-dark: rgba(34, 66, 124, 0.58);
    --component-tree-active-light: linear-gradient(90deg, rgba(47, 109, 255, 0.26), rgba(90, 79, 212, 0.16), rgba(50, 215, 255, 0.14));
    --component-tree-toggle-dark: #8fb9ff;
    --component-tree-toggle-light: var(--tera-light-accent-strong);
    --component-tree-toggle-hover-dark: rgba(29, 51, 95, 0.64);
    --component-tree-toggle-hover-light: rgba(72, 123, 255, 0.22);
    --component-tree-toggle-expanded-dark: rgba(34, 58, 106, 0.5);
    --component-tree-toggle-expanded-light: rgba(72, 123, 255, 0.3);
  }

  .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
  }

  #terajs-devtools-root[data-theme="light"] .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .component-tree-toolbar {
    margin-top: 0;
    margin-bottom: 10px;
  }

  .component-tree-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1px;
  }

  .component-tree-children {
    margin-top: 2px;
    padding-left: 0;
  }

  .component-tree-node.has-children.is-expanded > .component-tree-children {
    position: relative;
  }

  .component-tree-node.has-children.is-expanded > .component-tree-children::before {
    display: none;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-node.has-children.is-expanded > .component-tree-children::before {
    display: none;
  }

  .component-tree-node {
    --component-tree-depth: 0;
    margin: 0;
    padding: 0;
  }

  .component-tree-row {
    position: relative;
    display: grid;
    grid-template-columns: auto 12px 20px minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding-left: calc(var(--component-tree-depth) * 6px);
  }

  .component-tree-guides {
    display: inline-flex;
    align-self: stretch;
    justify-self: end;
  }

  .tree-indent-guide {
    position: relative;
    width: 12px;
    min-width: 12px;
    align-self: stretch;
  }

  .tree-indent-guide.is-continuing::before {
    content: "";
    position: absolute;
    left: 50%;
    top: -8px;
    bottom: -8px;
    width: 1px;
    transform: translateX(-0.5px);
    background: var(--component-tree-guide-dark);
  }

  #terajs-devtools-root[data-theme="light"] .tree-indent-guide.is-continuing::before {
    background: var(--component-tree-guide-light);
  }

  .component-tree-branch {
    display: block;
    position: relative;
    width: 12px;
    min-width: 12px;
    align-self: stretch;
  }

  .component-tree-branch.is-root {
    opacity: 0;
  }

  .component-tree-branch.is-branching::before,
  .component-tree-branch.is-terminal::before {
    content: "";
    position: absolute;
    left: 50%;
    width: 1px;
    transform: translateX(-0.5px);
    background: var(--component-tree-guide-dark);
  }

  .component-tree-branch.is-branching::before {
    top: -8px;
    bottom: -8px;
  }

  .component-tree-branch.is-terminal::before {
    top: -8px;
    bottom: 50%;
  }

  .component-tree-branch.is-branching::after,
  .component-tree-branch.is-terminal::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 10px;
    height: 1px;
    transform: translateY(-0.5px);
    background: var(--component-tree-guide-dark);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-branching::before,
  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-terminal::before,
  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-branching::after,
  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-terminal::after {
    background: var(--component-tree-guide-light);
  }

  .component-tree-toggle {
    appearance: none;
    width: 20px;
    min-width: 20px;
    height: 20px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--component-tree-toggle-dark);
    cursor: pointer;
    font: inherit;
    font-size: 17px;
    font-weight: 700;
    line-height: 1;
    display: inline-grid;
    place-items: center;
    padding: 0;
    align-self: center;
    transition: background 140ms ease, color 140ms ease, transform 140ms ease;
  }

  .component-tree-chevron {
    width: 16px;
    display: inline-grid;
    place-items: center;
    transform: translateY(-0.5px);
  }

  .component-tree-toggle:hover {
    background: var(--component-tree-toggle-hover-dark);
    color: #f4f8ff;
  }

  .component-tree-toggle.is-placeholder {
    cursor: default;
    opacity: 0;
    pointer-events: none;
  }

  .component-tree-node.is-expanded > .component-tree-row .component-tree-toggle {
    background: var(--component-tree-toggle-expanded-dark);
    color: #eff5ff;
  }

  .component-tree-select {
    appearance: none;
    width: auto;
    justify-self: stretch;
    position: relative;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--component-tree-label-dark);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-height: 26px;
    padding: 3px 10px 3px 0;
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .component-tree-select::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 4px;
    bottom: 4px;
    width: 3px;
    border-radius: 999px;
    background: rgba(97, 156, 255, 0.24);
    opacity: 0;
    transition: opacity 140ms ease, background 140ms ease;
  }

  .component-tree-row:not([data-tree-depth="0"]) .component-tree-select::before {
    opacity: 1;
  }

  .component-tree-select:hover {
    background: var(--component-tree-hover-dark);
    border-color: transparent;
    color: #f3fff8;
  }

  .component-tree-select.is-active {
    background: var(--component-tree-active-dark);
    border-color: transparent;
    box-shadow: inset 2px 0 0 var(--component-tree-accent-dark);
    color: var(--tera-cyan);
  }

  .component-tree-select:hover::before,
  .component-tree-select.is-active::before {
    background: var(--component-tree-accent-dark);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select {
    color: var(--component-tree-label-light);
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select::before {
    background: rgba(47, 109, 255, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select.is-active {
    color: var(--tera-blue);
    background: var(--component-tree-active-light);
    border-color: transparent;
    box-shadow: inset 2px 0 0 var(--component-tree-accent-light);
  }

  .component-tree-select.is-active .component-tree-label-bracket {
    color: currentColor;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select:hover {
    background: var(--component-tree-hover-light);
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select:hover::before,
  #terajs-devtools-root[data-theme="light"] .component-tree-select.is-active::before {
    background: var(--component-tree-accent-light);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-toggle {
    background: transparent;
    color: var(--component-tree-toggle-light);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-toggle:hover {
    background: var(--component-tree-toggle-hover-light);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-node.is-expanded > .component-tree-row .component-tree-toggle {
    background: var(--component-tree-toggle-expanded-light);
  }

  .component-tree-content {
    min-width: 0;
    flex: 1;
    display: grid;
    gap: 0;
  }

  .component-tree-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .component-tree-label {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    overflow-wrap: anywhere;
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.2;
  }

  .component-tree-label-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .component-tree-label-bracket {
    color: var(--component-tree-bracket-dark);
    font-weight: 700;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-label {
    text-shadow: 0 0 10px rgba(50, 215, 255, 0.12);
  }

  .component-tree-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 18px;
    padding: 0 7px;
    border-radius: 999px;
    background: rgba(50, 215, 255, 0.12);
    border: 1px solid rgba(50, 215, 255, 0.16);
    color: var(--tera-cyan);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .component-tree-badge.is-root {
    background: rgba(47, 109, 255, 0.18);
    border-color: rgba(116, 160, 255, 0.22);
    color: #cfe0ff;
  }

  .component-tree-meta {
    color: var(--component-tree-meta-dark);
    font-family: var(--tera-code-font);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 1;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-label-bracket {
    color: var(--component-tree-bracket-light);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-meta {
    color: var(--component-tree-meta-light);
  }

  .component-tree-instance {
    font-family: var(--tera-code-font);
    opacity: 0.82;
    font-size: 11px;
    white-space: nowrap;
  }

  .component-ai-hint {
    margin-left: calc(28px + (var(--component-tree-depth) * 14px));
    margin-top: 2px;
    margin-bottom: 4px;
    font-size: 11px;
  }
`;