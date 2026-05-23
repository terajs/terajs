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

async function readScaffoldVersionRange(workspaceRoot: string): Promise<string> {
  const cliManifest = JSON.parse(await readText(join(workspaceRoot, "packages", "cli", "package.json"))) as {
    dependencies?: Record<string, string>;
  };

  const frameworkVersionRange = cliManifest.dependencies?.["@terajs/app"];

  if (!frameworkVersionRange) {
    throw new Error("packages/cli/package.json is missing the @terajs/app dependency range");
  }

  return frameworkVersionRange;
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
    const scaffoldVersionRange = await readScaffoldVersionRange(originalCwd);

    await scaffoldProject("demo-app");

    const appRoot = join(tempRoot, "demo-app");
    const packageJson = JSON.parse(await readText(join(appRoot, "package.json"))) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toBe("vite");
    expect(packageJson.scripts.build).toBe("vite build");
    expect(packageJson.dependencies["@terajs/app"]).toBe(scaffoldVersionRange);
    expect(packageJson.devDependencies["vite"]).toBe("^8.0.0");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain("autoImportDirs");
    expect(config).toContain("routeDirs");
    expect(config).toContain("devtools");
    expect(config).toContain("rootTarget");
    expect(config).toContain("middlewareDir");
    expect(config).not.toContain('mode: "universal"');

    const viteConfig = await readText(join(appRoot, "vite.config.ts"));
    expect(viteConfig).toContain("terajsPlugin()");
    expect(viteConfig).toContain("from \"@terajs/app/vite\"");

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

    const gitIgnore = await readText(join(appRoot, ".gitignore"));
    expect(gitIgnore).toContain("node_modules");
    expect(gitIgnore).toContain("dist");
    expect(gitIgnore).not.toContain(".terajs/generated");
    expect(gitIgnore).not.toContain(".terajs/hosts");

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
    expect(route).toContain("https://github.com/terajs/terajs");
    expect(route).not.toContain("Starter Pro Preview");
    expect(route).not.toContain("Starter overview");
    expect(route).not.toContain("This starter already has a second route.");

    const hasAbout = await exists(join(appRoot, "src", "pages", "about.tera"));
    expect(hasAbout).toBe(false);

    const hasWebOnlyTargetOutput = await exists(join(appRoot, ".terajs"));
    expect(hasWebOnlyTargetOutput).toBe(false);

    const hasSharedPages = await exists(join(appRoot, "src", "shared", "pages"));
    expect(hasSharedPages).toBe(false);

    const cliReadme = await readText(join(originalCwd, "packages", "cli", "README.md"));
    expect(cliReadme).toContain("The default scaffold stays web-first and targets `@terajs/app`.");
    expect(cliReadme).toContain("Use universal mode when one workspace should own shared `.tera` source");

    const heroLogo = await readFile(join(appRoot, "public", "terajs-logo.png"));
    const shellLogo = await readFile(join(appRoot, "public", "terajs-logo-extension.png"));
    expect(heroLogo.byteLength).toBeGreaterThan(0);
    expect(shellLogo.byteLength).toBeGreaterThan(0);
  });

  it("can scaffold an explicit universal workspace mode", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-scaffold-"));
    process.chdir(tempRoot);
    const scaffoldVersionRange = await readScaffoldVersionRange(originalCwd);

    await scaffoldProject("universal-app", {
      mode: "universal"
    });

    const appRoot = join(tempRoot, "universal-app");
    const packageJson = JSON.parse(await readText(join(appRoot, "package.json"))) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["@terajs/app"]).toBe(scaffoldVersionRange);
    expect(packageJson.devDependencies["vite"]).toBe("^8.0.0");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain('mode: "universal"');
    expect(config).toContain('sourceRoot: "src/shared"');
    expect(config).toContain('selected: ["web", "android", "ios"]');
    expect(config).toContain('routeDirs: ["src/shared/pages"]');
    expect(config).toContain('autoImportDirs: ["src/shared/components"]');
    expect(config).toContain('generatedDir: ".terajs/generated/android"');
    expect(config).toContain('hostDir: ".terajs/hosts/ios"');

    const html = await readText(join(appRoot, "index.html"));
    expect(html).toContain("Terajs Universal Workspace");

    const gitIgnore = await readText(join(appRoot, ".gitignore"));
    expect(gitIgnore).toContain(".terajs/generated");
    expect(gitIgnore).toContain(".terajs/hosts");

    const sharedLayout = await readText(join(appRoot, "src", "shared", "pages", "layout.tera"));
    expect(sharedLayout).toContain("class=\"starter-shell\"");

    const sharedPage = await readText(join(appRoot, "src", "shared", "pages", "index.tera"));
    expect(sharedPage).toContain("Author once. Map targets deliberately.");
    expect(sharedPage).toContain("src/shared/pages");
    expect(sharedPage).toContain(".terajs/generated");
    expect(sharedPage).toContain("default scaffold");

    const sharedHero = await readText(join(appRoot, "src", "shared", "components", "StarterHero.tera"));
    expect(sharedHero).toContain("class=\"hero\"");

    const readme = await readText(join(appRoot, "README.md"));
    expect(readme).toContain("--mode universal");
    expect(readme).toContain("src/shared/components");
    expect(readme).toContain(".terajs/hosts/android");
    expect(readme).toContain("dist");

    const generatedAndroidExists = await exists(join(appRoot, ".terajs", "generated", "android"));
    const generatedIosExists = await exists(join(appRoot, ".terajs", "generated", "ios"));
    const hostsAndroidExists = await exists(join(appRoot, ".terajs", "hosts", "android"));
    const hostsIosExists = await exists(join(appRoot, ".terajs", "hosts", "ios"));
    expect(generatedAndroidExists).toBe(true);
    expect(generatedIosExists).toBe(true);
    expect(hostsAndroidExists).toBe(true);
    expect(hostsIosExists).toBe(true);

    const defaultPagesExists = await exists(join(appRoot, "src", "pages"));
    expect(defaultPagesExists).toBe(false);
  });

  it("can preconfigure socket.io hub scaffolding", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-scaffold-"));
    process.chdir(tempRoot);
    const scaffoldVersionRange = await readScaffoldVersionRange(originalCwd);

    await scaffoldProject("socket-app", {
      hub: "socket.io",
      hubUrl: "https://api.example.com/socket-hub"
    });

    const appRoot = join(tempRoot, "socket-app");
    const packageJson = JSON.parse(await readText(join(appRoot, "package.json"))) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["@terajs/app"]).toBe(scaffoldVersionRange);
    expect(packageJson.dependencies["@terajs/hub-socketio"]).toBe(scaffoldVersionRange);
    expect(packageJson.dependencies["socket.io-client"]).toBe("^4.8.1");

    const config = await readText(join(appRoot, "terajs.config.cjs"));
    expect(config).toContain("sync:");
    expect(config).toContain('type: "socket.io"');
    expect(config).toContain('url: "https://api.example.com/socket-hub"');
  });
});
