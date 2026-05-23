import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { scaffoldProject } from "../src/scaffold.js";
import { initTargetShell } from "../src/shell.js";

async function readText(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

describe("cli initTargetShell", () => {
  const originalCwd = process.cwd();

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  it("materializes an Android shell for a universal workspace and builds its native artifacts", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-shell-"));
    const templateRoot = join(originalCwd, "packages", "renderer-android", "android");

    process.chdir(tempRoot);
    await scaffoldProject("universal-app", {
      mode: "universal"
    });

    const appRoot = join(tempRoot, "universal-app");
    await initTargetShell("android", {
      cwd: appRoot,
      templateRoot
    });

    expect(await exists(join(appRoot, ".terajs", "generated", "android", "terajs-target.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "hosts", "android", "terajs-host.json"))).toBe(true);

    expect(await exists(join(appRoot, "android", "gradlew"))).toBe(true);
    expect(await exists(join(appRoot, "android", "gradle", "wrapper", "gradle-wrapper.properties"))).toBe(true);
    expect(await exists(join(appRoot, "android", "app", "build.gradle.kts"))).toBe(true);
    expect(await exists(join(appRoot, "android", "app", "src", "main", "AndroidManifest.xml"))).toBe(true);
    expect(await exists(join(appRoot, "android", "terajs-host", "build.gradle.kts"))).toBe(true);
    expect(await exists(join(appRoot, "android", "terajs-host", "src", "main", "kotlin", "dev", "terajs", "renderer", "android", "TerajsHostRuntime.kt"))).toBe(true);

    const settings = await readText(join(appRoot, "android", "settings.gradle.kts"));
    expect(settings).toContain("include(\":app\")");
    expect(settings).toContain("include(\":terajs-host\")");

    const appBuild = await readText(join(appRoot, "android", "app", "build.gradle.kts"));
    expect(appBuild).toContain('project(":terajs-host")');
    expect(appBuild).toContain(".terajs/generated/android");
    expect(appBuild).toContain(".terajs/hosts/android");
    expect(appBuild).toContain("syncTerajsShellAssets");

    const appManifest = await readText(join(appRoot, "android", "app", "src", "main", "AndroidManifest.xml"));
    expect(appManifest).toContain("android.intent.category.LAUNCHER");

    const readme = await readText(join(appRoot, "android", "README.md"));
    expect(readme).toContain("tera build --target android");
    expect(readme).toContain("./gradlew assembleDebug");
  });

  it("rejects Android shell initialization for non-universal workspaces", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-shell-"));
    const templateRoot = join(originalCwd, "packages", "renderer-android", "android");

    process.chdir(tempRoot);
    await scaffoldProject("web-app");

    const appRoot = join(tempRoot, "web-app");
    await expect(initTargetShell("android", {
      cwd: appRoot,
      templateRoot
    })).rejects.toThrow(/universal/i);
  });
});