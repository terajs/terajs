import { expect, it } from "vitest";
import { Debug, emitDebug } from "@terajs/shared";
import { mountDevtoolsOverlay, toggleDevtoolsOverlay } from "./overlay";

export function registerOverlayComponentsSuite(): void {
  it("highlights component roots when selected from the components list", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

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

  it("keeps the components header search-only and hides the inspector until selection", () => {
    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const treeHeader = shadowRoot?.querySelector(".components-screen-tree .components-screen-header") as HTMLDivElement | null;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;

    expect(treeHeader?.querySelector(".components-screen-search")).toBeTruthy();
    expect(treeHeader?.querySelector(".panel-title")).toBeNull();
    expect(treeHeader?.querySelector(".panel-subtitle")).toBeNull();
    expect(treeHeader?.querySelector(".components-screen-pill")).toBeNull();
    expect(shadowRoot?.querySelector('[data-action="clear-component-selection"]')).toBeNull();
    expect(shadowRoot?.querySelector(".components-screen-inspector")).toBeNull();

    componentButton?.click();

    expect(shadowRoot?.querySelector(".components-screen-inspector")).toBeTruthy();
  });

  it("highlights component roots when hovering tree rows", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

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

  it("releases stale tree hover preview when pointer tracking resumes on the page", () => {
    const firstRoot = document.createElement("div");
    firstRoot.setAttribute("data-terajs-component-scope", "Counter");
    firstRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(firstRoot);

    const secondRoot = document.createElement("div");
    secondRoot.setAttribute("data-terajs-component-scope", "Panel");
    secondRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(secondRoot);

    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Panel",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));

    expect(firstRoot.classList.contains("terajs-devtools-hover-component")).toBe(true);
    expect(secondRoot.classList.contains("terajs-devtools-hover-component")).toBe(false);

    secondRoot.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, composed: true }));

    expect(firstRoot.classList.contains("terajs-devtools-hover-component")).toBe(false);
    expect(secondRoot.classList.contains("terajs-devtools-hover-component")).toBe(true);
  });

  it("clears tree hover preview when the pointer moves to a non-component overlay tab", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    const aiTabButton = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;

    componentButton?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(true);

    aiTabButton?.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(false);
  });

  it("clears tree hover preview when overlay mouseover reaches a non-component control", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    const aiTabButton = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;

    componentButton?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(true);

    aiTabButton?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));

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

    mountDevtoolsOverlay({ startOpen: true });

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
    const childMeta = shadowRoot?.querySelector('[data-component-key="Layout#1"] .component-tree-meta') as HTMLSpanElement | null;

    expect(parentButton?.textContent).toContain("Layout");
    expect(parentButton?.textContent).not.toContain("root");
    expect(childMeta?.textContent).toContain("1 child");
    expect(parentButton?.textContent).not.toContain("#1");
    expect(childRow?.querySelector(".component-tree-branch")?.classList.contains("is-terminal")).toBe(true);
    expect(childPlaceholder?.textContent?.trim() ?? "").toBe("");
  });

  it("uses nested DOM matches and DOM order when a component key appears on multiple roots", () => {
    const orphanIndexRoot = document.createElement("section");
    orphanIndexRoot.setAttribute("data-terajs-component-scope", "index");
    orphanIndexRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(orphanIndexRoot);

    const appShellRoot = document.createElement("div");
    appShellRoot.setAttribute("data-terajs-component-scope", "TerajsAppShell");
    appShellRoot.setAttribute("data-terajs-component-instance", "1");

    const layoutRoot = document.createElement("div");
    layoutRoot.setAttribute("data-terajs-component-scope", "layout");
    layoutRoot.setAttribute("data-terajs-component-instance", "1");

    const nestedIndexRoot = document.createElement("main");
    nestedIndexRoot.setAttribute("data-terajs-component-scope", "index");
    nestedIndexRoot.setAttribute("data-terajs-component-instance", "1");

    const siteCodeWindowRoot = document.createElement("div");
    siteCodeWindowRoot.setAttribute("data-terajs-component-scope", "SiteCodeWindow");
    siteCodeWindowRoot.setAttribute("data-terajs-component-instance", "1");

    nestedIndexRoot.appendChild(siteCodeWindowRoot);
    layoutRoot.appendChild(nestedIndexRoot);
    appShellRoot.appendChild(layoutRoot);
    document.body.appendChild(appShellRoot);

    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "SiteCodeWindow",
      instance: 1
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "index",
      instance: 1
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "layout",
      instance: 1
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "TerajsAppShell",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const labels = Array.from(shadowRoot?.querySelectorAll(".component-tree-label") ?? []).map((node) => {
      return node.textContent?.trim() ?? "";
    }).filter(Boolean);

    const layoutRow = shadowRoot?.querySelector('[data-component-key="layout#1"]')?.closest(".component-tree-row") as HTMLDivElement | null;
    const indexRow = shadowRoot?.querySelector('[data-component-key="index#1"]')?.closest(".component-tree-row") as HTMLDivElement | null;
    const siteCodeWindowRow = shadowRoot?.querySelector('[data-component-key="SiteCodeWindow#1"]')?.closest(".component-tree-row") as HTMLDivElement | null;

    expect(labels.slice(0, 4)).toEqual(["<TerajsAppShell />", "<layout />", "<index />", "<SiteCodeWindow />"]);
    expect(layoutRow?.dataset.treeDepth).toBe("1");
    expect(indexRow?.dataset.treeDepth).toBe("2");
    expect(siteCodeWindowRow?.dataset.treeDepth).toBe("3");
  });

  it("merges DOM-marked components with a partial lifecycle registry", () => {
    const appShellRoot = document.createElement("div");
    appShellRoot.setAttribute("data-terajs-component-scope", "TerajsAppShell");
    appShellRoot.setAttribute("data-terajs-component-instance", "1");

    const layoutRoot = document.createElement("div");
    layoutRoot.setAttribute("data-terajs-component-scope", "layout");
    layoutRoot.setAttribute("data-terajs-component-instance", "1");

    const siteHeaderRoot = document.createElement("header");
    siteHeaderRoot.setAttribute("data-terajs-component-scope", "SiteHeader");
    siteHeaderRoot.setAttribute("data-terajs-component-instance", "1");

    const pageRoot = document.createElement("main");
    pageRoot.setAttribute("data-terajs-component-scope", "index");
    pageRoot.setAttribute("data-terajs-component-instance", "1");

    const siteFooterRoot = document.createElement("footer");
    siteFooterRoot.setAttribute("data-terajs-component-scope", "SiteFooter");
    siteFooterRoot.setAttribute("data-terajs-component-instance", "1");

    layoutRoot.appendChild(siteHeaderRoot);
    layoutRoot.appendChild(pageRoot);
    layoutRoot.appendChild(siteFooterRoot);
    appShellRoot.appendChild(layoutRoot);
    document.body.appendChild(appShellRoot);

    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "layout",
      instance: 1
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "SiteHeader",
      instance: 1
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "SiteFooter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const labels = Array.from(shadowRoot?.querySelectorAll(".component-tree-label") ?? []).map((node) => {
      return node.textContent?.trim() ?? "";
    }).filter(Boolean);

    expect(labels.slice(0, 5)).toEqual([
      "<TerajsAppShell />",
      "<layout />",
      "<SiteHeader />",
      "<index />",
      "<SiteFooter />"
    ]);
  });

  it("toggles component selection off when the selected row is clicked again", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;

    let componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(componentButton?.classList.contains("is-active")).toBe(true);
    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);
    expect(shadowRoot?.querySelector(".components-screen-inspector")).toBeTruthy();

    componentButton?.click();

    componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(componentButton?.classList.contains("is-active")).toBe(false);
    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(false);
    expect(shadowRoot?.querySelector(".components-screen-inspector")).toBeNull();
  });

  it("uses collapsible component drill-down sections", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

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

    mountDevtoolsOverlay({ startOpen: true });

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
    mountDevtoolsOverlay({ startOpen: true });

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
    mountDevtoolsOverlay({ startOpen: true });
    // Activate route so route-scoped buffer is populated
    emitDebug({
      type: "route:changed",
      timestamp: Date.now(),
      to: "/" ,
      from: null
    });
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;

    expect(componentButton).toBeTruthy();
    expect(shadowRoot?.textContent).toContain("Events: 2");

    Debug.emit("effect:run", { key: "global:effect" });

    const stableComponentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(shadowRoot?.textContent).toContain("Events: 3");
    expect(stableComponentButton).toBe(componentButton);
  });

  it("clears selected highlight when leaving the components tab", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

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

    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(false);
  });
}