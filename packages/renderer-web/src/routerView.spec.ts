import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouteHydrationSnapshot, createRouter, type RouteDefinition } from "@terajs/router";
import { Debug } from "@terajs/shared";
import { mount, unmount } from "./mount";
import { createRouteView } from "./routerView";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.nbl",
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
              filePath: "/pages/layout.nbl",
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
              filePath: "/pages/docs/layout.nbl",
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