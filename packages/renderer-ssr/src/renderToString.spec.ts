import { describe, it, expect } from "vitest";
import type { IRModule } from "@nebula/compiler";
import { renderToString } from "./renderToString";

/**
 * Helper to construct a minimal IRModule for testing.
 */
function mockIR(template: any[], meta: any = {}, route: any = null): IRModule {
  return {
    filePath: "/pages/index.nbl",
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
      `Hello<script type="application/nebula-hydration">{"mode":"eager"}</script>`
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
      `<div>Hi</div><script type="application/nebula-hydration">{"mode":"eager"}</script>`
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
});
