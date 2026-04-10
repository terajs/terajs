import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";

describe("SFC <style> block", () => {
  it("captures raw CSS content", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <style>
        .btn { color: red; }
      </style>
      `,
      "/components/StyleTest.tera"
    );

    const styleText =
      typeof sfc.style === "string"
        ? sfc.style
        : sfc.style?.content ?? "";

    expect(styleText.trim()).toBe(".btn { color: red; }");
  });

  it("handles missing style block", () => {
    const sfc = parseSFC(`<template>Hello</template>`, "/x.tera");
    expect(sfc.style).toBeNull();
  });
});

