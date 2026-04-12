import { afterEach, describe, expect, it, vi } from "vitest";
import { Debug, emitDebug, resetDebugListeners } from "@terajs/shared";
import { ref } from "@terajs/reactivity";
import {
  mountDevtoolsOverlay,
  toggleDevtoolsOverlay,
  toggleDevtoolsVisibility,
  unmountDevtoolsOverlay
} from "./overlay";

const OVERLAY_PREFERENCES_STORAGE_KEY = "terajs:devtools:overlay-preferences";

function ensureTestStorage(): Storage {
  const candidate = (window as Window & { localStorage?: unknown }).localStorage;
  if (
    candidate
    && typeof (candidate as Storage).getItem === "function"
    && typeof (candidate as Storage).setItem === "function"
    && typeof (candidate as Storage).removeItem === "function"
  ) {
    return candidate as Storage;
  }

  const store = new Map<string, string>();
  const fallback: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    }
  };

  Object.defineProperty(window, "localStorage", {
    value: fallback,
    configurable: true
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: fallback,
    configurable: true
  });

  return fallback;
}

describe("devtools overlay public entry", () => {
  afterEach(() => {
    unmountDevtoolsOverlay();
    resetDebugListeners();
    delete (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__;
    delete (globalThis as typeof globalThis & { __TERAJS_DEVTOOLS_HOOK__?: unknown }).__TERAJS_DEVTOOLS_HOOK__;
    ensureTestStorage().removeItem(OVERLAY_PREFERENCES_STORAGE_KEY);
    document.body.innerHTML = "";
  });

  it("mounts the real devtools shell instead of placeholder text", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container");
    expect(host).toBeTruthy();

    const shadowRoot = host?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Terajs DevTools");
    expect(shadowRoot?.textContent).not.toContain("UI will mount here");
  });

  it("renders events from both debug channels", () => {
    mountDevtoolsOverlay();

    Debug.emit("effect:run", {});
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Events: 2");
    expect(shadowRoot?.textContent).toContain("Counter");
  });

  it("bridges route telemetry through the global debug hook", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const scopedGlobal = globalThis as typeof globalThis & {
      __TERAJS_DEVTOOLS_HOOK__?: { emit(event: unknown): void };
    };
    const hook = scopedGlobal.__TERAJS_DEVTOOLS_HOOK__;
    expect(hook).toBeTruthy();

    const now = Date.now();
    hook?.emit({
      type: "route:navigate:start",
      timestamp: now,
      payload: { from: "/", to: "/?branch=redirect&routeCase=redirect", source: "push" }
    });
    hook?.emit({
      type: "route:redirect",
      timestamp: now + 1,
      payload: {
        from: "/",
        to: "/?branch=redirect&routeCase=redirect",
        redirectTo: "/?branch=redirect&routeCase=redirected"
      }
    });
    hook?.emit({
      type: "route:changed",
      timestamp: now + 2,
      payload: {
        from: "/",
        to: "/?branch=redirect&routeCase=redirected",
        route: "/"
      }
    });
    hook?.emit({
      type: "route:navigate:end",
      timestamp: now + 3,
      payload: {
        from: "/",
        to: "/?branch=redirect&routeCase=redirected",
        source: "replace"
      }
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const routerTab = shadowRoot?.querySelector('[data-tab="Router"]') as HTMLButtonElement | null;
    routerTab?.click();

    expect(shadowRoot?.textContent).toContain("Current route: /?branch=redirect&routeCase=redirected");
    expect(shadowRoot?.textContent).toContain("route:redirect");
    expect(shadowRoot?.textContent).toContain("Route Events (30s)");
  });

  it("restores a previous global debug hook on unmount", () => {
    const previousHook = { emit: vi.fn() };
    (globalThis as typeof globalThis & { __TERAJS_DEVTOOLS_HOOK__?: { emit(event: unknown): void } }).__TERAJS_DEVTOOLS_HOOK__ = previousHook;

    mountDevtoolsOverlay();
    unmountDevtoolsOverlay();

    expect((globalThis as typeof globalThis & { __TERAJS_DEVTOOLS_HOOK__?: unknown }).__TERAJS_DEVTOOLS_HOOK__).toBe(previousHook);
  });

  it("replays component events emitted before overlay mount", () => {
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "LandingPage",
      instance: 1
    });

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("LandingPage");
  });

  it("shows component and route metadata in the meta tab", () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "DocsPage",
      instance: 1,
      meta: { title: "Docs", description: "Docs page" },
      ai: { summary: "Explain the docs route" },
      route: { layout: "docs", path: "/docs" }
    });

    emitDebug({
      type: "route:meta:resolved",
      timestamp: Date.now(),
      to: "/docs",
      meta: { title: "Docs Route", description: "Route metadata" },
      ai: { summary: "Route summary" },
      route: { path: "/docs", params: {} }
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const metaTab = shadowRoot?.querySelector('[data-tab="Meta"]') as HTMLButtonElement | null;
    metaTab?.click();

    expect(shadowRoot?.textContent).toContain("Component metadata");
    expect(shadowRoot?.textContent).toContain("Route metadata");
    expect(shadowRoot?.textContent).toContain("DocsPage");
    expect(shadowRoot?.textContent).toContain("Route /docs");
    expect(shadowRoot?.textContent).toContain("Docs page");
  });

  it("toggles panel visibility from the fab without remounting a second host", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    toggleDevtoolsOverlay();
    expect(panel?.classList.contains("is-hidden")).toBe(false);

    toggleDevtoolsOverlay();
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    mountDevtoolsOverlay();
    expect(document.querySelectorAll("#terajs-overlay-container")).toHaveLength(1);
  });

  it("supports hiding and showing the full overlay shell", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    expect(host?.style.display).toBe("block");

    toggleDevtoolsVisibility();
    expect(host?.style.display).toBe("none");

    toggleDevtoolsVisibility();
    expect(host?.style.display).toBe("block");
  });

  it("supports centered bottom positioning", () => {
    mountDevtoolsOverlay({ position: "bottom-center" });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.left).toBe("50%");
    expect(host?.style.transform).toBe("translateX(-50%)");
    expect(shell?.classList.contains("is-center")).toBe(true);
  });

  it("supports top docking presets", () => {
    mountDevtoolsOverlay({ position: "top-right" });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.right).toBe("20px");
    expect(host?.style.top).toBe("16px");
    expect(host?.style.bottom).toBe("");
    expect(shell?.classList.contains("is-top")).toBe(true);
  });

  it("restores persisted layout preferences when explicit layout is not provided", () => {
    ensureTestStorage().setItem(OVERLAY_PREFERENCES_STORAGE_KEY, JSON.stringify({
      position: "bottom-left",
      panelSize: "large"
    }));

    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.left).toBe("20px");
    expect(host?.style.bottom).toBe("16px");
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("1120px");
    expect(shell?.classList.contains("is-left")).toBe(true);
  });

  it("updates layout from settings controls and persists changes", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shadowRoot = host?.shadowRoot;

    const settingsTab = shadowRoot?.querySelector('[data-tab="Settings"]') as HTMLButtonElement | null;
    settingsTab?.click();

    const centerButton = shadowRoot?.querySelector('[data-layout-position="center"]') as HTMLButtonElement | null;
    centerButton?.click();
    expect(host?.style.top).toBe("50%");
    expect(host?.style.transform).toBe("translate(-50%, -50%)");

    const largeButton = shadowRoot?.querySelector('[data-layout-size="large"]') as HTMLButtonElement | null;
    largeButton?.click();
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("1120px");

    const persisted = JSON.parse(ensureTestStorage().getItem(OVERLAY_PREFERENCES_STORAGE_KEY) ?? "{}");
    expect(persisted.position).toBe("center");
    expect(persisted.panelSize).toBe("large");

    const persistToggle = shadowRoot?.querySelector('[data-layout-persist-toggle="true"]') as HTMLButtonElement | null;
    persistToggle?.click();
    expect(ensureTestStorage().getItem(OVERLAY_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it("edits live boolean props from the props inspector", () => {
    const componentRoot = document.createElement("div") as HTMLDivElement & {
      __terajsComponentContext?: { props: { enabled: boolean } };
    };
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    componentRoot.__terajsComponentContext = {
      props: {
        enabled: true
      }
    };
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const propsTab = shadowRoot?.querySelector('[data-inspector-tab="props"]') as HTMLButtonElement | null;
    propsTab?.click();

    const toggleButton = shadowRoot?.querySelector('[data-action="toggle-live-prop"][data-prop-key="enabled"]') as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();
    toggleButton?.click();

    expect(componentRoot.__terajsComponentContext?.props.enabled).toBe(false);
  });

  it("edits live reactive booleans from the reactive inspector", () => {
    const enabled = ref(true, {
      scope: "Counter",
      instance: 1,
      key: "enabled"
    });

    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const reactiveTab = shadowRoot?.querySelector('[data-inspector-tab="reactive"]') as HTMLButtonElement | null;
    reactiveTab?.click();

    const toggleButton = shadowRoot?.querySelector('[data-action="toggle-live-reactive"]') as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();
    toggleButton?.click();

    expect(enabled.value).toBe(false);
  });

  it("supports keyboard shortcuts for panel and visibility controls", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", ctrlKey: true, shiftKey: true }));
    expect(panel?.classList.contains("is-hidden")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", ctrlKey: true, shiftKey: true }));
    expect(host?.style.display).toBe("none");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", ctrlKey: true, shiftKey: true }));
    expect(host?.style.display).toBe("block");
  });

  it("supports toolbar interactions for theme toggle and event reset", () => {
    mountDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const host = document.getElementById("terajs-overlay-container");
    const shadowRoot = host?.shadowRoot;
    const mountRoot = shadowRoot?.getElementById("terajs-devtools-root") as HTMLDivElement | null;
    expect(mountRoot?.dataset.theme).toBe("dark");

    const themeButton = shadowRoot?.querySelector('[data-theme-toggle="true"]') as HTMLButtonElement | null;
    themeButton?.click();
    expect(mountRoot?.dataset.theme).toBe("light");

    const settingsTab = shadowRoot?.querySelector('[data-tab="Settings"]') as HTMLButtonElement | null;
    settingsTab?.click();

    const clearButton = shadowRoot?.querySelector('[data-clear-events="true"]') as HTMLButtonElement | null;
    clearButton?.click();

    expect(shadowRoot?.textContent).toContain("Events: 0");
  });

  it("navigates and runs actions through the command palette", () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "CommandPaletteDemo",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const openPaletteButton = shadowRoot?.querySelector('[data-command-palette-toggle="true"]') as HTMLButtonElement | null;
    openPaletteButton?.click();

    const queryInput = shadowRoot?.querySelector('[data-command-query="true"]') as HTMLInputElement | null;
    expect(queryInput).toBeTruthy();
    if (queryInput) {
      queryInput.value = "issues";
      queryInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const issuesCommand = shadowRoot?.querySelector('[data-command-id="tab:Issues"]') as HTMLButtonElement | null;
    expect(issuesCommand).toBeTruthy();
    issuesCommand?.click();

    expect(shadowRoot?.textContent).toContain("Issues and Warnings");

    const reopenPaletteButton = shadowRoot?.querySelector('[data-command-palette-toggle="true"]') as HTMLButtonElement | null;
    reopenPaletteButton?.click();
    const queryInputAfter = shadowRoot?.querySelector('[data-command-query="true"]') as HTMLInputElement | null;
    if (queryInputAfter) {
      queryInputAfter.value = "clear";
      queryInputAfter.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const clearCommand = shadowRoot?.querySelector('[data-command-id="action:clear-events"]') as HTMLButtonElement | null;
    expect(clearCommand).toBeTruthy();
    clearCommand?.click();

    expect(shadowRoot?.textContent).toContain("Events: 0");
  });

  it("toggles the command palette with ctrl+k", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    expect(shadowRoot?.querySelector('[data-command-query="true"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    expect(shadowRoot?.querySelector('[data-command-query="true"]')).toBeNull();
  });

  it("uses global AI assistant hook when available", async () => {
    const hook = vi.fn(async () => "Use keyed route metadata to trace render timing.");
    (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__ = hook;

    mountDevtoolsOverlay();

    Debug.emit("error:reactivity", {
      message: "Sample reactive failure",
      rid: "signal:counter"
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    const askButton = shadowRoot?.querySelector('[data-action="ask-ai"]') as HTMLButtonElement | null;
    askButton?.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(hook).toHaveBeenCalledTimes(1);
    expect(shadowRoot?.textContent).toContain("Response ready");
    expect(shadowRoot?.textContent).toContain("Use keyed route metadata to trace render timing.");
  });

  it("uses configured AI endpoint when no global assistant hook is present", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ response: "Endpoint response: check queue retries and route warnings." })
    } as unknown as Response);

    try {
      mountDevtoolsOverlay({
        ai: {
          endpoint: "https://assistant.local/diagnostics",
          model: "terajs-test-model",
          timeoutMs: 5000
        }
      });

      Debug.emit("error:reactivity", {
        message: "Signal loop regression",
        rid: "signal:loop"
      } as any);

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
      aiTab?.click();

      const askButton = shadowRoot?.querySelector('[data-action="ask-ai"]') as HTMLButtonElement | null;
      askButton?.click();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://assistant.local/diagnostics",
        expect.objectContaining({
          method: "POST"
        })
      );
      expect(shadowRoot?.textContent).toContain("Response ready");
      expect(shadowRoot?.textContent).toContain("Endpoint response: check queue retries and route warnings.");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("shows router issues in the issues panel", () => {
    mountDevtoolsOverlay();

    Debug.emit("error:router", {
      message: "No route matched /missing",
      to: "/missing"
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const issuesTab = shadowRoot?.querySelector('[data-tab="Issues"]') as HTMLButtonElement | null;
    issuesTab?.click();

    expect(shadowRoot?.textContent).toContain("No route matched /missing");
  });

  it("surfaces issue aggregation trend and recurring fingerprints", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const now = Date.now();
    emitDebug({
      type: "error:router",
      timestamp: now - 1600,
      message: "No route matched /docs/1"
    } as any);
    emitDebug({
      type: "error:router",
      timestamp: now - 1200,
      message: "No route matched /docs/2"
    } as any);
    emitDebug({
      type: "route:warn",
      timestamp: now - 600,
      message: "Navigation fallback 1"
    } as any);
    emitDebug({
      type: "route:warn",
      timestamp: now - 500,
      message: "Navigation fallback 2"
    } as any);
    emitDebug({
      type: "route:blocked",
      timestamp: now - 400,
      to: "/secure",
      message: "blocked by middleware"
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const issuesTab = shadowRoot?.querySelector('[data-tab="Issues"]') as HTMLButtonElement | null;
    issuesTab?.click();

    expect(shadowRoot?.textContent).toContain("Issue pressure (last 60s)");
    expect(shadowRoot?.textContent).toContain("Top recurring fingerprints");
    expect(shadowRoot?.textContent).toContain("error:router");
    expect(shadowRoot?.textContent).toContain("route:blocked");
    expect(shadowRoot?.textContent).toContain("x2");
  });

  it("shows blocked and redirected flows in the router diagnostics panel", () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "route:navigate:start",
      timestamp: Date.now(),
      to: "/secure"
    } as any);

    emitDebug({
      type: "route:blocked",
      timestamp: Date.now(),
      to: "/secure",
      middleware: ["auth"],
      message: "blocked by middleware"
    } as any);

    emitDebug({
      type: "route:redirect",
      timestamp: Date.now(),
      to: "/secure",
      redirectTo: "/signin"
    } as any);

    emitDebug({
      type: "route:load:start",
      timestamp: Date.now(),
      to: "/signin",
      route: "/signin"
    } as any);

    emitDebug({
      type: "route:load:end",
      timestamp: Date.now(),
      to: "/signin",
      route: "/signin",
      durationMs: 42
    } as any);

    emitDebug({
      type: "route:changed",
      timestamp: Date.now(),
      from: "/",
      to: "/signin"
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const routerTab = shadowRoot?.querySelector('[data-tab="Router"]') as HTMLButtonElement | null;
    routerTab?.click();

    expect(shadowRoot?.textContent).toContain("Router Diagnostics");
    expect(shadowRoot?.textContent).toContain("Current route: /signin");
    expect(shadowRoot?.textContent).toContain("middleware=auth");
    expect(shadowRoot?.textContent).toContain("redirect=/signin");
  });

  it("shows queue events in the queue monitor tab", () => {
    mountDevtoolsOverlay();

    Debug.emit("queue:enqueue", {
      id: "q1",
      type: "form:save",
      pending: 1
    });
    Debug.emit("queue:conflict", {
      id: "q1",
      type: "form:save",
      conflictKey: "profile:1",
      decision: "replace"
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const queueTab = shadowRoot?.querySelector('[data-tab="Queue"]') as HTMLButtonElement | null;
    queueTab?.click();

    expect(shadowRoot?.textContent).toContain("Queue Monitor");
    expect(shadowRoot?.textContent).toContain("form:save");
  });

  it("shows active refs in signals tab without requiring recent updates", () => {
    const activeRef = ref("ready", {
      scope: "OverlaySpec",
      instance: 1,
      key: "overlay.test.ref"
    });

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const signalsTab = shadowRoot?.querySelector('[data-tab="Signals"]') as HTMLButtonElement | null;
    signalsTab?.click();

    expect(activeRef.value).toBe("ready");
    expect(shadowRoot?.textContent).toContain("Active reactive registry");
    expect(shadowRoot?.textContent).toContain("overlay.test.ref");
  });

  it("does not emit lifecycle cleanup warnings when opening the signals tab", () => {
    const warnings: string[] = [];
    const stopWarnings = Debug.on((event) => {
      if (
        event.type === "lifecycle:warn"
        && event.payload
        && typeof event.payload.message === "string"
      ) {
        warnings.push(event.payload.message);
      }
    });

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const signalsTab = shadowRoot?.querySelector('[data-tab="Signals"]') as HTMLButtonElement | null;
    signalsTab?.click();

    unmountDevtoolsOverlay();
    stopWarnings();

    expect(warnings).not.toContain("onCleanup called without context");
  });

  it("highlights component roots when selected from the components list", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);
  });

  it("highlights component roots when hovering tree rows", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(true);

    componentButton?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(false);
  });

  it("uses tabbed component drill-down instead of accordion toggles", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const domTab = shadowRoot?.querySelector('[data-inspector-tab="dom"]') as HTMLButtonElement | null;
    domTab?.click();

    const selectedDomTab = shadowRoot?.querySelector('[data-inspector-tab="dom"].is-selected') as HTMLButtonElement | null;
    expect(selectedDomTab).toBeTruthy();

    const inspectorSurface = shadowRoot?.querySelector('.inspector-surface') as HTMLDivElement | null;
    inspectorSurface?.click();

    const selectedDomTabAfterBodyClick = shadowRoot?.querySelector('[data-inspector-tab="dom"].is-selected') as HTMLButtonElement | null;
    expect(selectedDomTabAfterBodyClick).toBeTruthy();
  });

  it("supports switching the component navigator to dom view", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const domModeButton = shadowRoot?.querySelector('[data-component-explorer-mode="dom"]') as HTMLButtonElement | null;
    domModeButton?.click();

    const domRow = shadowRoot?.querySelector('.component-dom-row[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(domRow).toBeTruthy();
    expect(shadowRoot?.textContent).toContain("<div>");
  });

  it("keeps dual panes visible and syncs inspector from tree drill-down", () => {
    const counterRoot = document.createElement("div");
    counterRoot.setAttribute("data-terajs-component-scope", "Counter");
    counterRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(counterRoot);

    const homeRoot = document.createElement("section");
    homeRoot.setAttribute("data-terajs-component-scope", "Home");
    homeRoot.setAttribute("data-terajs-component-instance", "2");
    document.body.appendChild(homeRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Home",
      instance: 2
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;

    expect(shadowRoot?.querySelector('.components-tree-pane')).toBeTruthy();
    expect(shadowRoot?.querySelector('.components-inspector-pane')).toBeTruthy();
    expect(shadowRoot?.querySelector('[data-component-pane-mode="split"]')).toBeNull();

    const homeRow = shadowRoot?.querySelector('[data-component-key="Home#2"]') as HTMLButtonElement | null;
    homeRow?.click();

    const selectedChip = shadowRoot?.querySelector('.inspector-selected-chip');
    expect(selectedChip).toBeTruthy();
    expect(shadowRoot?.textContent).toContain("Home");
  });

  it("filters metadata entries and supports meta detail tabs", () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "DocsPage",
      instance: 1,
      meta: { title: "Docs", description: "Docs page" },
      ai: { summary: "Explain docs" },
      route: { layout: "docs", path: "/docs" }
    });

    emitDebug({
      type: "route:meta:resolved",
      timestamp: Date.now(),
      to: "/docs",
      meta: { title: "Docs Route" },
      ai: { summary: "Route summary" },
      route: { path: "/docs", params: {} }
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const metaTab = shadowRoot?.querySelector('[data-tab="Meta"]') as HTMLButtonElement | null;
    metaTab?.click();

    const filterInput = shadowRoot?.querySelector('[data-meta-filter-query="true"]') as HTMLInputElement | null;
    expect(filterInput).toBeTruthy();
    if (filterInput) {
      filterInput.value = "route";
      filterInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    expect(shadowRoot?.textContent).toContain("1 visible entries");

    const routeEntry = shadowRoot?.querySelector('[data-meta-key="route:/docs"]') as HTMLButtonElement | null;
    expect(routeEntry).toBeTruthy();
    routeEntry?.click();

    const routeDetailTab = shadowRoot?.querySelector('[data-meta-detail-tab="route"]') as HTMLButtonElement | null;
    routeDetailTab?.click();

    const selectedRouteDetailTab = shadowRoot?.querySelector('[data-meta-detail-tab="route"].is-selected') as HTMLButtonElement | null;
    expect(selectedRouteDetailTab).toBeTruthy();
    expect(shadowRoot?.textContent).toContain("Route snapshot");
  });

  it("enables inspect mode immediately when startOpen is true", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

    expect(document.body.hasAttribute("data-terajs-inspect-mode")).toBe(true);
  });

  it("supports inspect mode click-to-pick from page components", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    componentRoot.dispatchEvent(new Event("pointermove", { bubbles: true, composed: true }));
    componentRoot.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, button: 0 }));

    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(componentButton?.classList.contains("is-active")).toBe(true);
    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);
  });

  it("keeps mounted components visible after large event churn", () => {
    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    for (let index = 0; index < 450; index += 1) {
      Debug.emit("effect:run", { key: `k${index}` });
    }

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Counter");
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(componentButton).toBeTruthy();
  });

  it("retains meta snapshots after large event churn", () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "DocsPage",
      instance: 1,
      meta: { title: "Durable Meta", description: "must survive churn" },
      ai: { summary: "meta test" },
      route: { path: "/docs" }
    });

    for (let index = 0; index < 2600; index += 1) {
      Debug.emit("effect:run", { key: `meta-churn-${index}` });
    }

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const metaTab = shadowRoot?.querySelector('[data-tab="Meta"]') as HTMLButtonElement | null;
    metaTab?.click();

    expect(shadowRoot?.textContent).toContain("DocsPage");
    expect(shadowRoot?.textContent).toContain("Durable Meta");
  }, 10000);

  it("keeps route log entries visible after heavy non-route churn", () => {
    mountDevtoolsOverlay({ startOpen: true });

    Debug.emit("route:navigate:start", {
      from: "/",
      to: "/docs",
      source: "push"
    });

    for (let index = 0; index < 2400; index += 1) {
      Debug.emit("effect:run", { key: `route-churn-${index}` });
    }

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const logsTab = shadowRoot?.querySelector('[data-tab="Logs"]') as HTMLButtonElement | null;
    logsTab?.click();

    const routeFilter = shadowRoot?.querySelector('[data-log-filter="route"]') as HTMLButtonElement | null;
    routeFilter?.click();

    expect(shadowRoot?.textContent).toContain("route:navigate:start");
  });

  it("keeps replay cursor stable while live events continue", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const timelineTab = shadowRoot?.querySelector('[data-tab="Timeline"]') as HTMLButtonElement | null;
    timelineTab?.click();

    for (let index = 0; index < 12; index += 1) {
      Debug.emit("queue:enqueue", {
        id: `q-${index}`,
        type: "job:sync",
        pending: index + 1
      });
    }

    const cursorInput = shadowRoot?.querySelector('[data-timeline-cursor="true"]') as HTMLInputElement | null;
    expect(cursorInput).toBeTruthy();

    if (cursorInput) {
      cursorInput.value = "2";
      cursorInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    for (let index = 0; index < 10; index += 1) {
      Debug.emit("queue:enqueue", {
        id: `q-next-${index}`,
        type: "job:sync",
        pending: index + 20
      });
    }

    const cursorInputAfter = shadowRoot?.querySelector('[data-timeline-cursor="true"]') as HTMLInputElement | null;
    expect(cursorInputAfter).toBeTruthy();
    expect(Number(cursorInputAfter?.value ?? "-1")).toBe(2);
    expect(shadowRoot?.textContent).toContain("manual");
  });

  it("clears selected highlight when leaving the components tab", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);

    const logsTab = shadowRoot?.querySelector('[data-tab="Logs"]') as HTMLButtonElement | null;
    logsTab?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(false);
  });
});