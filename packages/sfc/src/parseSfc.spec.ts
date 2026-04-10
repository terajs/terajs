import { describe, it, expect } from "vitest";
import { parseSFC } from "./parseSfc";

const sample = `
<template>
  <div>Hello</div>
</template>

<script>
  const x = 1
</script>

<style>
  .a { color: red; }
</style>

<meta>
  title: Hello
</meta>

<route>
  layout: blog
</route>
`;

describe("parseSFC", () => {
  it("extracts all blocks correctly", () => {
    const sfc = parseSFC(sample, "/pages/test.tera");

    const templateText =
      typeof sfc.template === "string"
        ? sfc.template
        : sfc.template.content;

    const scriptText =
      typeof sfc.script === "string"
        ? sfc.script
        : sfc.script.content;

    const styleText =
      typeof sfc.style === "string"
        ? sfc.style
        : sfc.style?.content ?? "";

    expect(templateText).toContain("<div>Hello</div>");
    expect(scriptText).toContain("const x = 1");
    expect(styleText).toContain(".a { color: red; }");

    expect(sfc.meta.title).toBe("Hello");
    expect(sfc.routeOverride?.layout).toBe("blog");
  });

  it("handles missing blocks", () => {
    const sfc = parseSFC("<template>hi</template>", "/pages/x.tera");

    expect(sfc.script).toBe("");
    expect(sfc.style).toBeNull();
    expect(sfc.meta).toEqual({});
    expect(sfc.routeOverride).toBeNull();
  });
});

describe("SFC Diagnostics", () => {
  it("should throw an error for empty reactive expressions", () => {
    const code = `<template><div>{{  }}</div></template>`;
    expect(() => parseSFC(code, "error.tera")).toThrow("Empty reactive expression");
  });

  it("should throw an error for mismatched tags", () => {
    const code = `<template><div></span></template>`;
    expect(() => parseSFC(code, "error.tera")).toThrow("Mismatched or unclosed tag");
  });
});
