import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldProject } from "../src/scaffold";

async function readText(path: string): Promise<string> {
  return readFile(path, "utf8");
}

describe("cli scaffoldProject", () => {
  const originalCwd = process.cwd();
  let tempRoot = "";

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  it("creates a runnable starter project layout", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-scaffold-"));
    process.chdir(tempRoot);

    await scaffoldProject("demo-app");

    const appRoot = join(tempRoot, "demo-app");
    const packageJson = JSON.parse(await readText(join(appRoot, "package.json"))) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toBe("vite");
    expect(packageJson.scripts.build).toBe("vite build");
    expect(packageJson.dependencies["@terajs/runtime"]).toBe("^0.0.1");
    expect(packageJson.dependencies["@terajs/renderer-web"]).toBe("^0.0.1");
    expect(packageJson.devDependencies["@terajs/vite-plugin"]).toBe("^0.0.1");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain("autoImportDirs");
    expect(config).toContain("routeDirs");

    const viteConfig = await readText(join(appRoot, "vite.config.ts"));
    expect(viteConfig).toContain("terajsPlugin()");

    const html = await readText(join(appRoot, "index.html"));
    expect(html).toContain("id=\"app\"");

    const main = await readText(join(appRoot, "src", "main.ts"));
    expect(main).toContain("mount(App, root)");

    const route = await readText(join(appRoot, "src", "routes", "index.tera"));
    expect(route).toContain("Welcome to demo-app");
  });
});
