import { describe, it, expect, vi } from "vitest";

import { compileSfcToComponent } from "./compileSfcToComponent";
import { compileScript } from "@terajs/sfc";

vi.mock("@terajs/sfc", async () => {
  const actual = await vi.importActual<typeof import("@terajs/sfc")>("@terajs/sfc");
  return {
    ...actual,
    compileScript: vi.fn(() => ({
      setupCode: "function setup(){}",
      exposed: ["LocalCard"],
      importedBindings: ["HeroSection"],
      hasAsyncResource: false
    })),
    compileTemplateFromSFC: vi.fn(() => ({ meta: {}, ai: {}, route: null }))
  };
});

describe("compileSfcToComponent", () => {
  it("generates a runnable component module with setup and renderer codegen", () => {
    const sfc = {
      filePath: "/components/Test.tera",
      template: "<div>Hello</div>",
      script: "export function setup() {}",
      style: null,
      meta: {},
      ai: {},
      routeOverride: null
    };

    const out = compileSfcToComponent(sfc as any);

    expect(compileScript).toHaveBeenCalledWith("export function setup() {}");
    expect(out).toContain('import { component, applyHMRUpdate, renderIRModuleToFragment } from "terajs";');
    expect(out).toContain("const slots = normalizeSlots(props);");
    expect(out).toContain("__ssfc({ props: componentProps, slots, emit })");
    expect(out).toContain("__components: createComponentRegistry(ctx)");
    expect(out).toContain('"HeroSection": typeof HeroSection !== "undefined" ? HeroSection : undefined');
    expect(out).toContain('...pickBindings(["LocalCard"], ctx)');
    expect(out).toContain("import.meta.hot.accept");
  });

  it("annotates top-level runtime bindings before compiling the SFC script", () => {
    const sfc = {
      filePath: "/components/Test.tera",
      template: "<div>Hello</div>",
      script: [
        'const doubledRef = computed(() => countRef() * stepRef())',
        'const stopGateWatch = watch(() => gate.value, () => {})',
        'const stopSurfaceWatch = watchEffect(() => { void panel.value })'
      ].join("\n"),
      style: null,
      meta: {},
      ai: {},
      routeOverride: null
    };

    compileSfcToComponent(sfc as any);

    expect(compileScript).toHaveBeenCalledWith(expect.stringContaining('{ key: "doubledRef" }'));
    expect(compileScript).toHaveBeenCalledWith(expect.stringContaining('{ debugName: "gate" }'));
    expect(compileScript).toHaveBeenCalledWith(expect.stringContaining('{ debugName: "stopSurfaceWatch" }'));
  });
});