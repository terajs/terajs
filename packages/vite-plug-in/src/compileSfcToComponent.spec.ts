import { describe, it, expect, vi } from "vitest";

import { compileSfcToComponent } from "./compileSfcToComponent";
import { compileScript } from "@terajs/sfc";

vi.mock("@terajs/sfc", async () => {
  const actual = await vi.importActual<typeof import("@terajs/sfc")>("@terajs/sfc");
  return {
    ...actual,
    compileScript: vi.fn(() => ({ setupCode: "function setup(){}" })),
    compileTemplateFromSFC: vi.fn(() => ({ meta: {}, ai: {}, route: null }))
  };
});

describe("compileSfcToComponent", () => {
  it("generates a runnable component module with setup and renderer codegen", () => {
    const sfc = {
      filePath: "/components/Test.nbl",
      template: "<div>Hello</div>",
      script: "export function setup() {}",
      style: null,
      meta: {},
      ai: {},
      routeOverride: null
    };

    const out = compileSfcToComponent(sfc as any);

    expect(compileScript).toHaveBeenCalledWith("export function setup() {}");
    expect(out).toContain('import { renderIRModuleToFragment } from "@terajs/renderer-web";');
    expect(out).toContain("const slots = normalizeSlots(props);");
    expect(out).toContain("__ssfc({ props: componentProps, slots, emit })");
    expect(out).toContain("import.meta.hot.accept");
  });
});