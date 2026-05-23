const DEVTOOLS_SHELL_WINDOW_ACTION_EVENT = "terajs:devtools:shell-window-action";

export interface OverlayShellWindowActionBridgeOptions {
  isPanelVisible(): boolean;
  minimizePanel(): void;
}

export function mountOverlayShellWindowActionBridge(
  options: OverlayShellWindowActionBridgeOptions
): (() => void) | null {
  if (typeof window === "undefined") {
    return null;
  }

  const listener: EventListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const action = (detail as { action?: unknown }).action;
    if (action !== "minimize" || !options.isPanelVisible()) {
      return;
    }

    options.minimizePanel();
  };

  window.addEventListener(DEVTOOLS_SHELL_WINDOW_ACTION_EVENT, listener);

  return () => {
    window.removeEventListener(DEVTOOLS_SHELL_WINDOW_ACTION_EVENT, listener);
  };
}