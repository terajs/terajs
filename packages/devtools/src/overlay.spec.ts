import { afterEach, describe, expect, it, vi } from "vitest";
import { Debug, emitDebug, resetDebugListeners } from "@terajs/shared";
import { computed, ref, watch } from "@terajs/reactivity";
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

  it("replays component events emitted before overlay mount", () => {
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "LandingPage",
      instance: 1
    });

    for (let index = 0; index < 360; index += 1) {
      Debug.emit("effect:run", { key: `before-mount-${index}` });
    }

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Events: 361");
    expect(shadowRoot?.textContent).toContain("LandingPage");
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

  it("caps overlay size to viewport while preserving internal scroll hosts", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toContain("max-width: calc(100vw - 12px);");
    expect(styleText).toContain("max-height: calc(100vh - 12px);");
    expect(styleText).toContain("75vw");
    expect(styleText).toContain("75vh");
    expect(styleText).toContain(".devtools-body");
    expect(styleText).toContain(".devtools-panel");
    expect(styleText).toContain("overflow: auto;");
  });

  it("starts from default position while still applying persisted size", () => {
    ensureTestStorage().setItem(OVERLAY_PREFERENCES_STORAGE_KEY, JSON.stringify({
      position: "bottom-left",
      panelSize: "large"
    }));

    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.left).toBe("50%");
    expect(host?.style.bottom).toBe("16px");
    expect(host?.style.transform).toBe("translateX(-50%)");
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("1120px");
    expect(shell?.classList.contains("is-center")).toBe(true);
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

    const setupSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    expect(setupSectionToggle?.textContent).toContain("script");
    if (setupSectionToggle?.getAttribute("aria-expanded") !== "true") {
      setupSectionToggle?.click();
    }

    const toggleButton = shadowRoot?.querySelector('[data-action="toggle-live-prop"][data-prop-key="enabled"]') as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();
    toggleButton?.click();

    expect(componentRoot.__terajsComponentContext?.props.enabled).toBe(false);
  });

  it("renders primitive string props as text-only values", () => {
    const componentRoot = document.createElement("div") as HTMLDivElement & {
      __terajsComponentContext?: { props: Record<string, unknown> };
    };
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    componentRoot.__terajsComponentContext = {
      props: {
        live: "",
        description: "Start on Router or Logs, then move through Signals, Queue, Timeline, and Issues after triggering the controls above."
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

    const setupSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    if (setupSectionToggle?.getAttribute("aria-expanded") !== "true") {
      setupSectionToggle?.click();
    }

    const dropdowns = Array.from(shadowRoot?.querySelectorAll(".inspector-dropdown") ?? []);
    const descriptionDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "description";
    }) as HTMLElement | undefined;
    const liveDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "live";
    }) as HTMLElement | undefined;

    expect(descriptionDropdown).toBeTruthy();
    expect(descriptionDropdown?.querySelector(".inspector-dropdown-origin")?.textContent?.trim()).toBe("prop");
    expect(descriptionDropdown?.querySelector(".inspector-dropdown-summary")?.textContent).toContain("description");
    expect(descriptionDropdown?.querySelector(".inspector-dropdown-summary")?.textContent).toContain(": string");
    expect(descriptionDropdown?.querySelector("input.inspector-live-input")).toBeNull();
    expect(descriptionDropdown?.querySelector(".inspector-inline-value")?.textContent).toContain("\"Start on Router or Logs");

    expect(liveDropdown).toBeTruthy();
    expect(liveDropdown?.querySelector(".inspector-dropdown-summary")?.textContent).toContain(": string");
    expect(liveDropdown?.querySelector("input.inspector-live-input")).toBeNull();
    expect(liveDropdown?.querySelector(".inspector-inline-value")?.textContent?.trim()).toBe("\"\"");
  });

  it("renders array and object props as prettified JSON blocks", () => {
    const componentRoot = document.createElement("div") as HTMLDivElement & {
      __terajsComponentContext?: { props: Record<string, unknown> };
    };
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    componentRoot.__terajsComponentContext = {
      props: {
        tabs: ["Router", "Logs", "Signals"],
        meta: {
          panel: "Router",
          live: true
        }
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

    const scriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    if (scriptSectionToggle?.getAttribute("aria-expanded") !== "true") {
      scriptSectionToggle?.click();
    }

    const dropdowns = Array.from(shadowRoot?.querySelectorAll(".inspector-dropdown") ?? []);
    const tabsDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "tabs";
    }) as HTMLElement | undefined;
    const metaDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "meta";
    }) as HTMLElement | undefined;

    const tabsJson = tabsDropdown?.querySelector(".inspector-json")?.textContent ?? "";
    expect(tabsJson).toContain("[");
    expect(tabsJson).toContain("\"Router\"");
    expect(tabsJson).toContain("\"Logs\"");
    expect(tabsJson).toContain("\"Signals\"");
    expect(tabsJson).toContain("]");
    expect(tabsJson).not.toContain("\"0\":");

    const metaJson = metaDropdown?.querySelector(".inspector-json")?.textContent ?? "";
    expect(metaJson).toContain("{");
    expect(metaJson).toContain("\"panel\": \"Router\"");
    expect(metaJson).toContain("\"live\": true");
    expect(metaJson).toContain("}");
  });

  it("shows late route, meta, and ai snapshots in the component inspector", () => {
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

    emitDebug({
      type: "component:update",
      timestamp: Date.now() + 1,
      scope: "Counter",
      instance: 1,
      route: {
        path: "/docs",
        name: "docs"
      },
      meta: {
        title: "Docs",
        layout: "guide"
      },
      ai: {
        tags: ["docs", "guide"],
        summary: "Explain the component state."
      }
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const routeSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="route"]') as HTMLButtonElement | null;
    routeSectionToggle?.click();

    const metaSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="meta"]') as HTMLButtonElement | null;
    metaSectionToggle?.click();

    const aiSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="ai"]') as HTMLButtonElement | null;
    aiSectionToggle?.click();

    const expandedRouteSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="route"]') as HTMLButtonElement | null;
    const expandedMetaSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="meta"]') as HTMLButtonElement | null;
    const expandedAiSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="ai"]') as HTMLButtonElement | null;
    const routeText = expandedRouteSectionToggle?.closest(".inspector-section")?.textContent ?? "";
    const metaText = expandedMetaSectionToggle?.closest(".inspector-section")?.textContent ?? "";
    const aiText = expandedAiSectionToggle?.closest(".inspector-section")?.textContent ?? "";

    expect(routeText).toContain("/docs");
    expect(routeText).toContain("docs");
    expect(routeText).not.toContain("{}{}");
    expect(metaText).toContain("Docs");
    expect(metaText).toContain("guide");
    expect(metaText).not.toContain("Explain the component state.");
    expect(aiText).toContain("tags");
    expect(aiText).toContain("docs");
    expect(aiText).toContain("guide");
    expect(aiText).toContain("Explain the component state.");
  });

  it("falls back to live component context for route, meta, and ai snapshots", () => {
    const componentRoot = document.createElement("div") as HTMLDivElement & {
      __terajsComponentContext?: {
        props?: Record<string, unknown>;
        meta?: Record<string, unknown>;
        ai?: Record<string, unknown>;
        route?: Record<string, unknown>;
      };
    };
    componentRoot.setAttribute("data-terajs-component-scope", "DocsPage");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    componentRoot.__terajsComponentContext = {
      meta: {
        title: "Docs route",
        keywords: ["terajs", "docs"]
      },
      ai: {
        summary: "Docs page for Terajs runtime guidance.",
        keywords: ["runtime", "guides"],
        audience: "developers"
      },
      route: {
        path: "/docs",
        layout: "default"
      }
    };
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "DocsPage",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="DocsPage#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const routeSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="route"]') as HTMLButtonElement | null;
    routeSectionToggle?.click();

    const metaSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="meta"]') as HTMLButtonElement | null;
    metaSectionToggle?.click();

    const aiSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="ai"]') as HTMLButtonElement | null;
    aiSectionToggle?.click();

    const expandedRouteSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="route"]') as HTMLButtonElement | null;
    const expandedMetaSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="meta"]') as HTMLButtonElement | null;
    const expandedAiSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="ai"]') as HTMLButtonElement | null;
    const routeText = expandedRouteSectionToggle?.closest(".inspector-section")?.textContent ?? "";
    const metaText = expandedMetaSectionToggle?.closest(".inspector-section")?.textContent ?? "";
    const aiText = expandedAiSectionToggle?.closest(".inspector-section")?.textContent ?? "";

    expect(routeText).toContain("/docs");
    expect(routeText).toContain("default");
    expect(metaText).toContain("Docs route");
    expect(metaText).toContain("terajs");
    expect(aiText).toContain("runtime");
    expect(aiText).toContain("guides");
    expect(aiText).toContain("developers");
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

    const reactiveSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="reactive"]') as HTMLButtonElement | null;
    if (reactiveSectionToggle?.getAttribute("aria-expanded") !== "true") {
      reactiveSectionToggle?.click();
    }

    const reactiveOrigin = shadowRoot?.querySelector('[data-inspector-section="reactive"]')
      ?.closest(".inspector-section")
      ?.querySelector(".inspector-dropdown-origin")
      ?.textContent
      ?.trim();
    expect(reactiveOrigin).toBe("reactive");

    const toggleButton = shadowRoot?.querySelector('[data-action="toggle-live-reactive"]') as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();
    toggleButton?.click();

    expect(enabled.value).toBe(false);
  });

  it("shows computed/effect/watch triggers inside the script section", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    const gate = ref(false, {
      scope: "Counter",
      instance: 1,
      key: "gate"
    });
    const panel = ref("Router", {
      scope: "Counter",
      instance: 1,
      key: "panel"
    });
    const mode = computed(() => gate.value ? `${panel.value}:live` : `${panel.value}:idle`);
    const stopWatch = watch(() => gate.value, () => {
      void mode.get();
    });

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    void mode.get();
    gate.value = true;
    panel.value = "Logs";
    void mode.get();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const scriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    expect(scriptSectionToggle).toBeTruthy();
    expect(scriptSectionToggle?.textContent).toContain("script");
    if (scriptSectionToggle?.getAttribute("aria-expanded") !== "true") {
      scriptSectionToggle?.click();
    }

    const expandedScriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;

    const runtimeSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="runtime"]');
    expect(runtimeSectionToggle).toBeNull();

    const scriptText = expandedScriptSectionToggle?.closest(".inspector-section")?.textContent ?? shadowRoot?.textContent ?? "";
    expect(scriptText).toContain("computed, watch, and effect activity");
    expect(scriptText).not.toContain("runtime monitor");
    expect(scriptText).toContain("computed");
    expect(scriptText).toContain("watch");
    expect(scriptText).toContain("effect");
    expect(scriptText).not.toContain("const newValue = source()");
    expect(scriptText).not.toContain("effect#");
    expect(scriptText).toContain("history");
    expect(scriptText).toContain("false -> true");

    const historyPanel = expandedScriptSectionToggle?.closest(".inspector-section")?.querySelector(".runtime-history-panel") as HTMLDivElement | null;
    const historyScroll = historyPanel?.querySelector(".runtime-history-scroll") as HTMLDivElement | null;
    expect(historyPanel?.textContent).toContain("Most recent first.");
    expect(historyScroll).toBeTruthy();

    stopWatch();
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

    unmountDevtoolsOverlay();
    mountDevtoolsOverlay();

    const remountedShadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(remountedShadowRoot?.textContent).toContain("Events: 0");
    expect(remountedShadowRoot?.textContent).not.toContain("Counter");
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

  it("renders tree chevrons without duplicating instance ids in the left navigator", () => {
    const parentRoot = document.createElement("div");
    parentRoot.setAttribute("data-terajs-component-scope", "Layout");
    parentRoot.setAttribute("data-terajs-component-instance", "1");

    const childRoot = document.createElement("div");
    childRoot.setAttribute("data-terajs-component-scope", "DevtoolsEmbed");
    childRoot.setAttribute("data-terajs-component-instance", "1");
    parentRoot.appendChild(childRoot);
    document.body.appendChild(parentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Layout",
      instance: 1
    });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "DevtoolsEmbed",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const parentButton = shadowRoot?.querySelector('[data-component-key="Layout#1"]') as HTMLButtonElement | null;
    const childRow = shadowRoot?.querySelector('[data-component-key="DevtoolsEmbed#1"]')?.closest(".component-tree-row") as HTMLDivElement | null;
    const childPlaceholder = childRow?.querySelector(".component-tree-toggle.is-placeholder") as HTMLSpanElement | null;
    const topLevelPill = Array.from(shadowRoot?.querySelectorAll(".components-screen-pill") ?? []).find((node) => {
      return node.textContent?.includes("top level");
    }) as HTMLSpanElement | undefined;
    const childMeta = shadowRoot?.querySelector('[data-component-key="Layout#1"] .component-tree-meta') as HTMLSpanElement | null;

    expect(parentButton?.textContent).toContain("Layout");
    expect(parentButton?.textContent).not.toContain("root");
    expect(topLevelPill?.textContent).toContain("top level 1");
    expect(childMeta?.textContent).toContain("1 child");
    expect(parentButton?.textContent).not.toContain("#1");
    expect(childRow?.querySelector(".component-tree-branch")?.classList.contains("is-terminal")).toBe(true);
    expect(childPlaceholder?.textContent?.trim() ?? "").toBe("");
  });

  it("uses collapsible component drill-down sections", () => {
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

    const overviewSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="overview"]') as HTMLButtonElement | null;
    expect(overviewSectionToggle).toBeTruthy();
    expect(overviewSectionToggle?.getAttribute("aria-expanded")).toBe("false");
    expect(overviewSectionToggle?.textContent).toContain("identity");
    expect(overviewSectionToggle?.textContent).toContain("Counter");

    const domSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="dom"]') as HTMLButtonElement | null;
    expect(domSectionToggle).toBeTruthy();
    expect(domSectionToggle?.textContent).toContain("dom snapshot");
    expect(domSectionToggle?.getAttribute("aria-expanded")).toBe("false");

    const reactiveSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="reactive"]') as HTMLButtonElement | null;
    expect(reactiveSectionToggle).toBeNull();

    overviewSectionToggle?.click();
    const expandedOverviewSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="overview"]') as HTMLButtonElement | null;
    const overviewBody = expandedOverviewSectionToggle?.closest(".inspector-section")?.querySelector(".inspector-section-body");
    expect(overviewBody?.textContent).toContain("scope");
    expect(overviewBody?.textContent).toContain("Counter");
    expect(overviewBody?.textContent).toContain("mounts");

    const collapsedDomToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="dom"]') as HTMLButtonElement | null;
    collapsedDomToggle?.click();
    const expandedDomToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="dom"]') as HTMLButtonElement | null;
    expect(expandedDomToggle?.getAttribute("aria-expanded")).toBe("true");

    expandedDomToggle?.click();
    const reCollapsedDomToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="dom"]') as HTMLButtonElement | null;
    expect(reCollapsedDomToggle?.getAttribute("aria-expanded")).toBe("false");

    const domBody = reCollapsedDomToggle?.closest(".inspector-section")?.querySelector(".inspector-section-body");
    expect(domBody).toBeNull();

    reCollapsedDomToggle?.click();
    const reopenedDomToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="dom"]') as HTMLButtonElement | null;
    const reopenedDomBody = reopenedDomToggle?.closest(".inspector-section")?.querySelector(".inspector-section-body");
    expect(reopenedDomToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(reopenedDomBody).toBeTruthy();
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

  it("updates the components header count without remounting tree rows for unrelated churn", () => {
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

    expect(componentButton).toBeTruthy();
    expect(shadowRoot?.textContent).toContain("Events: 1");

    Debug.emit("effect:run", { key: "global:effect" });

    const stableComponentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(shadowRoot?.textContent).toContain("Events: 2");
    expect(stableComponentButton).toBe(componentButton);
  });

  it("updates the selected inspector after component runtime activity without remounting tree rows", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    const gate = ref(false, {
      scope: "Counter",
      instance: 1,
      key: "gate"
    });
    const panel = ref("Router", {
      scope: "Counter",
      instance: 1,
      key: "panel"
    });
    const mode = computed(() => gate.value ? `${panel.value}:live` : `${panel.value}:idle`);
    const stopWatch = watch(() => gate.value, () => {
      void mode.get();
    });

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

    const scriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    if (scriptSectionToggle?.getAttribute("aria-expanded") !== "true") {
      scriptSectionToggle?.click();
    }

    const stableComponentButtonBeforeActivity = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;

    const initialScriptText = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]')
      ?.closest(".inspector-section")
      ?.textContent ?? "";
    expect(initialScriptText).not.toContain("false -> true");

    void mode.get();
    gate.value = true;
    panel.value = "Logs";
    void mode.get();

    const stableComponentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    const updatedScriptText = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]')
      ?.closest(".inspector-section")
      ?.textContent ?? "";

    expect(stableComponentButton).toBe(stableComponentButtonBeforeActivity);
    expect(updatedScriptText).toContain("false -> true");

    stopWatch();
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