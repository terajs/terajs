import { describe, it, expect } from "vitest";
import { parseSFC } from "@nebula/sfc/index.js"
import { buildRouteFromSFC } from "../../../src/routing/routes";

const full = `
<template><h1>{{ title }}</h1></template>

<script>
  const title = "Hello"
</script>

<style>
  h1 { color: red; }
</style>

<meta>
  title: Hello
  ai-summary: auto
</meta>

<route>
  layout: blog
  hydrate: visible
</route>
`;

describe("Full SFC integration", () => {
  it("parses and builds route definition", () => {
    const sfc = parseSFC(full, "/pages/blog/[slug].nbl");
    const route = buildRouteFromSFC(sfc);

    expect(route.path).toBe("/blog/:slug");
    expect(route.layout).toBe("blog");
    expect(route.hydrate).toBe("visible");
    expect(route.meta).toBeTypeOf("object");
  });
});
