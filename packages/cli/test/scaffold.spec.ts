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
    expect(packageJson.dependencies["terajs"]).toBe("^1.0.0");
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
    expect(html).toContain("/src/plugins/index.ts");
    expect(html).toContain("data-terajs-ignore-bootstrap");
    expect(html).not.toContain("/src/main.ts");

    const hasMain = await exists(join(appRoot, "src", "main.ts"));
    expect(hasMain).toBe(false);

    const env = await readText(join(appRoot, "src", "env.d.ts"));
    expect(env).toContain("declare module \"virtual:terajs-app\"");
    expect(env).toContain("bootstrapTerajsApp");

    const pluginEntry = await readText(join(appRoot, "src", "plugins", "index.ts"));
    expect(pluginEntry).toContain('import "../styles.css"');

    const styles = await readText(join(appRoot, "src", "styles.css"));
    expect(styles).toContain(".starter-shell");
    expect(styles).toContain(".starter-stage");
    expect(styles).toContain(".starter-grid");

    const layout = await readText(join(appRoot, "src", "pages", "layout.tera"));
    expect(layout).toContain("class=\"starter-shell\"");
    expect(layout).toContain("<slot />");
    expect(layout).not.toContain("Starter navigation");

    const heroComponent = await readText(join(appRoot, "src", "components", "StarterHero.tera"));
    expect(heroComponent).toContain("class=\"hero\"");
    expect(heroComponent).toContain("class=\"hero__title\"");
    expect(heroComponent).not.toContain("site-button--primary");

    const route = await readText(join(appRoot, "src", "pages", "index.tera"));
    expect(route).toContain("<StarterHero");
    expect(route).toContain("Start building with Terajs.");
    expect(route).toContain('logo="/terajs-logo.png"');
    expect(route).toContain("Start in src/pages");
    expect(route).toContain("Compose from src/components");
    expect(route).toContain("Keep the docs close");
    expect(route).toContain("src/pages");
    expect(route).toContain("src/components");
    expect(route).toContain("src/plugins/index.ts");
    expect(route).toContain("https://terajs.com/docs");
    expect(route).toContain("https://terajs.com/docs/quickstart");
    expect(route).toContain("https://github.com/Thecodergabe/terajs");
    expect(route).not.toContain("Starter Pro Preview");
    expect(route).not.toContain("Starter overview");
    expect(route).not.toContain("This starter already has a second route.");

    const hasAbout = await exists(join(appRoot, "src", "pages", "about.tera"));
    expect(hasAbout).toBe(false);

    const heroLogo = await readFile(join(appRoot, "public", "terajs-logo.png"));
    const shellLogo = await readFile(join(appRoot, "public", "terajs-logo-extension.png"));
    expect(heroLogo.byteLength).toBeGreaterThan(0);
    expect(shellLogo.byteLength).toBeGreaterThan(0);
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

    expect(packageJson.dependencies["terajs"]).toBe("^1.0.0");
    expect(packageJson.dependencies["@terajs/hub-socketio"]).toBe("^1.0.0");
    expect(packageJson.dependencies["socket.io-client"]).toBe("^4.8.1");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain("sync:");
    expect(config).toContain('type: "socket.io"');
    expect(config).toContain('url: "https://api.example.com/socket-hub"');
  });
});
