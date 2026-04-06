import { describe, it, expect, vi } from "vitest";
import terajsPlugin from "./index";
import { Debug } from "@terajs/shared";
import fs from "fs";
import path from "node:path";

vi.mock("@terajs/shared", () => ({
  Debug: { emit: vi.fn() }
}));

vi.mock("@terajs/router", () => ({
  buildRouteManifest: vi.fn()
}));

describe("Terajs Vite Plugin (integration)", () => {
  it("emits sfc:load when loading a .nbl file", () => {
    const plugin = terajsPlugin();
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    plugin.load("Component.nbl");
    expect(Debug.emit).toHaveBeenCalledWith("sfc:load", {
      scope: "Component.nbl"
    });
  });

  it("emits sfc:hmr on handleHotUpdate()", () => {
    const plugin = terajsPlugin();
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    const ctx = {
      file: "Component.nbl",
      server: {
        moduleGraph: {
          getModuleById: vi.fn(() => ({ id: "Component.nbl" })),
          invalidateModule: vi.fn()
        }
      }
    };
    plugin.handleHotUpdate(ctx);
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
    const resolved = plugin.resolveId("virtual:terajs-routes");
    const code = plugin.load("\0virtual:terajs-routes");

    expect(resolved).toBe("\0virtual:terajs-routes");
    expect(typeof code).toBe("string");
    expect(code).toContain("buildRouteManifest");
    expect(code).toContain('filePath: "/src/routes/index.nbl"');
    expect(code).toContain('filePath: "/src/routes/products/[id].nbl"');
  });
});
