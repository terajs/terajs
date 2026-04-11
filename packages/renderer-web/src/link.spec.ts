import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter, type RouteDefinition } from "@terajs/router";
import { component } from "@terajs/runtime";

import { Link } from "./link";
import { mount, unmount } from "./mount";
import { withRouterContext } from "./routerContext";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.tera",
    component: async () => ({ default: () => document.createTextNode("home") }),
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    layouts: [],
    ...overrides
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Link", () => {
  it("navigates with the router on normal left click", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    await router.start();
    mount(() => Link({ router, to: "/docs", children: "Docs" }), root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(router.getCurrentRoute()?.fullPath).toBe("/docs");

    unmount(root);
  });

  it("uses replace navigation when requested", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    await router.start();
    const replaceSpy = vi.spyOn(router, "replace");
    mount(() => Link({ router, to: "/docs", replace: true, children: "Docs" }), root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(replaceSpy).toHaveBeenCalledWith("/docs");

    unmount(root);
  });

  it("falls back to normal anchor behavior for non-primary clicks and preserves external hrefs", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    await router.start();
    const navigateSpy = vi.spyOn(router, "navigate");
    mount(() => Link({ router, to: "/docs", children: "Docs" }), root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 1 }));
    await flush();

    expect(navigateSpy).not.toHaveBeenCalled();

    unmount(root);

    const externalRoot = document.createElement("div");
    mount(() => Link({ router, to: "https://example.com", children: "External" }), externalRoot);
    const externalAnchor = externalRoot.querySelector("a") as HTMLAnchorElement;
    expect(externalAnchor.getAttribute("href")).toBe("https://example.com");

    unmount(externalRoot);
  });

  it("uses router context when no router prop is provided", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    const App = component({ name: "App" }, () => () => withRouterContext(router, () => Link({ to: "/docs", children: "Docs" })));

    await router.start();
    mount(App, root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(router.getCurrentRoute()?.fullPath).toBe("/docs");

    unmount(root);
  });

  it("updates active classes and aria-current as navigation changes", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" }),
      route({ id: "docs-api", path: "/docs/api" })
    ], {
      history: createMemoryHistory("/")
    });

    const App = component({ name: "App" }, () => () => withRouterContext(router, () => Link({
      to: "/docs",
      activeClass: "active",
      inactiveClass: "idle",
      children: "Docs"
    })));

    await router.start();
    mount(App, root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    expect(anchor.className).toBe("idle");
    expect(anchor.getAttribute("aria-current")).toBeNull();

    await router.navigate("/docs/api");
    await flush();

    expect(anchor.className).toBe("active");
    expect(anchor.getAttribute("aria-current")).toBe("page");

    unmount(root);
  });

  it("prefetches linked routes on intent and marks pending navigations", async () => {
    let releaseGuard: (() => void) | undefined;
    const docsComponent = vi.fn(async () => ({
      default: () => document.createTextNode("docs")
    }));
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({
        id: "docs",
        path: "/docs",
        component: docsComponent,
        middleware: ["slow"]
      })
    ], {
      history: createMemoryHistory("/"),
      middleware: {
        slow: () => new Promise<void>((resolve) => {
          releaseGuard = resolve;
        })
      }
    });

    const App = component({ name: "App" }, () => () => withRouterContext(router, () => Link({
      to: "/docs",
      prefetch: true,
      pendingClass: "pending",
      activeClass: "active",
      inactiveClass: "idle",
      children: "Docs"
    })));

    await router.start();
    mount(App, root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await flush();

    expect(docsComponent).toHaveBeenCalledTimes(1);

    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(anchor.className).toBe("pending");
    expect(anchor.getAttribute("data-pending")).toBe("true");
    expect(anchor.getAttribute("aria-busy")).toBe("true");

    releaseGuard?.();
    await flush();

    expect(router.getCurrentRoute()?.fullPath).toBe("/docs");
    expect(anchor.className).toBe("active");
    expect(docsComponent).toHaveBeenCalledTimes(1);

    unmount(root);
  });
});