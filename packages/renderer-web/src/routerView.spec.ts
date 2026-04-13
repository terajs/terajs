import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryHistory,
  createRouteHydrationSnapshot,
  createRouter,
  getRouteDataResourceKey,
  type RouteDefinition
} from "@terajs/router";
import { component, invalidateResources } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { Link } from "./link";
import { mount, unmount } from "./mount";
import type { RoutePendingProps } from "./routeShell";
import { createRouteView } from "./routerView";
import { RoutePending } from "./routeShell";
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
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createRouteView", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.title = "";
  });

  it("renders the current matched page and reacts to navigation", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const router = createRouter(
      [
        route({ path: "/", component: async () => ({ default: () => document.createTextNode("home") }) }),
        route({ path: "/about", component: async () => ({ default: () => document.createTextNode("about") }) })
      ],
      { history: createMemoryHistory("/") }
    );

    mount(createRouteView(router), root);
    await flush();
    expect(root.textContent).toContain("home");

    await router.navigate("/about");
    await flush();
    expect(root.textContent).toContain("about");

    unmount(root);
  });

  it("keeps the previous page visible while the next route loads when requested", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let resolveAbout: ((value: { default: () => Text }) => void) | undefined;
    const router = createRouter(
      [
        route({ path: "/", component: async () => ({ default: () => document.createTextNode("home") }) }),
        route({
          path: "/about",
          component: () => new Promise((resolve) => {
            resolveAbout = resolve;
          })
        })
      ],
      { history: createMemoryHistory("/") }
    );

    mount(
      createRouteView(router, {
        loading: () => document.createTextNode("loading page"),
        pending: ({ match }) => {
          const el = document.createElement("p");
          el.textContent = `pending:${match.fullPath}`;
          return el;
        },
        keepPreviousDuringLoading: true
      }),
      root
    );
    await flush();

    expect(root.textContent).toContain("home");

    await router.navigate("/about");
    await Promise.resolve();

    expect(root.querySelector('[data-tera-route-content="true"]')?.textContent).toContain("home");
    expect(root.querySelector('[data-tera-route-pending="true"]')?.textContent).toContain("pending:/about");

    resolveAbout?.({ default: () => document.createTextNode("about") });
    await flush();

    expect(root.textContent).toContain("about");
    expect(root.querySelector('[data-tera-route-pending="true"]')?.textContent).toBe("");

    unmount(root);
  });

  it("applies resolved route metadata to the document head", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const router = createRouter(
      [
        route({
          path: "/docs",
          meta: { title: "Docs", description: "Read the docs", keywords: ["terajs", "docs"] },
          component: async () => ({ default: () => document.createTextNode("docs") })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(document.title).toBe("Docs");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Read the docs");
    expect(document.head.querySelector('meta[name="keywords"]')?.getAttribute("content")).toBe("terajs, docs");

    unmount(root);
  });

  it("ignores invalid route metadata placeholders during navigation", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    document.title = "Terajs baseline";
    const router = createRouter(
      [
        route({
          path: "/docs",
          meta: { title: "undefined", description: "  ", keywords: ["", "undefined", "terajs"] },
          component: async () => ({ default: () => document.createTextNode("docs") })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(document.title).toBe("Terajs baseline");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('meta[name="keywords"]')?.getAttribute("content")).toBe("terajs");

    unmount(root);
  });

  it("uses a hydration snapshot for the initial route render", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const loadSpy = vi.fn(() => ({ fromLoader: true }));
    const router = createRouter(
      [
        route({
          path: "/docs",
          meta: { title: "Docs" },
          component: async () => ({
            default: ({ data }: { data: { fromSnapshot?: boolean } }) =>
              document.createTextNode(data.fromSnapshot ? "snapshot" : "loader"),
            load: loadSpy
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    const match = router.resolve("/docs");
    expect(match).not.toBeNull();

    const snapshot = createRouteHydrationSnapshot({
      match: match!,
      module: {},
      component: Object.assign(
        ({ data }: { data: { fromSnapshot?: boolean } }) =>
          document.createTextNode(data.fromSnapshot ? "snapshot" : "loader"),
        { meta: { title: "Docs" } }
      ),
      layouts: [],
      resolved: {
        meta: { title: "Docs" },
        route: {
          id: match!.route.id,
          path: match!.route.path,
          filePath: match!.route.filePath,
          layout: match!.route.layout,
          middleware: match!.route.middleware,
          prerender: match!.route.prerender,
          hydrate: match!.route.hydrate,
          edge: match!.route.edge,
          layouts: []
        }
      },
      data: { fromSnapshot: true }
    });

    mount(createRouteView(router, { hydrationSnapshot: snapshot }), root);
    await flush();

    expect(root.textContent).toContain("snapshot");
    expect(loadSpy).not.toHaveBeenCalled();

    unmount(root);
  });

  it("composes file layouts around the page with children", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const router = createRouter(
      [
        route({
          path: "/docs",
          component: async () => ({ default: () => document.createTextNode("page") }),
          layouts: [
            {
              id: "root",
              filePath: "/pages/layout.tera",
              component: async () => ({
                default: ({ children }: { children: Node }) => {
                  const el = document.createElement("section");
                  el.setAttribute("data-layout", "root");
                  el.appendChild(children);
                  return el;
                }
              })
            },
            {
              id: "docs",
              filePath: "/pages/docs/layout.tera",
              component: async () => ({
                default: ({ children }: { children: Node }) => {
                  const el = document.createElement("article");
                  el.setAttribute("data-layout", "docs");
                  el.appendChild(children);
                  return el;
                }
              })
            }
          ]
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.querySelector('[data-layout="root"]')?.textContent).toContain("page");
    expect(root.querySelector('[data-layout="docs"]')?.textContent).toContain("page");

    unmount(root);
  });

  it("preserves page component metadata through route layout composition", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    const Page = component({
      name: "DocsPage",
      meta: { title: "Docs route" },
      ai: { summary: "Docs summary", tags: ["docs", "guide"] }
    }, () => {
      return () => {
        const main = document.createElement("main");
        main.id = "docs-page-root";
        main.textContent = "page";
        return main;
      };
    });

    const Layout = component({ name: "DocsLayout" }, ({ children }: { children: Node }) => {
      return () => {
        const section = document.createElement("section");
        section.setAttribute("data-layout", "docs");
        section.appendChild(children);
        return section;
      };
    });

    const router = createRouter(
      [
        route({
          path: "/docs",
          component: async () => ({ default: Page }),
          layouts: [
            {
              id: "docs",
              filePath: "/pages/layout.tera",
              component: async () => ({ default: Layout })
            }
          ]
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    const pageRoot = root.querySelector("#docs-page-root") as (Element & {
      __terajsComponentContext?: { name?: string; meta?: unknown; ai?: unknown };
    }) | null;

    expect(pageRoot?.getAttribute("data-terajs-component-scope")).toBe("DocsPage");
    expect(pageRoot?.__terajsComponentContext?.name).toBe("DocsPage");
    expect(pageRoot?.__terajsComponentContext?.meta).toEqual({ title: "Docs route" });
    expect(pageRoot?.__terajsComponentContext?.ai).toEqual({ summary: "Docs summary", tags: ["docs", "guide"] });

    unmount(root);
  });

  it("revalidates the current route when its data key is invalidated", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let version = 0;
    const router = createRouter(
      [
        route({
          id: "docs",
          path: "/docs",
          component: async () => ({
            default: ({ data }: { data: { version: number } }) => document.createTextNode(`docs:${data.version}`),
            load: () => ({ version: ++version })
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("docs:1");

    await invalidateResources(getRouteDataResourceKey("docs"));
    await flush();

    expect(root.textContent).toContain("docs:2");

    unmount(root);
  });

  it("exposes a retry callback for route errors", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let shouldFail = true;
    const router = createRouter(
      [
        route({
          id: "docs",
          path: "/docs",
          component: async () => ({
            default: ({ data }: { data: { version: number } }) => document.createTextNode(`docs:${data.version}`),
            load: () => {
              if (shouldFail) {
                throw new Error("temporary");
              }

              return { version: 1 };
            }
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(
      createRouteView(router, {
        error: ({ retry }) => {
          const button = document.createElement("button");
          button.textContent = "retry";
          button.addEventListener("click", () => {
            shouldFail = false;
            void retry();
          });
          return button;
        }
      }),
      root
    );
    await flush();

    const button = root.querySelector("button");
    expect(button?.textContent).toBe("retry");

    button?.dispatchEvent(new MouseEvent("click"));
    await flush();

    expect(root.textContent).toContain("docs:1");

    unmount(root);
  });

  it("logs route errors and renders detailed default fallback text", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createRouter(
      [
        route({
          id: "docs",
          path: "/docs",
          component: async () => ({
            default: () => document.createTextNode("docs"),
            load: () => {
              throw new Error("loader failed hard");
            }
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("Route render failed: /docs");
    expect(root.textContent).toContain("loader failed hard");
    expect(consoleSpy).toHaveBeenCalledWith(
      "[terajs/router] Route render failed for /docs",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
    unmount(root);
  });

  it("wraps route component render failures with componentError fallback", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const router = createRouter(
      [
        route({
          id: "docs",
          path: "/docs",
          component: async () => ({
            default: () => {
              throw new Error("page failed");
            }
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(
      createRouteView(router, {
        componentError: ({ error }) => {
          const el = document.createElement("p");
          el.textContent = error instanceof Error ? error.message : String(error);
          return el;
        }
      }),
      root
    );
    await flush();

    expect(root.textContent).toContain("page failed");

    unmount(root);
  });

  it("provides router context to route descendants", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const router = createRouter(
      [
        route({
          id: "docs",
          path: "/docs",
          component: async () => ({
            default: () => Link({ to: "/about", children: "About" })
          })
        }),
        route({
          id: "about",
          path: "/about",
          component: async () => ({
            default: () => document.createTextNode("about")
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    root.querySelector("a")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(router.getCurrentRoute()?.fullPath).toBe("/about");
    expect(root.textContent).toContain("about");

    unmount(root);
  });

  it("retries route component failures from componentError fallback", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let shouldFail = true;
    const router = createRouter(
      [
        route({
          id: "docs",
          path: "/docs",
          component: async () => ({
            default: () => () => {
              if (shouldFail) {
                throw new Error("component update failed");
              }

              return document.createTextNode("component ok");
            }
          })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(
      createRouteView(router, {
        componentError: ({ retry }) => {
          const button = document.createElement("button");
          button.textContent = "recover";
          button.addEventListener("click", () => {
            shouldFail = false;
            retry();
          });
          return button;
        }
      }),
      root
    );
    await flush();

    expect(root.textContent).toContain("recover");

    root.querySelector("button")?.dispatchEvent(new MouseEvent("click"));
    await flush();

    expect(root.textContent).toContain("component ok");

    unmount(root);
  });

  it("renders route pending helpers from router navigation state", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let releaseGuard: (() => void) | undefined;
    const router = createRouter(
      [
        route({ path: "/", filePath: "/pages/index.tera" }),
        route({ path: "/docs", filePath: "/pages/docs.tera", middleware: ["slow"] })
      ],
      {
        history: createMemoryHistory("/"),
        middleware: {
          slow: () => new Promise<void>((resolve) => {
            releaseGuard = resolve;
          })
        }
      }
    );

    await router.start();
    mount(
      () => withRouterContext(router, () => RoutePending({
        children: (state: Parameters<NonNullable<RoutePendingProps["when"]>>[0]) => `pending:${state.to}`,
        fallback: "idle"
      })),
      root
    );

    expect(root.textContent).toContain("idle");

    const navigation = router.navigate("/docs");
    await Promise.resolve();

    expect(root.textContent).toContain("pending:/docs");

    releaseGuard?.();
    await navigation;
    await flush();

    expect(root.textContent).toContain("idle");

    unmount(root);
  });

  it("renders not-found fallback and exposes router errors to debug hooks", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const debugSpy = vi.spyOn(Debug, "emit");
    const router = createRouter([], { history: createMemoryHistory("/missing") });

    mount(
      createRouteView(router, {
        notFound: ({ target }) => document.createTextNode(`missing:${target}`)
      }),
      root
    );
    await flush();

    expect(root.textContent).toContain("missing:/missing");
    expect(debugSpy).toHaveBeenCalledWith(
      "error:router",
      expect.objectContaining({ to: "/missing" })
    );

    debugSpy.mockRestore();
    unmount(root);
  });
});