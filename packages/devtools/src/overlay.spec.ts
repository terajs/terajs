import { afterEach, describe, expect, it } from "vitest";
import { Debug, emitDebug } from "@terajs/shared";
import { mountDevtoolsOverlay, toggleDevtoolsOverlay, unmountDevtoolsOverlay } from "./overlay";

describe("devtools overlay public entry", () => {
  afterEach(() => {
    unmountDevtoolsOverlay();
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

  it("toggles overlay visibility without remounting a second host", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    expect(host?.style.display).toBe("block");

    toggleDevtoolsOverlay();
    expect(host?.style.display).toBe("none");

    toggleDevtoolsOverlay();
    expect(host?.style.display).toBe("block");

    mountDevtoolsOverlay();
    expect(document.querySelectorAll("#terajs-overlay-container")).toHaveLength(1);
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
});