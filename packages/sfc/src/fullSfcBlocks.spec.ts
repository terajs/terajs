import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";

describe("SFC mixed blocks", () => {
  it("parses template, script, style, ai, and route together", () => {
    const sfc = parseSFC(
      `
      <template><div>{{ msg }}</div></template>

      <script>
        export function setup() { return { msg: "hello" } }
      </script>

      <style>
        .x { color: blue; }
      </style>

      <ai>
        summary: Mixed block test
      </ai>

      <route>
        layout: main
      </route>
      `,
      "/components/Mixed.tera"
    );

    // template
    expect(
      typeof sfc.template === "string"
        ? sfc.template
        : sfc.template.content
    ).toContain("<div>{{ msg }}</div>");

    // script
    expect(
      typeof sfc.script === "string"
        ? sfc.script
        : sfc.script.content
    ).toContain("export function setup");

    // style
    const styleText =
      typeof sfc.style === "string"
        ? sfc.style
        : sfc.style?.content ?? "";

    expect(styleText).toContain(".x { color: blue; }");

    // ai
    expect(sfc.ai?.summary).toBe("Mixed block test");

    // route
    expect(sfc.routeOverride?.layout).toBe("main");
  });
});

