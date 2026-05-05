const DEVTOOLS_INSPECT_MODE_EVENT = "terajs:devtools:inspect-mode";
const DEVTOOLS_COMPONENT_SELECT_EVENT = "terajs:devtools:component-select";
const DEVTOOLS_COMPONENT_PICKED_EVENT = "terajs:devtools:component-picked";
const DEVTOOLS_COMPONENT_HOVER_EVENT = "terajs:devtools:component-hover";

const COMPONENT_SCOPE_ATTR = "data-terajs-component-scope";
const COMPONENT_INSTANCE_ATTR = "data-terajs-component-instance";
const COMPONENT_TREE_KEY_ATTR = "data-component-key";

const INSPECT_STYLE_ID = "terajs-devtools-inspect-style";
const INSPECT_HOVER_CLASS = "terajs-devtools-hover-component";
const INSPECT_SELECTED_CLASS = "terajs-devtools-selected-component";

interface InspectBridgeOptions {
  overlayElement: () => HTMLElement | null;
  isPanelVisible: () => boolean;
  isOverlayVisible: () => boolean;
  revealPanel: () => void;
}

interface InspectBridge {
  setup(): void;
  teardown(): void;
  syncContext(): void;
}

export function createInspectBridge(options: InspectBridgeOptions): InspectBridge {
  let inspectModeListener: EventListener | null = null;
  let componentSelectListener: EventListener | null = null;
  let componentHoverListener: EventListener | null = null;
  let pointerMoveListener: ((event: PointerEvent) => void) | null = null;
  let inspectClickListener: ((event: MouseEvent) => void) | null = null;
  let requestedInspectMode = false;
  let inspectModeEnabled = false;
  let treeHoverPreviewActive = false;
  let highlightedHoverEl: HTMLElement | null = null;
  let highlightedSelectedEl: HTMLElement | null = null;

  function ensureInspectStyles(): void {
    if (typeof document === "undefined") {
      return;
    }

    if (document.getElementById(INSPECT_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = INSPECT_STYLE_ID;
    style.textContent = `
body[data-terajs-inspect-mode="true"] [${COMPONENT_SCOPE_ATTR}] {
  cursor: crosshair !important;
}

.${INSPECT_HOVER_CLASS} {
  outline: 2px solid rgba(50, 215, 255, 0.72) !important;
  outline-offset: 2px !important;
  box-shadow: inset 0 0 0 999px rgba(50, 215, 255, 0.08) !important;
}

.${INSPECT_SELECTED_CLASS} {
  outline: 2px solid rgba(47, 109, 255, 0.96) !important;
  outline-offset: 2px !important;
  box-shadow: inset 0 0 0 999px rgba(47, 109, 255, 0.1) !important, 0 0 0 3px rgba(50, 215, 255, 0.36) !important;
}
`;

    document.head?.appendChild(style);
  }

  function clearHoverHighlight(): void {
    if (highlightedHoverEl) {
      highlightedHoverEl.classList.remove(INSPECT_HOVER_CLASS);
      highlightedHoverEl = null;
    }
  }

  function setHoverHighlight(nextEl: HTMLElement | null): void {
    if (highlightedHoverEl === nextEl) {
      return;
    }

    clearHoverHighlight();
    if (!nextEl) {
      return;
    }

    highlightedHoverEl = nextEl;
    highlightedHoverEl.classList.add(INSPECT_HOVER_CLASS);
  }

  function clearSelectedHighlight(): void {
    if (highlightedSelectedEl) {
      highlightedSelectedEl.classList.remove(INSPECT_SELECTED_CLASS);
      highlightedSelectedEl = null;
    }
  }

  function setSelectedHighlight(nextEl: HTMLElement | null): void {
    if (highlightedSelectedEl === nextEl) {
      return;
    }

    clearSelectedHighlight();
    if (!nextEl) {
      return;
    }

    highlightedSelectedEl = nextEl;
    highlightedSelectedEl.classList.add(INSPECT_SELECTED_CLASS);
  }

  function parseComponentIdentityFromElement(element: HTMLElement): { scope: string; instance: number } | null {
    const scope = element.getAttribute(COMPONENT_SCOPE_ATTR);
    const instanceRaw = element.getAttribute(COMPONENT_INSTANCE_ATTR);
    const instance = instanceRaw !== null ? Number(instanceRaw) : Number.NaN;

    if (!scope || !Number.isFinite(instance)) {
      return null;
    }

    return {
      scope,
      instance
    };
  }

  function findComponentElementFromTarget(target: EventTarget | null): HTMLElement | null {
    let current = target instanceof Element ? target : null;

    while (current) {
      if (current instanceof HTMLElement && current.hasAttribute(COMPONENT_SCOPE_ATTR) && current.hasAttribute(COMPONENT_INSTANCE_ATTR)) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  function isOverlayEventTarget(event: Event): boolean {
    const overlayEl = options.overlayElement();
    if (!overlayEl) {
      return false;
    }

    return event.composedPath().includes(overlayEl);
  }

  function isOverlayComponentTreeTarget(event: Event): boolean {
    for (const entry of event.composedPath()) {
      if (!(entry instanceof HTMLElement)) {
        continue;
      }

      if (entry.hasAttribute(COMPONENT_TREE_KEY_ATTR)) {
        return true;
      }
    }

    return false;
  }

  function escapeAttributeValue(value: string): string {
    const css = globalThis.CSS;
    if (css && typeof css.escape === "function") {
      return css.escape(value);
    }

    return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  }

  function findElementForComponent(scope: string, instance: number): HTMLElement | null {
    const scopeSelector = escapeAttributeValue(scope);
    const selector = `[${COMPONENT_SCOPE_ATTR}="${scopeSelector}"][${COMPONENT_INSTANCE_ATTR}="${instance}"]`;
    const match = document.querySelector(selector);
    return match instanceof HTMLElement ? match : null;
  }

  function setInspectMode(enabled: boolean): void {
    inspectModeEnabled = enabled;
    document.body?.toggleAttribute("data-terajs-inspect-mode", enabled);

    if (!enabled) {
      treeHoverPreviewActive = false;
      clearHoverHighlight();
      clearSelectedHighlight();
    }
  }

  function syncContext(): void {
    setInspectMode(requestedInspectMode && options.isOverlayVisible());
  }

  function setup(): void {
    if (typeof window === "undefined" || typeof document === "undefined" || inspectModeListener) {
      return;
    }

    ensureInspectStyles();

    inspectModeListener = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") {
        return;
      }

      const payload = detail as Record<string, unknown>;
      requestedInspectMode = payload.enabled === true;
      syncContext();
    };

    componentSelectListener = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") {
        return;
      }

      const payload = detail as Record<string, unknown>;
      const scope = typeof payload.scope === "string" ? payload.scope : null;
      const instance = typeof payload.instance === "number" ? payload.instance : null;

      if (!scope || instance === null) {
        clearSelectedHighlight();
        return;
      }

      setSelectedHighlight(findElementForComponent(scope, instance));
    };

    componentHoverListener = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") {
        return;
      }

      const payload = detail as Record<string, unknown>;
      const scope = typeof payload.scope === "string" ? payload.scope : null;
      const instance = typeof payload.instance === "number" ? payload.instance : null;

      if (!scope || instance === null) {
        treeHoverPreviewActive = false;
        clearHoverHighlight();
        return;
      }

      treeHoverPreviewActive = true;
      setHoverHighlight(findElementForComponent(scope, instance));
    };

    pointerMoveListener = (event: PointerEvent) => {
      if (!inspectModeEnabled) {
        return;
      }

      if (isOverlayEventTarget(event)) {
        if (!isOverlayComponentTreeTarget(event)) {
          treeHoverPreviewActive = false;
          setHoverHighlight(null);
        }
        return;
      }

      if (treeHoverPreviewActive) {
        treeHoverPreviewActive = false;
      }

      setHoverHighlight(findComponentElementFromTarget(event.target));
    };

    inspectClickListener = (event: MouseEvent) => {
      if (!inspectModeEnabled || event.button !== 0 || isOverlayEventTarget(event)) {
        return;
      }

      const componentEl = findComponentElementFromTarget(event.target);
      if (!componentEl) {
        return;
      }

      const identity = parseComponentIdentityFromElement(componentEl);
      if (!identity) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setSelectedHighlight(componentEl);
      window.dispatchEvent(new CustomEvent(DEVTOOLS_COMPONENT_PICKED_EVENT, {
        detail: {
          scope: identity.scope,
          instance: identity.instance,
          source: "picker"
        }
      }));

      if (!options.isPanelVisible()) {
        options.revealPanel();
      }
    };

    window.addEventListener(DEVTOOLS_INSPECT_MODE_EVENT, inspectModeListener);
    window.addEventListener(DEVTOOLS_COMPONENT_SELECT_EVENT, componentSelectListener);
    window.addEventListener(DEVTOOLS_COMPONENT_HOVER_EVENT, componentHoverListener);
    document.addEventListener("pointermove", pointerMoveListener, true);
    document.addEventListener("click", inspectClickListener, true);
  }

  function teardown(): void {
    if (typeof window !== "undefined") {
      if (inspectModeListener) {
        window.removeEventListener(DEVTOOLS_INSPECT_MODE_EVENT, inspectModeListener);
        inspectModeListener = null;
      }

      if (componentSelectListener) {
        window.removeEventListener(DEVTOOLS_COMPONENT_SELECT_EVENT, componentSelectListener);
        componentSelectListener = null;
      }

      if (componentHoverListener) {
        window.removeEventListener(DEVTOOLS_COMPONENT_HOVER_EVENT, componentHoverListener);
        componentHoverListener = null;
      }
    }

    if (typeof document !== "undefined") {
      if (pointerMoveListener) {
        document.removeEventListener("pointermove", pointerMoveListener, true);
        pointerMoveListener = null;
      }

      if (inspectClickListener) {
        document.removeEventListener("click", inspectClickListener, true);
        inspectClickListener = null;
      }

      document.body?.removeAttribute("data-terajs-inspect-mode");
    }

    inspectModeEnabled = false;
    requestedInspectMode = false;
    treeHoverPreviewActive = false;
    clearHoverHighlight();
    clearSelectedHighlight();
  }

  return {
    setup,
    teardown,
    syncContext
  };
}