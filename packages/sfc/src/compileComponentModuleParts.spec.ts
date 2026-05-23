import { describe, expect, it } from "vitest";
import { parseSFC } from "./parseSfc.js";
import { compileComponentModuleParts } from "./compileComponentModuleParts.js";

describe("compileComponentModuleParts", () => {
  it("compiles reusable script and template parts outside the Vite plugin", () => {
    const sfc = parseSFC(`
<script>
import HeroSection from "./HeroSection.tera"
const name = signal("Terajs")
</script>
<template>
  <div>Hello {{ name() }}</div>
</template>
`, "/src/shared/components/TestCard.tera");

    const compiled = compileComponentModuleParts(sfc);

    expect(compiled.name).toBe("TestCard");
    expect(compiled.setupCode).toContain('const name = signal("Terajs", { key: "name" })');
    expect(compiled.importedBindings).toContain("HeroSection");
    expect(compiled.exposedBindings).toContain("name");
    expect(compiled.ir.hasAsyncResource).toBe(false);
  });
});