import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryHistory,
  createRouteHydrationSnapshot,
  createRouter,
  getRouteDataResourceKey,
  type RouteDefinition
} from "@terajs/router";
import { component, invalidateResources, onMounted, onUnmounted } from "@terajs/runtime";
import { signal } from "@terajs/reactivity";
import { Debug } from "@terajs/shared";
import { Link } from "./link";
import { mount, unmount } from "./mount";
import type { RoutePendingProps } from "./routeShell";
import { renderIRModuleToFragment } from "./renderFromIR";
import { createRouteView } from "./routerView";
import { RouterView } from "./routeOutlet";
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

  it("throws when RouterView renders outside a routed branch", () => {
    expect(() => RouterView()).toThrowError(
      "RouterView must be rendered inside a routed branch managed by createRouteView()."
    );
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

  it("runs mounted hooks for routed page components", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let mountedCalls = 0;
    const Page = component({ name: "MountedRoutePage" }, () => {
      onMounted(() => {
        mountedCalls += 1;
      });

      return () => document.createTextNode("mounted page");
    });
    const router = createRouter(
      [
        route({
          path: "/mounted",
          component: async () => ({ default: Page })
        })
      ],
      { history: createMemoryHistory("/mounted") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("mounted page");
    expect(mountedCalls).toBe(1);

    unmount(root);
  });

  it("runs mounted hooks for layout-wrapped route components", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let pageMountedCalls = 0;
    let layoutMountedCalls = 0;
    const Page = component({ name: "LayoutWrappedRoutePage" }, () => {
      onMounted(() => {
        pageMountedCalls += 1;
      });

      return () => document.createTextNode("wrapped page");
    });
    const Layout = component({ name: "MountedRouteLayout" }, ({ children }: { children: Node }) => {
      onMounted(() => {
        layoutMountedCalls += 1;
      });

      return () => {
        const section = document.createElement("section");
        section.setAttribute("data-layout", "mounted");
        section.appendChild(children);
        return section;
      };
    });
    const router = createRouter(
      [
        route({
          path: "/mounted",
          component: async () => ({ default: Page }),
          layouts: [
            {
              id: "root",
              filePath: "/pages/layout.tera",
              component: async () => ({ default: Layout })
            }
          ]
        })
      ],
      { history: createMemoryHistory("/mounted") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.querySelector('[data-layout="mounted"]')?.textContent).toContain("wrapped page");
    expect(pageMountedCalls).toBe(1);
    expect(layoutMountedCalls).toBe(1);

    unmount(root);
  });

  it("updates route content after a component calls router.navigate", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const router = createRouter(
      [
        route({
          id: "a",
          path: "/a",
          component: async () => ({
            default: () => {
              const button = document.createElement("button");
              button.textContent = "go b";
              button.addEventListener("click", () => {
                void router.navigate("/b");
              });
              return button;
            }
          })
        }),
        route({
          id: "b",
          path: "/b",
          component: async () => ({ default: () => document.createTextNode("route b") })
        })
      ],
      { history: createMemoryHistory("/a") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("go b");

    root.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();

    expect(router.getCurrentRoute()?.fullPath).toBe("/b");
    expect(root.textContent).toContain("route b");

    unmount(root);
  });

  it("runs mounted hooks after route navigation", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let mountedCalls = 0;
    const Destination = component({ name: "MountedDestinationPage" }, () => {
      onMounted(() => {
        mountedCalls += 1;
      });

      return () => document.createTextNode("destination");
    });
    const router = createRouter(
      [
        route({
          id: "start",
          path: "/start",
          component: async () => ({ default: () => document.createTextNode("start") })
        }),
        route({
          id: "destination",
          path: "/destination",
          component: async () => ({ default: Destination })
        })
      ],
      { history: createMemoryHistory("/start") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("start");

    await router.navigate("/destination");
    await flush();

    expect(root.textContent).toContain("destination");
    expect(mountedCalls).toBe(1);

    unmount(root);
  });

  it("runs destination mounted hooks after a mounted hook redirects", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let destinationMountedCalls = 0;
    let loginMountedCalls = 0;
    let router!: ReturnType<typeof createRouter>;
    const Login = component({ name: "LoginRedirectPage" }, () => {
      onMounted(() => {
        loginMountedCalls += 1;
        void router.navigate("/migrations");
      });

      return () => document.createTextNode("login");
    });
    const Migrations = component({ name: "MountedMigrationsPage" }, () => {
      onMounted(() => {
        destinationMountedCalls += 1;
      });

      return () => document.createTextNode("migrations");
    });

    router = createRouter(
      [
        route({
          id: "login",
          path: "/login",
          component: async () => ({ default: Login })
        }),
        route({
          id: "migrations",
          path: "/migrations",
          component: async () => ({ default: Migrations })
        })
      ],
      { history: createMemoryHistory("/login") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("migrations");
    expect(loginMountedCalls).toBe(1);
    expect(destinationMountedCalls).toBe(1);

    unmount(root);
  });

  it("renders nested child routes inside RouterView without remounting the parent", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let parentMounted = 0;
    let parentUnmounted = 0;
    let mappingMounted = 0;
    let mappingUnmounted = 0;
    let issuesMounted = 0;

    const Parent = component({ name: "MigrationsPane" }, () => {
      onMounted(() => {
        parentMounted += 1;
      });
      onUnmounted(() => {
        parentUnmounted += 1;
      });

      return () => {
        const shell = document.createElement("section");
        shell.setAttribute("data-testid", "migrations-shell");
        const sidebar = document.createElement("aside");
        sidebar.textContent = "Migration shell";
        shell.append(sidebar, RouterView());
        return shell;
      };
    });
    const Mapping = component({ name: "MappingPane" }, () => {
      onMounted(() => {
        mappingMounted += 1;
      });
      onUnmounted(() => {
        mappingUnmounted += 1;
      });

      return () => document.createTextNode("Mapping child");
    });
    const Issues = component({ name: "IssuesPane" }, () => {
      onMounted(() => {
        issuesMounted += 1;
      });

      return () => document.createTextNode("Issues child");
    });
    const router = createRouter(
      [
        route({
          id: "migrations",
          path: "/migrations/:id",
          filePath: "/pages/migrations/[id].tera",
          component: async () => ({ default: Parent })
        }),
        route({
          id: "mapping",
          path: "/migrations/:id/mapping",
          filePath: "/pages/migrations/[id]/mapping.tera",
          component: async () => ({ default: Mapping })
        }),
        route({
          id: "issues",
          path: "/migrations/:id/issues",
          filePath: "/pages/migrations/[id]/issues.tera",
          component: async () => ({ default: Issues })
        })
      ],
      { history: createMemoryHistory("/migrations/123/mapping") }
    );

    mount(createRouteView(router), root);
    await flush();

    const shell = root.querySelector('[data-testid="migrations-shell"]');
    expect(shell?.textContent).toContain("Migration shell");
    expect(shell?.textContent).toContain("Mapping child");
    expect(parentMounted).toBe(1);
    expect(mappingMounted).toBe(1);

    await router.navigate("/migrations/123/issues");
    await flush();

    expect(root.querySelector('[data-testid="migrations-shell"]')).toBe(shell);
    expect(root.textContent).toContain("Issues child");
    expect(root.textContent).not.toContain("Mapping child");
    expect(parentMounted).toBe(1);
    expect(parentUnmounted).toBe(0);
    expect(mappingUnmounted).toBe(1);
    expect(issuesMounted).toBe(1);

    unmount(root);
  });

  it("allows a conditional nested RouterView to reappear after the parent rerenders", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const showChild = signal(true);
    let parentMounted = 0;
    let parentUnmounted = 0;
    let childMounted = 0;
    let childUnmounted = 0;

    const Parent = component({ name: "ConditionalOutletParent" }, () => {
      onMounted(() => {
        parentMounted += 1;
      });
      onUnmounted(() => {
        parentUnmounted += 1;
      });

      const ir = {
        filePath: "/pages/migrations/[id].tera",
        template: [
          {
            type: "element",
            tag: "section",
            props: [{ kind: "static", name: "data-testid", value: "conditional-shell" }],
            children: [
              {
                type: "element",
                tag: "h2",
                props: [],
                children: [{ type: "text", value: "Parent shell", flags: {} }],
                flags: {}
              },
              {
                type: "if",
                condition: "showChild",
                then: [{
                  type: "element",
                  tag: "RouterView",
                  props: [],
                  children: [],
                  flags: {}
                }],
                else: [{
                  type: "element",
                  tag: "p",
                  props: [{ kind: "static", name: "data-testid", value: "base-pane" }],
                  children: [{ type: "text", value: "Base pane", flags: {} }],
                  flags: {}
                }],
                flags: {}
              }
            ],
            flags: {}
          }
        ]
      };
      const ctx = {
        showChild,
        __components: { RouterView }
      };

      return () => renderIRModuleToFragment(ir as any, ctx);
    });
    const Child = component({ name: "ConditionalOutletChild" }, () => {
      onMounted(() => {
        childMounted += 1;
      });
      onUnmounted(() => {
        childUnmounted += 1;
      });

      return () => document.createTextNode("Child pane");
    });
    const router = createRouter(
      [
        route({
          id: "migration",
          path: "/migrations/:id",
          filePath: "/pages/migrations/[id].tera",
          component: async () => ({ default: Parent })
        }),
        route({
          id: "connect",
          path: "/migrations/:id/connect",
          filePath: "/pages/migrations/[id]/connect.tera",
          component: async () => ({ default: Child })
        })
      ],
      { history: createMemoryHistory("/migrations/123/connect") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("Parent shell");
    expect(root.textContent).toContain("Child pane");
    expect(parentMounted).toBe(1);
    expect(childMounted).toBe(1);

    showChild.set(false);
    await flush();

    expect(root.textContent).toContain("Base pane");
    expect(root.textContent).not.toContain("Child pane");
    expect(parentMounted).toBe(1);
    expect(parentUnmounted).toBe(0);
    expect(childUnmounted).toBe(1);

    showChild.set(true);
    await flush();

    expect(root.textContent).toContain("Child pane");
    expect(parentMounted).toBe(1);
    expect(parentUnmounted).toBe(0);
    expect(childMounted).toBe(2);

    unmount(root);
  });

  it("falls back to leaf rendering when a derived parent route has no RouterView", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let parentMounted = 0;
    const Parent = component({ name: "FlatParentPage" }, () => {
      onMounted(() => {
        parentMounted += 1;
      });

      return () => document.createTextNode("Parent list");
    });
    const Child = component({ name: "FlatChildPage" }, () => {
      return () => document.createTextNode("Child detail");
    });
    const router = createRouter(
      [
        route({
          id: "parent",
          path: "/items",
          filePath: "/pages/items/index.tera",
          component: async () => ({ default: Parent })
        }),
        route({
          id: "child",
          path: "/items/:id",
          filePath: "/pages/items/[id].tera",
          component: async () => ({ default: Child })
        })
      ],
      { history: createMemoryHistory("/items/42") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(root.textContent).toContain("Child detail");
    expect(root.textContent).not.toContain("Parent list");
    expect(parentMounted).toBe(0);

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
          meta: {
            title: "Docs",
            canonical: "auto",
            description: "Read the docs",
            keywords: ["terajs", "docs"]
          },
          component: async () => ({ default: () => document.createTextNode("docs") })
        })
      ],
      { history: createMemoryHistory("/docs") }
    );

    mount(createRouteView(router), root);
    await flush();

    expect(document.title).toBe("Docs");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://localhost:3000/docs");
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
      branch: [],
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
      __terajsComponentContext?: {
        name?: string;
        meta?: unknown;
        ai?: unknown;
        route?: {
          route?: { path?: string };
          params?: Record<string, unknown>;
          query?: Record<string, unknown>;
          hash?: string;
          data?: unknown;
        };
      };
    }) | null;

    expect(pageRoot?.getAttribute("data-terajs-component-scope")).toBe("DocsPage");
    expect(pageRoot?.__terajsComponentContext?.name).toBe("DocsPage");
    expect(pageRoot?.__terajsComponentContext?.meta).toEqual({ title: "Docs route" });
    expect(pageRoot?.__terajsComponentContext?.ai).toEqual({ summary: "Docs summary", tags: ["docs", "guide"] });
    expect(pageRoot?.__terajsComponentContext?.route).toMatchObject({
      route: {
        pathname: "/docs",
        route: { path: "/docs" }
      },
      params: {},
      query: {},
      hash: "",
      data: undefined
    });

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
