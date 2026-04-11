import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldProject } from "../src/scaffold";

async function readText(path: string): Promise<string> {
  return readFile(path, "utf8");
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
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
    expect(packageJson.dependencies["terajs"]).toBe("^0.0.1");
    expect(packageJson.devDependencies["vite"]).toBe("^8.0.0");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain("autoImportDirs");
    expect(config).toContain("routeDirs");
    expect(config).toContain("devtools");
    expect(config).toContain("rootTarget");
    expect(config).toContain("middlewareDir");

    const viteConfig = await readText(join(appRoot, "vite.config.ts"));
    expect(viteConfig).toContain("terajsPlugin()");
    expect(viteConfig).toContain("from \"terajs/vite\"");

    const html = await readText(join(appRoot, "index.html"));
    expect(html).toContain("id=\"app\"");
    expect(html).not.toContain("/src/main.ts");

    const hasMain = await exists(join(appRoot, "src", "main.ts"));
    expect(hasMain).toBe(false);

    const env = await readText(join(appRoot, "src", "env.d.ts"));
    expect(env).toContain("declare module \"virtual:terajs-app\"");
    expect(env).toContain("bootstrapTerajsApp");

    const route = await readText(join(appRoot, "src", "pages", "index.tera"));
    expect(route).toContain("Welcome to demo-app");
  });

  it("can preconfigure socket.io hub scaffolding", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-scaffold-"));
    process.chdir(tempRoot);

    await scaffoldProject("socket-app", {
      hub: "socket.io",
      hubUrl: "https://api.example.com/socket-hub"
    });

    const appRoot = join(tempRoot, "socket-app");
    const packageJson = JSON.parse(await readText(join(appRoot, "package.json"))) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["terajs"]).toBe("^0.0.1");
    expect(packageJson.dependencies["@terajs/hub-socketio"]).toBe("^0.0.1");
    expect(packageJson.dependencies["socket.io-client"]).toBe("^4.8.1");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain("sync:");
    expect(config).toContain('type: "socket.io"');
    expect(config).toContain('url: "https://api.example.com/socket-hub"');
  });
});
