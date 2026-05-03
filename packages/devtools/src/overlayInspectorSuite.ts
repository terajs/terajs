import { expect, it } from "vitest";
import { createComponentContext, emitDebug, setCurrentContext } from "@terajs/shared";
import { computed, ref, watch, watchEffect } from "@terajs/reactivity";
import { mountDevtoolsOverlay, toggleDevtoolsOverlay } from "./overlay";

export function registerOverlayInspectorSuite(): void {
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

  it("groups framework-injected route inputs separately inside the script section", () => {
    const componentRoot = document.createElement("div") as HTMLDivElement & {
      __terajsComponentContext?: { props: Record<string, unknown> };
    };
    componentRoot.setAttribute("data-terajs-component-scope", "DocsPage");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    componentRoot.__terajsComponentContext = {
      props: {
        title: "Docs",
        route: {
          pathname: "/docs"
        },
        params: {
          slug: "intro"
        },
        query: {
          mode: "live"
        },
        hash: "#start",
        data: true,
        router: {
          push: "[function]"
        }
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

    const scriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    if (scriptSectionToggle?.getAttribute("aria-expanded") !== "true") {
      scriptSectionToggle?.click();
    }

    const scriptSection = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]')
      ?.closest(".inspector-section") as HTMLElement | null;
    const scriptText = scriptSection?.textContent ?? "";
    const dropdowns = Array.from(scriptSection?.querySelectorAll(".inspector-dropdown") ?? []);
    const titleDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "title";
    }) as HTMLElement | undefined;
    const routeDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "route";
    }) as HTMLElement | undefined;
    const dataDropdown = dropdowns.find((node) => {
      const keyNode = node.querySelector(".inspector-dropdown-key");
      return keyNode?.textContent?.trim() === "data";
    }) as HTMLElement | undefined;

    expect(scriptText).toContain("props");
    expect(scriptText).toContain("framework-injected route inputs");
    expect(titleDropdown?.querySelector(".inspector-dropdown-origin")?.textContent?.trim()).toBe("prop");
    expect(routeDropdown?.querySelector(".inspector-dropdown-origin")?.textContent?.trim()).toBe("framework route input");
    expect(dataDropdown?.querySelector('[data-action="toggle-live-prop"]')).toBeNull();
    expect(scriptText).toContain("pathname");
    expect(scriptText).toContain("slug");
    expect(scriptText).toContain("#start");
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
    const mode = computed(() => gate.value ? `${panel.value}:live` : `${panel.value}:idle`, { key: "mode" });
    const stopWatch = watch(() => gate.value, () => {
      void mode.get();
    }, { debugName: "gate" });

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
    expect(scriptText).toContain("mode");
    expect(scriptText).toContain("gate");
    expect(scriptText).not.toContain("watch effect");
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

  it("shows registered computed, watch, and watch effects before later triggers", () => {
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

    const ctx = createComponentContext();
    ctx.name = "Counter";
    ctx.instance = 1;

    let stopWatch = () => {};
    let stopWatchEffect = () => {};

    try {
      setCurrentContext(ctx);
      computed(() => gate.value ? `${panel.value}:live` : `${panel.value}:idle`, { key: "mode" });
      stopWatch = watch(() => gate.value, () => {}, { debugName: "gate" });
      stopWatchEffect = watchEffect(() => {
        void panel.value;
      }, { debugName: "stopWatchEffect" });
    } finally {
      setCurrentContext(null);
    }

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
    expect(scriptSectionToggle).toBeTruthy();
    if (scriptSectionToggle?.getAttribute("aria-expanded") !== "true") {
      scriptSectionToggle?.click();
    }

    const expandedScriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    const scriptSection = expandedScriptSectionToggle?.closest(".inspector-section") as HTMLDivElement | null;
    const origins = Array.from(scriptSection?.querySelectorAll(".inspector-dropdown-origin") ?? []).map((node) => {
      return node.textContent?.trim() ?? "";
    });
    const labels = Array.from(scriptSection?.querySelectorAll(".inspector-dropdown-key") ?? []).map((node) => {
      return node.textContent?.trim() ?? "";
    });
    const scriptText = scriptSection?.textContent ?? "";

    expect(scriptText).toContain("computed, watch, and effect activity");
    expect(origins).toContain("computed");
    expect(origins).toContain("watch");
    expect(origins).toContain("watch effect");
    expect(labels).toContain("mode");
    expect(labels).toContain("gate");
    expect(labels).toContain("stopWatchEffect");
    expect(scriptText).toContain("created");
    expect(scriptText).toContain("(not reported)");

    stopWatchEffect();
    stopWatch();
  });

  it("preserves runtime monitor registrations under heavy DOM noise", () => {
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

    const ctx = createComponentContext();
    ctx.name = "Counter";
    ctx.instance = 1;

    let stopWatch = () => {};
    let stopWatchEffect = () => {};

    try {
      setCurrentContext(ctx);
      computed(() => gate.value ? `${panel.value}:live` : `${panel.value}:idle`, { key: "mode" });
      stopWatch = watch(() => gate.value, () => {}, { debugName: "gate" });
      stopWatchEffect = watchEffect(() => {
        void panel.value;
      }, { debugName: "stopWatchEffect" });
    } finally {
      setCurrentContext(null);
    }

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    for (let index = 0; index < 4500; index += 1) {
      emitDebug({
        type: "dom:updated",
        timestamp: Date.now(),
        nodeId: `noise-${index}`
      });
    }

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const scriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    expect(scriptSectionToggle).toBeTruthy();
    if (scriptSectionToggle?.getAttribute("aria-expanded") !== "true") {
      scriptSectionToggle?.click();
    }

    const expandedScriptSectionToggle = shadowRoot?.querySelector('[data-action="toggle-inspector-section"][data-inspector-section="props"]') as HTMLButtonElement | null;
    const scriptSection = expandedScriptSectionToggle?.closest(".inspector-section") as HTMLDivElement | null;
    const labels = Array.from(scriptSection?.querySelectorAll(".inspector-dropdown-key") ?? []).map((node) => {
      return node.textContent?.trim() ?? "";
    });
    const scriptText = scriptSection?.textContent ?? "";

    expect(labels).toContain("mode");
    expect(labels).toContain("gate");
    expect(labels).toContain("stopWatchEffect");
    expect(scriptText).toContain("computed, watch, and effect activity");

    stopWatchEffect();
    stopWatch();
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
}