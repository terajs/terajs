import { expect, it } from "vitest";
import { Debug, emitDebug } from "@terajs/shared";
import {
  mountDevtoolsOverlay,
  readDevtoolsBridgeSession,
  subscribeToDevtoolsBridge,
  toggleDevtoolsOverlay,
  toggleDevtoolsVisibility,
  unmountDevtoolsOverlay,
  waitForDevtoolsBridge
} from "./overlay";
import {
  OVERLAY_PREFERENCES_STORAGE_KEY,
  appendTestHeadNode,
  ensureTestStorage,
  flushMicrotasks
} from "./overlaySpecShared.js";

export function registerOverlayShellSuite(): void {
  it("mounts the real devtools shell instead of placeholder text", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container");
    expect(host).toBeTruthy();

    const shadowRoot = host?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Tera Lens");
    expect(shadowRoot?.textContent).not.toContain("Terajs DevTools");
    expect(shadowRoot?.textContent).not.toContain("UI will mount here");
    expect(shadowRoot?.querySelector('.tab-button .devtools-icon')).toBeTruthy();
  });

  it("renders the tab navigation with centered accent underlines", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toMatch(/\.tab-button::after\s*\{[^}]*width: 24px;/);
    expect(styleText).toMatch(/\.tab-button\.is-active::after\s*\{[^}]*background: var\(--tera-tone-info\);/);
  });

  it("keeps titles cyan while subtitles and hints stay muted", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toMatch(/--tera-title-ink: var\(--tera-cyan\);/);
    expect(styleText).toMatch(/\.panel-title\.is-purple\s*\{[^}]*color: var\(--tera-title-ink\);/);
    expect(styleText).toMatch(/\.devtools-subtitle,\s*\.panel-subtitle,\s*\.muted-text,\s*\.tiny-muted,\s*\.metric-label\s*\{[^}]*color: rgba\(207, 223, 247, 0\.82\);/);
  });

  it("keeps AI bridge titles cyan on the AI surface", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toMatch(/\.ai-panel-screen \.panel-title\.is-cyan\s*\{[^}]*color: var\(--tera-tone-info\);/);
  });

  it("keeps the opener dark blue and pushes the color into the label text", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toMatch(/\.devtools-fab\s*\{[^}]*background: linear-gradient\(135deg, rgba\(8, 20, 43, 0\.98\), rgba\(16, 42, 82, 0\.94\)\);/);
    expect(styleText).toMatch(/\.devtools-fab-label\s*\{[^}]*background: linear-gradient\(120deg, #83ebff 0%, #4c7bff 36%, #8a7dff 68%, #ff7aa8 100%\);[^}]*background-clip: text;[^}]*color: transparent;/s);
  });

  it("keeps the centered top-bar heading slightly larger and white", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toMatch(/\.devtools-active-view\s*\{[^}]*color: var\(--tera-cloud\);[^}]*font-size: 14px;/s);
  });

  it("renders Components inside the shared workbench shell", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Components");
    expect(shadowRoot?.textContent).not.toContain("Debug Surface");
    expect(shadowRoot?.querySelector(".devtools-panel-shell .components-screen")).toBeTruthy();
  });

  it("labels the floating devtools button as Tera Lens", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const fab = shadowRoot?.getElementById("terajs-devtools-fab") as HTMLButtonElement | null;
    const inspectToggle = shadowRoot?.getElementById("terajs-devtools-inspect-toggle") as HTMLButtonElement | null;
    expect(fab?.textContent).toBe("Tera Lens");
    expect(fab?.getAttribute("aria-label")).toBe("Toggle Tera Lens DevTools");
    expect(inspectToggle?.getAttribute("aria-label")).toBe("Enable component inspect");
    expect(inspectToggle?.querySelector(".devtools-icon--lg")).toBeTruthy();
  });

  it("arms inspect from the opener switch without opening the panel", () => {
    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const inspectToggle = shadowRoot?.getElementById("terajs-devtools-inspect-toggle") as HTMLButtonElement | null;

    expect(document.body.hasAttribute("data-terajs-inspect-mode")).toBe(false);

    inspectToggle?.click();
    expect(document.body.hasAttribute("data-terajs-inspect-mode")).toBe(true);
    expect(inspectToggle?.getAttribute("aria-pressed")).toBe("true");

    inspectToggle?.click();
    expect(document.body.hasAttribute("data-terajs-inspect-mode")).toBe(false);
    expect(inspectToggle?.getAttribute("aria-pressed")).toBe("false");
  });

  it("clears the global mounted flag when the overlay unmounts", () => {
    const globalState = globalThis as typeof globalThis & { __TERAJS_DEVTOOLS_MOUNTED__?: boolean };

    expect(globalState.__TERAJS_DEVTOOLS_MOUNTED__).toBeUndefined();
    mountDevtoolsOverlay();
    expect(globalState.__TERAJS_DEVTOOLS_MOUNTED__).toBe(true);

    unmountDevtoolsOverlay();
    expect(globalState.__TERAJS_DEVTOOLS_MOUNTED__).toBeUndefined();
  });

  it("renders events from both debug channels", () => {
    mountDevtoolsOverlay({ startOpen: true });

    // Activate route so route-scoped buffer is populated
    emitDebug({
      type: "route:changed",
      timestamp: Date.now(),
      to: "/" ,
      from: null
    });
    Debug.emit("effect:run", {});
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Events: 3");
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

    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Events: 361");
    expect(shadowRoot?.textContent).toContain("LandingPage");
  });

  it("starts minimized by default and toggles panel visibility from the fab without remounting a second host", () => {
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

  it("exposes an IDE bridge for snapshots and overlay control", () => {
    mountDevtoolsOverlay({ startOpen: false });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    expect(bridge).toBeTruthy();
    expect(bridge?.listInstances().length).toBeGreaterThanOrEqual(1);

    const initialSnapshot = bridge?.getSnapshot();
    expect(initialSnapshot?.activeTab).toBe("Components");
    expect(initialSnapshot?.hostKind).toBe("overlay");

    expect(bridge?.reveal()).toBe(true);
    expect(panel?.classList.contains("is-hidden")).toBe(false);

    expect(bridge?.focusTab("AI Diagnostics")).toBe(true);
    const updatedSnapshot = bridge?.getSnapshot();
    expect(updatedSnapshot?.activeTab).toBe("AI Diagnostics");

    const shadowRoot = host?.shadowRoot;
    const aiTabButton = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    expect(aiTabButton?.textContent?.trim()).toBe("Bridge");
    expect(aiTabButton?.getAttribute("title")).toBe("Bridge");
    expect(aiTabButton?.querySelector("svg")?.innerHTML ?? "").toContain('M12 3l1.5 3.9');
    expect(shadowRoot?.textContent).toContain("AI Bridge");
  });

  it("queues hidden updates and flushes them when the panel opens", async () => {
    mountDevtoolsOverlay({ startOpen: false });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;

    expect(shadowRoot?.textContent).toContain("Events: 0");

    Debug.emit("effect:run", { key: "hidden-update" });

    expect(shadowRoot?.textContent).toContain("Events: 0");
    expect(bridge?.getSnapshot()?.eventCount).toBe(1);

    toggleDevtoolsOverlay();
    await flushMicrotasks();

    expect(shadowRoot?.textContent).toContain("Events: 1");
  });

  it("can defer devtools app mount until first open", async () => {
    mountDevtoolsOverlay({ startOpen: false, lazyMount: true });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);
    expect((window as typeof window & { __TERAJS_DEVTOOLS_BRIDGE__?: unknown }).__TERAJS_DEVTOOLS_BRIDGE__).toBeUndefined();

    toggleDevtoolsOverlay();
    await flushMicrotasks();

    expect(panel?.classList.contains("is-hidden")).toBe(false);
    expect((window as typeof window & { __TERAJS_DEVTOOLS_BRIDGE__?: unknown }).__TERAJS_DEVTOOLS_BRIDGE__).toBeTruthy();
    expect(host?.shadowRoot?.textContent).toContain("Tera Lens");
  });

  it("opens host controls when the bridge focuses settings", () => {
    mountDevtoolsOverlay();

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    expect(bridge?.focusTab("Settings")).toBe(true);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.querySelector('[data-host-controls-toggle="true"]')?.getAttribute("aria-expanded")).toBe("true");
    expect(shadowRoot?.textContent).toContain("Workspace Settings");
  });

  it("hosts the Signals tab inside an iframe-backed panel", async () => {
    mountDevtoolsOverlay({ startOpen: true });

    Debug.emit("signal:update", {
      key: "count",
      next: 2
    });
    Debug.emit("effect:run", {
      key: "count:effect"
    });

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    expect(bridge?.focusTab("Signals")).toBe(true);

    await flushMicrotasks();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const iframe = shadowRoot?.querySelector('[data-devtools-iframe-area="Signals"]') as HTMLIFrameElement | null;
    const iframeDocument = iframe?.getAttribute("srcdoc") ?? "";

    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute("sandbox")).toContain("allow-same-origin");
    expect(iframeDocument).toContain("Signals");
    expect(iframeDocument).toContain("Choose one reactive value");
    expect(iframeDocument).toContain("signals-panel-screen");
    expect(iframeDocument).toContain("components-screen--iframe");
    expect(iframeDocument).toContain("Recent updates");
    expect(iframeDocument).toContain("count");
    expect(iframeDocument).toContain("--tera-black: #05070f");
    expect(bridge?.getSnapshot()?.activeTab).toBe("Signals");
  });

  it("keeps the active iframe tab shell stable during live updates", async () => {
    mountDevtoolsOverlay({ startOpen: true });

    Debug.emit("signal:update", {
      key: "count",
      next: 1
    });

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    expect(bridge?.focusTab("Signals")).toBe(true);

    await flushMicrotasks();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const tabButton = shadowRoot?.querySelector('[data-tab="Signals"]') as HTMLButtonElement | null;
    const iframe = shadowRoot?.querySelector('[data-devtools-iframe-area="Signals"]') as HTMLIFrameElement | null;

    expect(tabButton).toBeTruthy();
    expect(iframe).toBeTruthy();

    Debug.emit("signal:update", {
      key: "count",
      next: 2
    });

    await flushMicrotasks();

    expect(shadowRoot?.querySelector('[data-tab="Signals"]')).toBe(tabButton);
    expect(shadowRoot?.querySelector('[data-devtools-iframe-area="Signals"]')).toBe(iframe);
    expect(iframe?.getAttribute("srcdoc")).toContain("count");
  });

  it("hosts the Meta tab inside an iframe-backed panel", async () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "route:meta:resolved",
      timestamp: Date.now(),
      payload: {
        to: "/docs",
        meta: {
          title: "Docs"
        },
        ai: {
          summary: "Docs route summary"
        },
        route: {
          branch: "docs"
        }
      }
    } as any);

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    expect(bridge?.focusTab("Meta")).toBe(true);

    await flushMicrotasks();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const iframe = shadowRoot?.querySelector('[data-devtools-iframe-area="Meta"]') as HTMLIFrameElement | null;
    const iframeDocument = iframe?.getAttribute("srcdoc") ?? "";

    expect(iframe).toBeTruthy();
    expect(iframeDocument).toContain("Observed metadata");
    expect(iframeDocument).toContain("meta-panel-screen");
    expect(iframeDocument).toContain("components-screen--iframe");
    expect(iframeDocument).toContain("Observed metadata");
    expect(iframeDocument).toContain("Route /docs");
    expect(iframeDocument).toContain("Metadata inspector");
    expect(iframeDocument).not.toContain("Route snapshot | Captured from Route /docs");
    expect(bridge?.getSnapshot()?.activeTab).toBe("Meta");
  });

  it("hosts the remaining promoted runtime tabs inside iframe-backed panels", async () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "lifecycle:warn",
      timestamp: Date.now(),
      level: "warn",
      payload: {
        message: "Synthetic warning for issues coverage"
      }
    } as any);

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    const expectations = [
      { tab: "Issues", title: "Issue feed" },
      { tab: "Logs", title: "Investigation feed" },
      { tab: "Timeline", title: "Timeline" },
      { tab: "Router", title: "Router Diagnostics" },
      { tab: "Queue", title: "Queue feed" },
      { tab: "Performance", title: "Performance" },
      { tab: "Sanity Check", title: "Sanity Check" }
    ] as const;

    for (const expectation of expectations) {
      expect(bridge?.focusTab(expectation.tab)).toBe(true);
      await flushMicrotasks();

      const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
      const iframe = shadowRoot?.querySelector(`[data-devtools-iframe-area="${expectation.tab}"]`) as HTMLIFrameElement | null;
      const iframeDocument = iframe?.getAttribute("srcdoc") ?? "";

      expect(iframe).toBeTruthy();
      expect(iframeDocument).toContain(expectation.title);
    }

    expect(bridge?.getSnapshot()?.activeTab).toBe("Sanity Check");
  });

  it("hydrates route-scoped iframe tabs from retained debug history", async () => {
    emitDebug({
      type: "route:changed",
      timestamp: Date.now(),
      to: "/docs",
      from: "/"
    });

    emitDebug({
      type: "queue:enqueue",
      timestamp: Date.now() + 1,
      payload: {
        operation: "prefetch:/docs"
      }
    } as any);

    mountDevtoolsOverlay({ startOpen: true });

    const bridge = window.__TERAJS_DEVTOOLS_BRIDGE__;
    expect(bridge?.focusTab("Router")).toBe(true);
    await flushMicrotasks();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const routerIframe = shadowRoot?.querySelector('[data-devtools-iframe-area="Router"]') as HTMLIFrameElement | null;
    const routerDocument = routerIframe?.getAttribute("srcdoc") ?? "";

    expect(routerIframe).toBeTruthy();
    expect(routerDocument).toContain("Current route: /docs");

    expect(bridge?.focusTab("Queue")).toBe(true);
    await flushMicrotasks();

    const queueIframe = shadowRoot?.querySelector('[data-devtools-iframe-area="Queue"]') as HTMLIFrameElement | null;
    const queueDocument = queueIframe?.getAttribute("srcdoc") ?? "";

    expect(queueIframe).toBeTruthy();
    expect(queueDocument).toContain("prefetch:/docs");
  });

  it("provides bridge helpers for readiness, subscriptions, and session export", async () => {
    document.title = "Terajs Docs";
    document.documentElement.lang = "en";
    const description = document.createElement("meta");
    description.setAttribute("name", "description");
    description.setAttribute("content", "Terajs docs home");
    appendTestHeadNode(description);

    const bridgePromise = waitForDevtoolsBridge({ timeoutMs: 200 });
    mountDevtoolsOverlay();

    const bridge = await bridgePromise;
    expect(bridge.getSnapshot()?.activeTab).toBe("Components");

    const updates: Array<{ phase: string; activeTab: string | null }> = [];
    const unsubscribe = subscribeToDevtoolsBridge((detail, snapshot) => {
      updates.push({
        phase: detail.phase,
        activeTab: snapshot?.activeTab ?? null
      });
    });

    Debug.emit("effect:run", { key: "bridge-helper-check" });
    emitDebug({
      type: "error:component",
      timestamp: Date.now(),
      level: "error",
      file: "src/components/Counter.tera",
      line: 27,
      column: 9,
      scope: "Counter",
      instance: 1,
      message: "Counter render failed"
    } as any);
    expect(bridge.focusTab("AI Diagnostics")).toBe(true);

    const session = readDevtoolsBridgeSession();
    expect(session?.snapshot.activeTab).toBe("AI Diagnostics");
    expect(session?.snapshot.codeReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        file: "src/components/Counter.tera",
        line: 27,
        column: 9,
        summary: "Counter render failed"
      })
    ]));
    expect(session?.document?.title).toBe("Terajs Docs");
    expect(session?.document?.metaTags).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "description", value: "Terajs docs home" })
    ]));
    expect(session?.codeReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        file: "src/components/Counter.tera",
        line: 27,
        column: 9,
        summary: "Counter render failed"
      })
    ]));
    expect(session?.documentDiagnostics.some((entry) => entry.id === "missing-canonical")).toBe(true);
    expect(session?.events.some((event) => event.payload?.key === "bridge-helper-check")).toBe(true);
    expect(updates.some((entry) => entry.phase === "update" && entry.activeTab === "AI Diagnostics")).toBe(true);

    unsubscribe();
  });

  it("can mount without exposing the external bridge surface", () => {
    mountDevtoolsOverlay({ bridge: { enabled: false } });

    expect((window as typeof window & { __TERAJS_DEVTOOLS_BRIDGE__?: unknown }).__TERAJS_DEVTOOLS_BRIDGE__).toBeUndefined();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Tera Lens");
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
    expect(styleText).toContain("width: min(var(--terajs-overlay-panel-width, 1040px), calc(100vw - 24px));");
    expect(styleText).toContain("height: min(var(--terajs-overlay-panel-height, 720px), calc(100vh - 24px));");
    expect(styleText).toContain("max-height: calc(100vh - 24px);");
    expect(styleText).toContain(".devtools-shell-stage");
    expect(styleText).toContain(".devtools-body");
    expect(styleText).toContain(".devtools-panel--iframe");
    expect(styleText).toContain("overflow: hidden;");
    expect(styleText).toContain("@media (max-width: 720px)");
    expect(styleText).toContain("position: fixed;");
  });

  it("keeps shared inner workbench shells square and gapless", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styleText).toMatch(/\.devtools-workbench\s*\{[^}]*gap: 0;/);
    expect(styleText).toMatch(/\.devtools-workbench-sidebar,\s*\.devtools-workbench-main,\s*\.devtools-utility-panel\s*\{[^}]*border-radius: 0;/);
    expect(styleText).toMatch(/\.investigation-journal-feed,\s*\.investigation-journal-detail\s*\{[^}]*border-radius: 0;/);
    expect(styleText).toMatch(/\.signals-screen\s*\{[^}]*border-radius: 0;/);
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
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("1480px");
    expect(shell?.classList.contains("is-center")).toBe(true);
  });

  it("updates layout from settings controls and persists changes", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shadowRoot = host?.shadowRoot;
    const styleText = shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(shadowRoot?.querySelector('[data-tab="Settings"]')).toBeNull();

    const hostControlsToggle = shadowRoot?.querySelector('[data-host-controls-toggle="true"]') as HTMLButtonElement | null;
    hostControlsToggle?.click();

    expect(shadowRoot?.querySelector(".devtools-host-controls-panel")).not.toBeNull();
    expect(shadowRoot?.querySelector(".devtools-host-controls-scroll")).not.toBeNull();
    expect(shadowRoot?.querySelector(".select-button--compact")).not.toBeNull();
    expect(styleText).toContain("position: absolute;");
    expect(styleText).toContain("inset: 12px;");
    expect(styleText).toContain(".devtools-host-controls-scroll");

    const centerButton = shadowRoot?.querySelector('[data-layout-position="center"]') as HTMLButtonElement | null;
    centerButton?.click();
    expect(host?.style.top).toBe("50%");
    expect(host?.style.transform).toBe("translate(-50%, -50%)");

    const largeButton = shadowRoot?.querySelector('[data-layout-size="large"]') as HTMLButtonElement | null;
    largeButton?.click();
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("1480px");

    const fullscreenButton = shadowRoot?.querySelector('[data-window-control="fullscreen"]') as HTMLButtonElement | null;
    fullscreenButton?.click();
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("calc(100vw - 24px)");

    const persisted = JSON.parse(ensureTestStorage().getItem(OVERLAY_PREFERENCES_STORAGE_KEY) ?? "{}");
    expect(persisted.position).toBe("center");
    expect(persisted.panelSize).toBe("fullscreen");

    const persistToggle = shadowRoot?.querySelector('[data-layout-persist-toggle="true"]') as HTMLButtonElement | null;
    persistToggle?.click();
    expect(ensureTestStorage().getItem(OVERLAY_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it("supports header window controls for minimize and fullscreen", async () => {
    mountDevtoolsOverlay({ startOpen: true });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shadowRoot = host?.shadowRoot;
    const panel = shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;

    const fullscreenButton = shadowRoot?.querySelector('[data-window-control="fullscreen"]') as HTMLButtonElement | null;
    fullscreenButton?.click();
    await flushMicrotasks();
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("calc(100vw - 24px)");

    const minimizeButton = shadowRoot?.querySelector('[data-window-control="minimize"]') as HTMLButtonElement | null;
    minimizeButton?.click();
    await flushMicrotasks();
    expect(panel?.classList.contains("is-hidden")).toBe(true);
  });

  it("supports keyboard shortcuts for panel and visibility controls", () => {
    mountDevtoolsOverlay({ startOpen: false });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", altKey: true, shiftKey: true }));
    expect(panel?.classList.contains("is-hidden")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", altKey: true, shiftKey: true }));
    expect(host?.style.display).toBe("none");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", altKey: true, shiftKey: true }));
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

    expect(shadowRoot?.querySelector('.devtools-status-rail')).toBeNull();
    expect(shadowRoot?.querySelector('.devtools-header [data-theme-toggle="true"]')).toBeNull();

    const hostControlsToggle = shadowRoot?.querySelector('[data-host-controls-toggle="true"]') as HTMLButtonElement | null;
    hostControlsToggle?.click();

    const themeButton = shadowRoot?.querySelector('.devtools-host-controls-panel [data-theme-toggle="true"]') as HTMLButtonElement | null;
    themeButton?.click();
    expect(mountRoot?.dataset.theme).toBe("light");

    const clearButton = shadowRoot?.querySelector('[data-clear-events="true"]') as HTMLButtonElement | null;
    clearButton?.click();

    expect(shadowRoot?.textContent).toContain("Events: 0");

    unmountDevtoolsOverlay();
    mountDevtoolsOverlay();

    const remountedShadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(remountedShadowRoot?.textContent).toContain("Events: 0");
    expect(remountedShadowRoot?.textContent).not.toContain("Counter");
  });
}