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
    expect(await exists(join(appRoot, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"))).toBe(true);

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
    expect(appBuild).toContain("TERA_ANDROID_RELEASE_STORE_FILE");
    expect(appBuild).toContain("signingConfigs");
    expect(appBuild).toContain("getByName(\"release\")");

    const appManifest = await readText(join(appRoot, "android", "app", "src", "main", "AndroidManifest.xml"));
    expect(appManifest).toContain("android.intent.category.LAUNCHER");

    const mainActivity = await readText(join(appRoot, "android", "app", "src", "main", "kotlin", "dev", "terajs", "apps", "universal", "app", "android", "MainActivity.kt"));
    expect(mainActivity).toContain("AndroidRhinoRuntime");
    expect(mainActivity).toContain("AndroidHostRuntime");
    expect(mainActivity).toContain("AndroidRuntimeAssetReader");
    expect(mainActivity).toContain("ensureLiveRuntimeAssets");
    expect(mainActivity).toContain("generated-route-runtime.json");
    expect(mainActivity).toContain("live-runtime-entry.js");
    expect(mainActivity).toContain("liveRuntime.start(liveRuntimeEntrySource)");
    expect(mainActivity).toContain("runtimeDescriptorPath = runtimeDescriptorAssetPath");
    expect(mainActivity).toContain("receiveCommandBatchPayload");
    expect(mainActivity).toContain("root-command-batch.json");

    const readme = await readText(join(appRoot, "android", "README.md"));
    expect(readme).toContain("tera build --target android");
    expect(readme).toContain("./gradlew assembleDebug");
    expect(readme).toContain("tera shell doctor android --release");
    expect(readme).toContain("TERA_ANDROID_RELEASE_STORE_FILE");
    expect(readme).toContain("./gradlew assembleRelease");
    expect(readme).toContain("generated route runtime descriptor");
    expect(readme).toContain("live runtime entry bundle");
    expect(readme).toContain("render a real native bootstrap tree");
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

  it("materializes an iOS shell for a universal workspace and builds its native artifacts", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-shell-"));
    const templateRoot = join(originalCwd, "packages", "renderer-ios", "ios");

    process.chdir(tempRoot);
    await scaffoldProject("universal-app", {
      mode: "universal"
    });

    const appRoot = join(tempRoot, "universal-app");
    await initTargetShell("ios", {
      cwd: appRoot,
      templateRoot
    });

    expect(await exists(join(appRoot, ".terajs", "generated", "ios", "terajs-target.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "hosts", "ios", "terajs-host.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "generated", "ios", "runtime", "generated-route-runtime.json"))).toBe(true);
    expect(await exists(join(appRoot, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"))).toBe(true);

    expect(await exists(join(appRoot, "ios", "Package.swift"))).toBe(true);
    expect(await exists(join(appRoot, "ios", "TerajsAppHost.json"))).toBe(true);
    expect(await exists(join(appRoot, "ios", "Sources", "TerajsRendererHost", "TerajsHostRuntimeContract.swift"))).toBe(true);
    expect(await exists(join(appRoot, "ios", "Sources", "TerajsRendererHost", "TerajsHostRuntime.swift"))).toBe(true);
    expect(await exists(join(appRoot, "ios", ".gitignore"))).toBe(true);

    const packageSwift = await readText(join(appRoot, "ios", "Package.swift"));
    expect(packageSwift).toContain("TerajsRendererHost");
    expect(packageSwift).toContain(".iOS(.v15)");

    const appHostConfig = JSON.parse(await readText(join(appRoot, "ios", "TerajsAppHost.json"))) as {
      bundleIdentifier: string;
      generatedHostManifest: string;
      generatedRuntimeEntry: string;
      packageProduct: string;
    };
    expect(appHostConfig).toMatchObject({
      bundleIdentifier: "dev.terajs.apps.universal.app.ios",
      generatedHostManifest: "../.terajs/hosts/ios/terajs-host.json",
      generatedRuntimeEntry: "../.terajs/generated/ios/runtime/live-runtime-entry.js",
      packageProduct: "TerajsRendererHost"
    });

    const readme = await readText(join(appRoot, "ios", "README.md"));
    expect(readme).toContain("tera build --target ios");
    expect(readme).toContain("tera shell doctor ios --release");
    expect(readme).toContain("TerajsAppHost.json");
    expect(readme).toContain("swift build");
    expect(readme).toContain("live runtime entry bundle");
    expect(readme).toContain("Hosted iOS compilation and simulator or device validation still require macOS with Xcode.");
  });

  it("rejects iOS shell initialization for non-universal workspaces", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "terajs-cli-shell-"));
    const templateRoot = join(originalCwd, "packages", "renderer-ios", "ios");

    process.chdir(tempRoot);
    await scaffoldProject("web-app");

    const appRoot = join(tempRoot, "web-app");
    await expect(initTargetShell("ios", {
      cwd: appRoot,
      templateRoot
    })).rejects.toThrow(/universal/i);
  });
});
