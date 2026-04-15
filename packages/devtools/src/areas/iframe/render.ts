import { escapeHtml } from "../../inspector/shared.js";
import { overlayStyles } from "../../overlayStyles.js";

const IFRAME_DOCUMENT_CHROME = `
  :root {
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
  }

  html, body {
    margin: 0;
    width: 100%;
    min-height: 100%;
    background: transparent;
  }

  body {
    overflow: auto;
  }

  #terajs-devtools-root {
    width: auto;
    height: auto;
    min-height: 100%;
    padding: 12px;
    box-sizing: border-box;
    overflow: auto;
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
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
  frameDocument.addEventListener("click", eventBridge.click);
  frameDocument.addEventListener("input", eventBridge.input);
  frameDocument.addEventListener("change", eventBridge.change);
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