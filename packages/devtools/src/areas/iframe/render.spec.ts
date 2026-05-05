import { describe, expect, it, vi } from "vitest";
import { attachIframeAreaEventBridge, renderIframeAreaHost, syncIframeAreaHost } from "./render.js";

describe("syncIframeAreaHost", () => {
  it("uses the shared DevTools theme tokens in iframe srcdoc", () => {
    const root = document.createElement("div");
    root.innerHTML = renderIframeAreaHost("Logs");
    document.body.append(root);

    syncIframeAreaHost(root, {
      title: "Logs",
      theme: "dark",
      markup: `<div class="devtools-workbench">shared palette</div>`,
    });

    const iframe = root.querySelector("iframe");
    const iframeDocument = iframe?.getAttribute("srcdoc") ?? "";

    expect(iframeDocument).toContain("--tera-black: #07101d");
    expect(iframeDocument).toContain("--tera-surface-pane-strong: rgba(13, 24, 43, 0.94)");
    expect(iframeDocument).not.toContain("--tera-black: #05070f");

    root.remove();
  });

  it("restores known iframe scroll regions after rerendering markup", () => {
    const root = document.createElement("div");
    root.innerHTML = renderIframeAreaHost("Logs");
    document.body.append(root);

    syncIframeAreaHost(root, {
      title: "Logs",
      theme: "dark",
      markup: `
        <div class="devtools-workbench">
          <div class="devtools-workbench-sidebar-body">
            <div style="height: 1200px">first render</div>
          </div>
          <div class="devtools-workbench-main-body">
            <div style="height: 1200px">detail render</div>
          </div>
        </div>
      `,
    });

    const iframe = root.querySelector("iframe");
    const iframeDocument = iframe?.contentDocument;
    const sidebarBody = iframeDocument?.querySelector<HTMLElement>(".devtools-workbench-sidebar-body");
    const mainBody = iframeDocument?.querySelector<HTMLElement>(".devtools-workbench-main-body");

    expect(sidebarBody).not.toBeNull();
    expect(mainBody).not.toBeNull();

    sidebarBody!.scrollTop = 180;
    mainBody!.scrollTop = 72;

    syncIframeAreaHost(root, {
      title: "Logs",
      theme: "dark",
      markup: `
        <div class="devtools-workbench">
          <div class="devtools-workbench-sidebar-body">
            <div style="height: 1200px">second render</div>
          </div>
          <div class="devtools-workbench-main-body">
            <div style="height: 1200px">second detail</div>
          </div>
        </div>
      `,
    });

    const restoredSidebarBody = iframeDocument?.querySelector<HTMLElement>(".devtools-workbench-sidebar-body");
    const restoredMainBody = iframeDocument?.querySelector<HTMLElement>(".devtools-workbench-main-body");

    expect(restoredSidebarBody?.scrollTop).toBe(180);
    expect(restoredMainBody?.scrollTop).toBe(72);

    root.remove();
  });

  it("restores structured value viewer scroll after rerendering markup", () => {
    const root = document.createElement("div");
    root.innerHTML = renderIframeAreaHost("Timeline");
    document.body.append(root);

    syncIframeAreaHost(root, {
      title: "Timeline",
      theme: "dark",
      markup: `
        <div class="investigation-journal-detail">
          <div class="iframe-results-item-detail-body">
            <div class="structured-value-viewer" style="height: 120px; overflow: auto;">
              <div style="height: 1200px">first render</div>
            </div>
          </div>
        </div>
      `,
    });

    const iframe = root.querySelector("iframe");
    const iframeDocument = iframe?.contentDocument;
    const frameWindow = iframeDocument?.defaultView;
    const valueViewer = iframeDocument?.querySelector<HTMLElement>(".structured-value-viewer");
    const scheduledRestoreCallbacks: Array<(timestamp: number) => void> = [];

    Object.defineProperty(frameWindow, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn((callback: (timestamp: number) => void) => {
        scheduledRestoreCallbacks.push(callback);
        return 1;
      }),
    });
    Object.defineProperty(frameWindow, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });

    expect(valueViewer).not.toBeNull();

    valueViewer!.scrollTop = 144;

    syncIframeAreaHost(root, {
      title: "Timeline",
      theme: "dark",
      markup: `
        <div class="investigation-journal-detail">
          <div class="iframe-results-item-detail-body">
            <div class="structured-value-viewer" style="height: 120px; overflow: auto;">
              <div style="height: 1200px">second render</div>
            </div>
          </div>
        </div>
      `,
    });

    const restoredValueViewer = iframeDocument?.querySelector<HTMLElement>(".structured-value-viewer");
    expect(scheduledRestoreCallbacks).toHaveLength(1);
    expect(restoredValueViewer?.scrollTop).toBe(144);

    restoredValueViewer!.scrollTop = 0;
    const scheduledRestore = scheduledRestoreCallbacks[0];
    if (typeof scheduledRestore !== "function") {
      throw new Error("Expected deferred iframe scroll restore callback.");
    }
    scheduledRestore(0);

    expect(restoredValueViewer?.scrollTop).toBe(144);

    root.remove();
  });
});

describe("attachIframeAreaEventBridge", () => {
  it("forwards click, input, and change events from the iframe document", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const click = vi.fn();
    const input = vi.fn();
    const change = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click,
      input,
      change,
    });

    const button = frameDocument.createElement("button");
    button.textContent = "warn";
    frameDocument.body.appendChild(button);
    button.click();

    const slider = frameDocument.createElement("input");
    slider.value = "5";
    frameDocument.body.appendChild(slider);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("replaces previous iframe listeners instead of stacking duplicates", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const firstClick = vi.fn();
    const secondClick = vi.fn();
    const noop = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click: firstClick,
      input: noop,
      change: noop,
    });

    attachIframeAreaEventBridge(frameDocument, {
      click: secondClick,
      input: noop,
      change: noop,
    });

    const button = frameDocument.createElement("button");
    frameDocument.body.appendChild(button);
    button.click();

    expect(firstClick).toHaveBeenCalledTimes(0);
    expect(secondClick).toHaveBeenCalledTimes(1);
  });

  it("prevents mousedown focus on structured value toggles", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const noop = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click: noop,
      input: noop,
      change: noop,
    });

    const button = frameDocument.createElement("button");
    button.setAttribute("data-action", "toggle-value-node");
    frameDocument.body.appendChild(button);

    const mouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    button.dispatchEvent(mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);
  });

  it("prevents mousedown focus on timeline detail toggles", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const noop = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click: noop,
      input: noop,
      change: noop,
    });

    const summary = frameDocument.createElement("summary");
    summary.setAttribute("data-timeline-detail-key", "timeline.0");
    frameDocument.body.appendChild(summary);

    const mouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    summary.dispatchEvent(mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);
  });

  it("prevents pointerdown and click defaults on timeline detail toggles", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const noop = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click: noop,
      input: noop,
      change: noop,
    });

    const summary = frameDocument.createElement("summary");
    summary.setAttribute("data-timeline-detail-key", "timeline.0");
    frameDocument.body.appendChild(summary);

    const pointerDown = new Event("pointerdown", { bubbles: true, cancelable: true });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    summary.dispatchEvent(pointerDown);
    summary.dispatchEvent(click);

    expect(pointerDown.defaultPrevented).toBe(true);
    expect(click.defaultPrevented).toBe(true);
  });
});