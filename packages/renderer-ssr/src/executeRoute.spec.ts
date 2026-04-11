import { describe, expect, it } from "vitest";
import {
  getRouteDataResourceKey,
  ROUTE_DATA_RESOURCE_KEY,
  type RouteDefinition
} from "@terajs/router";
import { executeServerRoute } from "./executeRoute";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.tera",
    component: async () => ({ default: null }),
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

describe("executeServerRoute", () => {
  it("loads a route, resolves metadata, and renders SSR output from IR", async () => {
    const result = await executeServerRoute([
      route({
        path: "/docs/:slug",
        filePath: "/pages/docs/[slug].tera",
        component: async () => ({
          ir: {
            filePath: "/pages/docs/[slug].tera",
            template: [
              { type: "element", tag: "article", props: [], children: [{ type: "interp", expression: "title" }] }
            ],
            meta: { title: "Docs" },
            route: null
          },
          setup: ({ params, data }: { params: { slug: string }; data: { title: string } }) => ({
            title: `${data.title}:${params.slug}`
          }),
          load: ({ params }: { params: { slug: string } }) => ({ title: params.slug.toUpperCase() })
        })
      })
    ], "/docs/router");

    expect(result.type).toBe("success");
    if (result.type !== "success") {
      throw new Error("Expected success result");
    }

    expect(result.loaded.data).toEqual({ title: "ROUTER" });
    expect(result.snapshot.to).toBe("/docs/router");
    expect(result.ssr.html).toContain("<article>ROUTER:router</article>");
    expect(result.ssr.head).toContain("<title>Docs</title>");
  });

  it("returns redirects from router middleware", async () => {
    const result = await executeServerRoute(
      [
        route({ path: "/admin", filePath: "/pages/admin.tera", middleware: ["auth"] }),
        route({ path: "/signin", filePath: "/pages/signin.tera" })
      ],
      "/admin",
      {
        middleware: {
          auth: () => "/signin"
        }
      }
    );

    expect(result.type).toBe("redirect");
  });

  it("passes server request context into route loaders", async () => {
    const result = await executeServerRoute([
      route({
        id: "profile",
        path: "/profile",
        filePath: "/pages/profile.tera",
        component: async () => ({
          ir: {
            filePath: "/pages/profile.tera",
            template: [
              {
                type: "element",
                tag: "article",
                props: [],
                children: [{ type: "interp", expression: "data.viewer" }]
              }
            ],
            meta: { title: "Profile" },
            route: null
          },
          load: ({ server }: { server?: { request?: { headers?: Record<string, string> }; locals?: Record<string, unknown> } }) => ({
            viewer: `${server?.request?.headers?.authorization}:${String(server?.locals?.tenant)}`
          })
        })
      })
    ], "/profile", {
      serverContext: {
        request: {
          headers: {
            authorization: "Bearer token"
          }
        },
        locals: {
          tenant: "docs"
        }
      }
    });

    expect(result.type).toBe("success");
    if (result.type !== "success") {
      throw new Error("Expected success result");
    }

    expect(result.loaded.data).toEqual({ viewer: "Bearer token:docs" });
    expect(result.ssr.html).toContain("<article>Bearer token:docs</article>");
  });

  it("composes nested layout IR around the page and serializes route data resources", async () => {
    const result = await executeServerRoute([
      route({
        id: "docs",
        path: "/docs/:slug",
        filePath: "/pages/docs/[slug].tera",
        layouts: [
          {
            id: "root",
            filePath: "/pages/layout.tera",
            component: async () => ({
              ir: {
                filePath: "/pages/layout.tera",
                template: [
                  {
                    type: "element",
                    tag: "main",
                    props: [{ kind: "static", name: "data-layout", value: "root" }],
                    children: [{ type: "interp", expression: "children" }]
                  }
                ],
                meta: {},
                route: null
              }
            })
          },
          {
            id: "docs-shell",
            filePath: "/pages/docs/layout.tera",
            component: async () => ({
              ir: {
                filePath: "/pages/docs/layout.tera",
                template: [
                  {
                    type: "element",
                    tag: "section",
                    props: [{ kind: "static", name: "data-layout", value: "docs" }],
                    children: [{ type: "interp", expression: "children" }]
                  }
                ],
                meta: {},
                route: null
              }
            })
          }
        ],
        component: async () => ({
          ir: {
            filePath: "/pages/docs/[slug].tera",
            template: [
              {
                type: "element",
                tag: "article",
                props: [],
                children: [{ type: "interp", expression: "data.title" }]
              }
            ],
            meta: { title: "Docs" },
            route: null
          },
          load: ({ params }: { params: { slug: string } }) => ({ title: params.slug.toUpperCase() })
        })
      })
    ], "/docs/router");

    expect(result.type).toBe("success");
    if (result.type !== "success") {
      throw new Error("Expected success result");
    }

    expect(result.ssr.html).toContain('<main data-layout="root"><section data-layout="docs"><article>ROUTER</article></section></main>');
    expect(result.ssr.resources).toEqual({
      [ROUTE_DATA_RESOURCE_KEY]: { title: "ROUTER" },
      [getRouteDataResourceKey("docs")]: { title: "ROUTER" }
    });
    expect(result.ssr.html).toContain(`"${ROUTE_DATA_RESOURCE_KEY}":{"title":"ROUTER"}`);
  });
});