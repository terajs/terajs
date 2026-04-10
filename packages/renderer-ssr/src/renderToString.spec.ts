import { describe, it, expect } from "vitest";
import type { IRModule } from "@terajs/compiler";
import { renderToString } from "./renderToString";

/**
 * Helper to construct a minimal IRModule for testing.
 */
function mockIR(template: any[], meta: any = {}, route: any = null): IRModule {
  return {
    filePath: "/pages/index.tera",
    template,
    meta,
    route
  };
}

describe("renderToString", () => {
  it("renders plain text", () => {
    const ir = mockIR([{ type: "text", value: "Hello" }]);
    const { html, head } = renderToString(ir);

    expect(html).toBe(
      `Hello<script type="application/terajs-hydration">{"mode":"eager"}</script>`
    );
    expect(head).toBe("");
  });

  it("renders simple elements", () => {
    const ir = mockIR([
      {
        type: "element",
        tag: "div",
        props: [],
        children: [{ type: "text", value: "Hi" }]
      }
    ]);

    const { html } = renderToString(ir);

    expect(html).toBe(
      `<div>Hi</div><script type="application/terajs-hydration">{"mode":"eager"}</script>`
    );
  });

  it("injects basic meta into head", () => {
    const ir = mockIR(
      [{ type: "text", value: "Home" }],
      { title: "Home", description: "Welcome" }
    );

    const { head } = renderToString(ir);

    expect(head).toContain("<title>Home</title>");
    expect(head).toContain(
      `<meta name="description" content="Welcome">`
    );
  });

  it("renders OpenGraph, Twitter, and AI metadata", () => {
    const ir = mockIR(
      [{ type: "text", value: "Home" }],
      {
        title: "Home",
        "og:title": "Open Graph Home",
        "og:description": "OG description",
        "twitter:card": "summary_large_image",
        aiSummary: "AI summary text"
      }
    );

    const { head } = renderToString(ir);

    expect(head).toContain("<title>Home</title>");
    expect(head).toContain(
      `<meta property="og:title" content="Open Graph Home">`
    );
    expect(head).toContain(
      `<meta property="og:description" content="OG description">`
    );
    expect(head).toContain(
      `<meta name="twitter:card" content="summary_large_image">`
    );
    expect(head).toContain(
      `<meta name="ai:summary" content="AI summary text">`
    );
  });

  it("renders <ai> block from IR into head metadata", () => {
    const ir: IRModule = {
      filePath: "/pages/ai.tera",
      template: [],
      meta: { title: "AI Test" },
      ai: { intent: "documentation", priority: 0.9 },
      route: null
    };

    const { head } = renderToString(ir);

    expect(head).toContain('name="terajs-ai-hint"');
    expect(head).toContain('documentation');
  });

  it("merges route.meta and context.meta with IR meta", () => {
    const ir = mockIR(
      [{ type: "text", value: "Page" }],
      { title: "IR Title", description: "IR desc" }
    );

    const { head } = renderToString(ir, {
      meta: { title: "Context Title" },
      route: { meta: { description: "Route desc" } }
    });

    expect(head).toContain("<title>Context Title</title>");
    expect(head).toContain(
      `<meta name="description" content="Route desc">`
    );
  });

  it("uses meta.performance.hydrate when present", () => {
    const ir = mockIR(
      [{ type: "text", value: "Hello" }],
      { performance: { hydrate: "visible" } }
    );

    const { hydration } = renderToString(ir);

    expect(hydration.mode).toBe("visible");
  });

  it("route.hydrate overrides meta.performance.hydrate", () => {
    const ir = mockIR(
      [{ type: "text", value: "Hello" }],
      { performance: { hydrate: "idle" } },
      { hydrate: "interaction" }
    );

    const { hydration } = renderToString(ir);

    expect(hydration.mode).toBe("interaction");
  });

  it("serializes a route snapshot into the hydration marker", () => {
    const ir = mockIR([{ type: "text", value: "Hello" }], { title: "Docs" });

    const result = renderToString(ir, {
      routeSnapshot: {
        to: "/docs",
        params: {},
        query: {},
        hash: "",
        data: { slug: "docs" },
        resolved: {
          meta: { title: "Docs" },
          route: {
            id: "docs",
            path: "/docs",
            filePath: "/pages/docs.tera",
            layout: null,
            middleware: [],
            prerender: true,
            hydrate: "eager",
            edge: false,
            layouts: []
          }
        }
      }
    });

    expect(result.html).toContain('"routeSnapshot":{"to":"/docs"');
    expect(result.routeSnapshot).toEqual(
      expect.objectContaining({ to: "/docs", data: { slug: "docs" } })
    );
  });

  it("serializes loader data into the hydration payload", () => {
    const ir = mockIR([{ type: "text", value: "Hello" }], { title: "Docs" });

    const result = renderToString(ir, {
      data: { user: { id: 1 } }
    });

    expect(result.html).toContain('<script id="__TERAJS_DATA__" type="application/json">');
    expect(result.html).toContain('"user":{"id":1}');
    expect(result.data).toEqual({ user: { id: 1 } });
  });

  it("renders interpolations, conditionals, loops, and bound attrs from scope", () => {
    const ir = mockIR([
      {
        type: "element",
        tag: "section",
        props: [
          { kind: "bind", name: "class", value: "theme" },
          { kind: "bind", name: "data-count", value: "items.length" }
        ],
        children: [
          { type: "interp", expression: "title" },
          {
            type: "if",
            condition: "showTagline",
            then: [{ type: "element", tag: "p", props: [], children: [{ type: "interp", expression: "tagline" }] }],
            else: [{ type: "text", value: "fallback" }]
          },
          {
            type: "for",
            each: "items",
            item: "item",
            body: [{ type: "element", tag: "li", props: [], children: [{ type: "interp", expression: "item" }] }]
          }
        ]
      }
    ]);

    const { html } = renderToString(ir, {
      scope: {
        title: "Docs",
        theme: ["docs", "guide"],
        showTagline: true,
        tagline: "Start here",
        items: ["one", "two"]
      }
    });

    expect(html).toContain('<section class="docs guide" data-count="2">');
    expect(html).toContain("Docs");
    expect(html).toContain("<p>Start here</p>");
    expect(html).toContain("<li>one</li><li>two</li>");
  });

  it("renders slot content and falls back when missing", () => {
    const ir = mockIR([
      {
        type: "element",
        tag: "section",
        props: [],
        children: [
          {
            type: "slot",
            name: "header",
            fallback: [{ type: "text", value: "Fallback header" }]
          },
          {
            type: "slot",
            fallback: [{ type: "text", value: "Fallback body" }]
          }
        ]
      }
    ]);

    const { html } = renderToString(ir, {
      scope: {
        slots: {
          header: () => "Projected header",
          default: () => "Projected body"
        }
      }
    });

    expect(html).toContain("<section>Projected headerProjected body</section>");
  });

  it("renders portal children inline during SSR", () => {
    const ir = mockIR([
      {
        type: "portal",
        target: { kind: "static", name: "to", value: "body" },
        children: [
          {
            type: "element",
            tag: "div",
            props: [],
            children: [{ type: "text", value: "Overlay" }]
          }
        ]
      }
    ]);

    const { html } = renderToString(ir);

    expect(html).toContain("<div>Overlay</div>");
    expect(html).not.toContain("<portal>");
  });
});

