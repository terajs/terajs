import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";

describe("SFC <script> block", () => {
  it("parses a simple script block", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <script>
        export function setup() { return { msg: "hi" } }
      </script>
      `,
      "/components/ScriptTest.tera"
    );

    const scriptText =
      typeof sfc.script === "string"
        ? sfc.script
        : sfc.script.content;

    expect(scriptText.trim()).toContain("export function setup");
  });

  it("handles no script block", () => {
    const sfc = parseSFC(`<template>Hello</template>`, "/x.tera");
    expect(sfc.script).toBe("");
  });

  it("supports named exports", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <script>
        export const count = 1;
      </script>
      `,
      "/components/NamedExport.tera"
    );

    const scriptText =
      typeof sfc.script === "string"
        ? sfc.script
        : sfc.script.content;

    expect(scriptText).toContain("export const count");
  });
});

