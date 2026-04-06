// Overlay/iframe loader for Nebula DevTools
import { DevtoolsApp } from "./app";

let overlayEl: HTMLDivElement | null = null;
let iframeEl: HTMLIFrameElement | null = null;
let visible = false;

export function mountDevtoolsOverlay(): void {
  if (typeof document === 'undefined' || overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.id = "nebula-overlay-container";
  overlayEl.style.position = "fixed";
  overlayEl.style.bottom = "20px";
  overlayEl.style.left = "20px";
  overlayEl.style.width = "400px";
  overlayEl.style.height = "50vh";
  overlayEl.style.background = "#0f172a";
  overlayEl.style.borderRadius = "12px";
  overlayEl.style.border = "1px solid #334155";
  overlayEl.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.5)";
  overlayEl.style.zIndex = "999999";
  overlayEl.style.display = "none";
  overlayEl.style.overflow = "hidden";

  iframeEl = document.createElement("iframe");
  iframeEl.style.width = "100%";
  iframeEl.style.height = "100%";
  iframeEl.style.border = "none";

  overlayEl.appendChild(iframeEl);
  document.body.appendChild(overlayEl);

  // For now, just show a placeholder. Later, render DevtoolsApp via Nebula.
  iframeEl.srcdoc = `<!doctype html><html><body><div id='nebula-devtools-root'>Nebula DevTools UI will mount here.</div></body></html>`;
}

export function toggleDevtoolsOverlay(): void {
  if (!overlayEl) mountDevtoolsOverlay();
  visible = !visible;
  if (overlayEl) {
    overlayEl.style.display = visible ? "block" : "none";
  }
}
