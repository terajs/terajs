export const overlayShellBrandStyles = `

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
`;