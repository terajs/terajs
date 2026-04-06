import { describe, it, expect, vi } from "vitest";
import type { HmrContext, Plugin } from "vite";
import terajsPlugin from "./index";
import { Debug } from "@terajs/shared";
import fs from "fs";
import path from "node:path";

vi.mock("./config", () => ({
  getAutoImportDirs: () => [path.resolve(process.cwd(), "packages/devtools/src/components")],
  getRouteDirs: () => [path.resolve(process.cwd(), "src/routes")],
  getConfiguredRoutes: () => []
}));

vi.mock("@terajs/shared", () => ({
  Debug: { emit: vi.fn() }
}));

describe("Terajs Vite Plugin (integration)", () => {
  function requireHook<TArgs extends unknown[], TResult>(
    hook: Plugin["load"] | Plugin["resolveId"] | Plugin["handleHotUpdate"]
  ): (...args: TArgs) => TResult {
    if (typeof hook === "function") {
      return hook as unknown as (...args: TArgs) => TResult;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as unknown as (...args: TArgs) => TResult;
    }

    throw new Error("Expected Vite plugin hook to be defined.");
  }

  it("emits sfc:load when loading a .nbl file", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    load("Component.nbl");
    expect(Debug.emit).toHaveBeenCalledWith("sfc:load", {
      scope: "Component.nbl"
    });
  });

  it("emits sfc:hmr on handleHotUpdate()", () => {
    const plugin = terajsPlugin();
    const handleHotUpdate = requireHook<[HmrContext], unknown>(plugin.handleHotUpdate);
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    const ctx = {
      file: "Component.nbl",
      server: {
        moduleGraph: {
          getModuleById: vi.fn(() => ({ id: "Component.nbl" })),
          invalidateModule: vi.fn()
        }
      }
    } as unknown as HmrContext;
    handleHotUpdate(ctx);
    expect(Debug.emit).toHaveBeenCalledWith("sfc:hmr", {
      scope: "Component.nbl"
    });
  });

  it("generates a virtual route manifest module", () => {
    const routesDir = path.resolve(process.cwd(), "src/routes");
    const productDir = path.join(routesDir, "products");

    vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      const value = String(input);
      return value === routesDir || value === productDir;
    });

    vi.spyOn(fs, "readdirSync").mockImplementation((input, options) => {
      const value = String(input);
      if (options && typeof options === "object" && "withFileTypes" in options && options.withFileTypes) {
        if (value === routesDir) {
          return [
            { name: "layout.nbl", isDirectory: () => false, isFile: () => true },
            { name: "index.nbl", isDirectory: () => false, isFile: () => true },
            { name: "products", isDirectory: () => true, isFile: () => false }
          ] as any;
        }

        if (value === productDir) {
          return [
            { name: "[id].nbl", isDirectory: () => false, isFile: () => true }
          ] as any;
        }
      }

      return [] as any;
    });

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("layout.nbl")) return "<template><slot /></template>";
      if (value.endsWith("index.nbl")) return "<template><Home /></template>";
      if (value.endsWith("[id].nbl")) return "<template><Product /></template>";
      return "<template />";
    });

    const plugin = terajsPlugin();
  const resolveId = requireHook<[string], unknown>(plugin.resolveId);
  const load = requireHook<[string], unknown>(plugin.load);
  const resolved = resolveId("virtual:terajs-routes");
  const code = load("\0virtual:terajs-routes");

    expect(resolved).toBe("\0virtual:terajs-routes");
    expect(typeof code).toBe("string");
    expect(code).toContain("@terajs/router-manifest");
    expect(code).toContain('filePath: "/src/routes/index.nbl"');
    expect(code).toContain('filePath: "/src/routes/products/[id].nbl"');
  });

  it("passes config-defined route overrides into the virtual manifest", async () => {
    const configModule = await import("./config");
    vi.spyOn(configModule, "getConfiguredRoutes").mockReturnValue([
      {
        filePath: path.resolve(process.cwd(), "src/routes/docs.nbl"),
        path: "/learn",
        middleware: ["docs"],
        prerender: false
      }
    ]);

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("docs.nbl")) return "<template><Docs /></template>";
      return "<template />";
    });

    const plugin = terajsPlugin();
  const load = requireHook<[string], unknown>(plugin.load);
  const code = load("\0virtual:terajs-routes");

    expect(typeof code).toBe("string");
    expect(code).toContain("routeConfigs");
    expect(code).toContain('path: "/learn"');
    expect(code).toContain('middleware: ["docs"]');
    expect(code).toContain('prerender: false');
  });
});
