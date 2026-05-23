import { describe, it, expect, vi } from "vitest";

import { compileSfcToComponent } from "./compileSfcToComponent";
import { compileComponentModuleParts } from "@terajs/sfc";

vi.mock("@terajs/sfc", async () => {
  const actual = await vi.importActual<typeof import("@terajs/sfc")>("@terajs/sfc");
  return {
    ...actual,
    compileComponentModuleParts: vi.fn(() => ({
      name: "Test",
      setupCode: "function __ssfc(){}",
      exposedBindings: ["LocalCard"],
      importedBindings: ["HeroSection"],
      ir: { meta: {}, ai: {}, route: null, hasAsyncResource: false }
    })),
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

    expect(compileComponentModuleParts).toHaveBeenCalledWith(sfc);
    expect(out).toContain('import { component, applyHMRUpdate, renderIRModuleToFragment } from "@terajs/app";');
    expect(out).toContain("const slots = normalizeSlots(props);");
    expect(out).toContain("__ssfc({ props: componentProps, slots, emit })");
    expect(out).toContain("__components: createComponentRegistry(ctx)");
    expect(out).toContain('"HeroSection": typeof HeroSection !== "undefined" ? HeroSection : undefined');
    expect(out).toContain('...pickBindings(["LocalCard"], ctx)');
    expect(out).toContain("import.meta.hot.accept");
    expect(out).toContain('name: "Test"');
  });

  it("reuses extracted compile-core output for the HMR wrapper", () => {
    const out = compileSfcToComponent({
      filePath: "/components/Test.tera",
      template: "<div>Hello</div>",
      script: "export function setup() {}",
      style: null,
      meta: {},
      ai: {},
      routeOverride: null
    } as any);

    expect(out).toContain('applyHMRUpdate("Test", nextSetup, nextIR);');
  });
});