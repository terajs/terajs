import type { DevtoolsOverlayPosition, DevtoolsOverlaySize } from "./overlayOptions.js";

export function resolveOverlayShellClass(position: DevtoolsOverlayPosition): string {
  const classes = ["fab-shell"];

  if (position === "bottom-left" || position === "top-left") {
    classes.push("is-left");
  }

  if (position === "bottom-center" || position === "top-center" || position === "center") {
    classes.push("is-center");
  }

  if (position === "top-left" || position === "top-right" || position === "top-center") {
    classes.push("is-top");
  }

  return classes.join(" ");
}

export function applyOverlayPosition(
  overlayEl: HTMLDivElement | null,
  position: DevtoolsOverlayPosition
): void {
  if (!overlayEl) {
    return;
  }

  overlayEl.style.left = "";
  overlayEl.style.right = "";
  overlayEl.style.top = "";
  overlayEl.style.bottom = "";
  overlayEl.style.transform = "";

  if (position === "bottom-left") {
    overlayEl.style.left = "20px";
    overlayEl.style.bottom = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "top-left") {
    overlayEl.style.left = "20px";
    overlayEl.style.top = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "bottom-right") {
    overlayEl.style.right = "20px";
    overlayEl.style.bottom = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "top-right") {
    overlayEl.style.right = "20px";
    overlayEl.style.top = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "bottom-center") {
    overlayEl.style.left = "50%";
    overlayEl.style.bottom = "16px";
    overlayEl.style.transform = "translateX(-50%)";
  } else if (position === "top-center") {
    overlayEl.style.left = "50%";
    overlayEl.style.top = "16px";
    overlayEl.style.transform = "translateX(-50%)";
  } else {
    overlayEl.style.left = "50%";
    overlayEl.style.top = "50%";
    overlayEl.style.transform = "translate(-50%, -50%)";
  }

  const shell = overlayEl.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;
  if (shell) {
    shell.className = resolveOverlayShellClass(position);
  }
}

export function applyOverlayPanelSize(
  overlayEl: HTMLDivElement | null,
  panelSize: DevtoolsOverlaySize
): void {
  if (!overlayEl) {
    return;
  }

  if (panelSize === "large") {
    overlayEl.style.setProperty("--terajs-overlay-panel-width", "1480px");
    overlayEl.style.setProperty("--terajs-overlay-panel-height", "720px");
    return;
  }

  if (panelSize === "fullscreen") {
    overlayEl.style.setProperty("--terajs-overlay-panel-width", "calc(100vw - 24px)");
    overlayEl.style.setProperty("--terajs-overlay-panel-height", "calc(100vh - 24px)");
    return;
  }

  overlayEl.style.setProperty("--terajs-overlay-panel-width", "1040px");
  overlayEl.style.setProperty("--terajs-overlay-panel-height", "720px");
}

export function matchesOverlayShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const tokens = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (tokens.length === 0) {
    return false;
  }

  const expectedKey = tokens.find((token) => !["ctrl", "control", "cmd", "meta", "shift", "alt", "option"].includes(token));

  const expectsCtrl = tokens.includes("ctrl") || tokens.includes("control");
  const expectsMeta = tokens.includes("cmd") || tokens.includes("meta");
  const expectsShift = tokens.includes("shift");
  const expectsAlt = tokens.includes("alt") || tokens.includes("option");

  if (expectsCtrl && !(event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (expectsMeta && !event.metaKey) {
    return false;
  }

  if (expectsShift !== event.shiftKey) {
    return false;
  }

  if (expectsAlt !== event.altKey) {
    return false;
  }

  if (!expectedKey) {
    return true;
  }

  return event.key.toLowerCase() === expectedKey;
}