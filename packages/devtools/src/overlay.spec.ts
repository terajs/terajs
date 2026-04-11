import { afterEach, describe, expect, it, vi } from "vitest";
import { Debug, emitDebug, resetDebugListeners } from "@terajs/shared";
import {
  mountDevtoolsOverlay,
  toggleDevtoolsOverlay,
  toggleDevtoolsVisibility,
  unmountDevtoolsOverlay
} from "./overlay";

describe("devtools overlay public entry", () => {
  afterEach(() => {
    unmountDevtoolsOverlay();
    resetDebugListeners();
    delete (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__;
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

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
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
});