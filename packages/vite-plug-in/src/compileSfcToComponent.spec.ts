import { describe, it, expect, vi } from "vitest";

import { compileSfcToComponent } from "./compileSfcToComponent";
import { compileStyle } from "@terajs/compiler";
import { compileScript, compileTemplateFromSFC } from "@terajs/sfc";

vi.mock("@terajs/compiler", async () => {
  const actual = await vi.importActual<typeof import("@terajs/compiler")>("@terajs/compiler");
  return {
    ...actual,
    compileStyle: vi.fn((sfc: { style?: unknown }, scopeId?: string) => (
      sfc.style
        ? {
            css: `.card${scopeId ? `[data-${scopeId}]` : ""} { color: red; }`,
            scoped: true,
            scopeId
          }
        : null
    ))
  };
});

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
    expect(out).toContain('import { component, applyHMRUpdate, renderIRModuleToFragment, Link } from "@terajs/app";');
    expect(out).toContain("const slots = normalizeSlots(props);");
    expect(out).toContain("__ssfc({ props: componentProps, slots, emit })");
    expect(out).toContain("__components: createComponentRegistry(ctx)");
    expect(out).toContain("Link,");
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

  it("registers usage-based auto imports with generated local bindings", () => {
    const sfc = {
      filePath: "/components/Test.tera",
      template: "<SmallWidget />",
      script: "",
      style: null,
      meta: {},
      ai: {},
      routeOverride: null
    };

    const out = compileSfcToComponent(sfc as any, {
      autoImports: {
        SmallWidget: "__terajsAutoImport0"
      }
    });

    expect(out).toContain('"SmallWidget": __terajsAutoImport0');
    expect(out).not.toContain("TerajsAutoImports");
  });

  it("compiles and registers SFC style blocks with HMR cleanup", () => {
    vi.mocked(compileTemplateFromSFC).mockReturnValueOnce({
      meta: {},
      ai: {},
      route: null,
      scopeId: "tera-card"
    } as any);

    const sfc = {
      filePath: "/components/Styled.tera",
      template: "<article class=\"card\">Styled</article>",
      script: "",
      style: {
        content: ".card { color: red; }",
        scoped: true
      },
      meta: {},
      ai: {},
      routeOverride: null
    };

    const out = compileSfcToComponent(sfc as any);

    expect(compileStyle).toHaveBeenCalledWith(sfc, "tera-card");
    expect(out).toContain(
      'import { component, applyHMRUpdate, renderIRModuleToFragment, Link, registerStyle, unregisterStyle } from "@terajs/app";'
    );
    expect(out).toContain('const __terajsStyleId = "tera-style:/components/Styled.tera";');
    expect(out).toContain(".card[data-tera-card] { color: red; }");
    expect(out).toContain("export function __terajsRegisterStyle()");
    expect(out).toContain("unregisterStyle(__terajsStyleId);");
    expect(out).toContain("registerStyle(__terajsStyleId, __terajsCss);");
    expect(out).toContain("import.meta.hot.dispose");
    expect(out).toContain("mod.__terajsRegisterStyle");
  });
});
