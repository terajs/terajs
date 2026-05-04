import { escapeHtml } from "../../inspector/shared.js";
import { overlayStyles } from "../../overlayStyles.js";

const IFRAME_DOCUMENT_CHROME = `
  :root {
    --tera-black: #05070f;
    --tera-carbon: #0d1320;
    --tera-graphite: #1d2940;
    --tera-blue: #2f6dff;
    --tera-cyan: #32d7ff;
    --tera-title-ink: var(--tera-cyan);
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
  }

  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: var(--tera-surface-page);
    overflow: hidden;
  }

  body {
    overflow: hidden;
  }

  #terajs-devtools-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 100%;
    min-width: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
  }

  #terajs-devtools-root > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }
`;

export interface DevtoolsIframeAreaRenderOptions {
  title: string;
  theme: "dark" | "light";
  markup: string;
  eventBridge?: DevtoolsIframeAreaEventBridge;
}

export interface DevtoolsIframeAreaEventBridge {
  click: EventListener;
  input: EventListener;
  change: EventListener;
}

const iframeEventBridgeRegistry = new WeakMap<Document, DevtoolsIframeAreaEventBridge>();
const iframeFocusGuardRegistry = new WeakSet<Document>();
const pendingIframeScrollRestoreFrames = new WeakMap<HTMLElement, number>();
const IFRAME_SCROLL_RESTORE_SELECTORS = [
  ".devtools-workbench-sidebar-body",
  ".devtools-workbench-main-body",
  ".devtools-utility-panel-body",
  ".investigation-journal-feed",
  ".investigation-journal-detail",
  ".iframe-results-pane",
  ".iframe-results-item-detail-body",
  ".structured-value-viewer",
] as const;

interface IframeScrollSnapshot {
  selector: string;
  index: number;
  top: number;
  left: number;
}

export function renderIframeAreaHost(title: string): string {
  const escapedTitle = escapeHtml(title);
  return `
    <div class="devtools-panel-iframe-shell">
      <iframe
        class="devtools-panel-iframe"
        data-devtools-iframe-area="${escapedTitle}"
        title="${escapeHtml(`Terajs DevTools ${title}`)}"
        sandbox="allow-same-origin"
      ></iframe>
    </div>
  `;
}

export function syncIframeAreaHost(root: HTMLElement, options: DevtoolsIframeAreaRenderOptions): void {
  const iframe = Array.from(root.querySelectorAll<HTMLIFrameElement>("[data-devtools-iframe-area]"))
    .find((candidate) => candidate.dataset.devtoolsIframeArea === options.title);

  if (!iframe) {
    return;
  }

  const existingDocument = iframe.contentDocument;
  const existingRoot = existingDocument?.getElementById("terajs-devtools-root");
  if (existingDocument && existingRoot) {
    const scrollSnapshot = captureIframeScrollSnapshot(existingRoot);
    existingRoot.setAttribute("data-theme", options.theme);
    existingRoot.innerHTML = options.markup;
    restoreIframeScrollSnapshot(existingRoot, scrollSnapshot);
    scheduleIframeScrollSnapshotRestore(existingRoot, scrollSnapshot);

    if (options.eventBridge) {
      attachIframeAreaEventBridge(existingDocument, options.eventBridge);
    }
    return;
  }

  const documentMarkup = buildIframeAreaDocument(options);
  iframe.setAttribute("srcdoc", documentMarkup);

  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    return;
  }

  frameDocument.open();
  frameDocument.write(documentMarkup);
  frameDocument.close();

  if (options.eventBridge) {
    attachIframeAreaEventBridge(frameDocument, options.eventBridge);
  }
}

export function attachIframeAreaEventBridge(
  frameDocument: Document,
  eventBridge: DevtoolsIframeAreaEventBridge
): void {
  ensureIframeInteractionGuards(frameDocument);

  const existingBridge = iframeEventBridgeRegistry.get(frameDocument);
  if (existingBridge) {
    if (
      existingBridge.click === eventBridge.click
      && existingBridge.input === eventBridge.input
      && existingBridge.change === eventBridge.change
    ) {
      return;
    }

    frameDocument.removeEventListener("click", existingBridge.click);
    frameDocument.removeEventListener("input", existingBridge.input);
    frameDocument.removeEventListener("change", existingBridge.change);
  }

  frameDocument.addEventListener("click", eventBridge.click);
  frameDocument.addEventListener("input", eventBridge.input);
  frameDocument.addEventListener("change", eventBridge.change);
  iframeEventBridgeRegistry.set(frameDocument, eventBridge);
}

function ensureIframeInteractionGuards(frameDocument: Document): void {
  if (iframeFocusGuardRegistry.has(frameDocument)) {
    return;
  }

  const preventInteractiveToggleDefault = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("[data-action='toggle-value-node'], [data-timeline-detail-key]")) {
      event.preventDefault();
    }
  };

  frameDocument.addEventListener("mousedown", preventInteractiveToggleDefault, { capture: true });
  frameDocument.addEventListener("pointerdown", preventInteractiveToggleDefault, { capture: true });
  frameDocument.addEventListener("click", preventInteractiveToggleDefault, { capture: true });

  iframeFocusGuardRegistry.add(frameDocument);
}

function captureIframeScrollSnapshot(root: HTMLElement): IframeScrollSnapshot[] {
  const snapshots: IframeScrollSnapshot[] = [];

  if (root.scrollTop !== 0 || root.scrollLeft !== 0) {
    snapshots.push({
      selector: ":root",
      index: 0,
      top: root.scrollTop,
      left: root.scrollLeft,
    });
  }

  for (const selector of IFRAME_SCROLL_RESTORE_SELECTORS) {
    Array.from(root.querySelectorAll<HTMLElement>(selector)).forEach((element, index) => {
      if (element.scrollTop === 0 && element.scrollLeft === 0) {
        return;
      }

      snapshots.push({
        selector,
        index,
        top: element.scrollTop,
        left: element.scrollLeft,
      });
    });
  }

  return snapshots;
}

function restoreIframeScrollSnapshot(root: HTMLElement, snapshots: readonly IframeScrollSnapshot[]): void {
  for (const snapshot of snapshots) {
    const target = snapshot.selector === ":root"
      ? root
      : Array.from(root.querySelectorAll<HTMLElement>(snapshot.selector))[snapshot.index];

    if (!target) {
      continue;
    }

    target.scrollTop = snapshot.top;
    target.scrollLeft = snapshot.left;
  }
}

function scheduleIframeScrollSnapshotRestore(root: HTMLElement, snapshots: readonly IframeScrollSnapshot[]): void {
  if (snapshots.length === 0) {
    return;
  }

  const frameWindow = root.ownerDocument.defaultView;
  if (!frameWindow) {
    return;
  }

  const pendingFrame = pendingIframeScrollRestoreFrames.get(root);
  if (pendingFrame !== undefined) {
    frameWindow.cancelAnimationFrame(pendingFrame);
  }

  const frameHandle = frameWindow.requestAnimationFrame(() => {
    pendingIframeScrollRestoreFrames.delete(root);
    restoreIframeScrollSnapshot(root, snapshots);
  });

  pendingIframeScrollRestoreFrames.set(root, frameHandle);
}

function buildIframeAreaDocument(options: DevtoolsIframeAreaRenderOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(`Terajs DevTools ${options.title}`)}</title>
    <style>${overlayStyles}\n${IFRAME_DOCUMENT_CHROME}</style>
  </head>
  <body>
    <div id="terajs-devtools-root" data-theme="${options.theme}">${options.markup}</div>
  </body>
</html>`;
}