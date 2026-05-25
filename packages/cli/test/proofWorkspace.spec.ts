import { afterEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";

import { getWorkspaceConfig } from "@terajs/app/vite";

import { runBuildCommand } from "../src/build.js";
import { initTargetShell } from "../src/shell.js";
import {
  inspectTargetShell,
  resolveAndroidSdkRoot,
  resolveJavaHome,
} from "../src/shellDoctor.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
  originalCwd,
} from "./proofWorkspaceTestHarness.js";

async function runShellGradleAssemble(shellDir: string, env: NodeJS.ProcessEnv): Promise<void> {
  const wrapperPath = path.join(shellDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
  const command = process.platform === "win32" ? "cmd.exe" : wrapperPath;
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", wrapperPath, "--no-daemon", "assembleDebug"]
    : ["--no-daemon", "assembleDebug"];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: shellDir,
      env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Android shell assemble terminated by signal ${signal}.`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`Android shell assemble failed with exit code ${code ?? -1}.`));
        return;
      }

      resolve();
    });
  });
}

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

describe("proof workspace", () => {
  it("moves Android shell doctor from missing shell state to env-blocked once shell assets exist", async () => {
    const tempWorkspace = await copyProofWorkspace();
    const shellEnv = {
      ProgramFiles: tempWorkspace,
      LOCALAPPDATA: tempWorkspace,
      USERPROFILE: tempWorkspace,
      HOME: tempWorkspace,
      JAVA_HOME: "",
      ANDROID_SDK_ROOT: "",
      ANDROID_HOME: ""
    };

    process.chdir(tempWorkspace);

    const beforeBuild = inspectTargetShell("android", {
      cwd: tempWorkspace,
      env: shellEnv
    });

    expect(beforeBuild.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "android-shell-dir")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "android-generated-manifest")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "android-bootstrap-batch")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "android-runtime-descriptor")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "android-runtime-entry")?.ok).toBe(false);

    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const afterBuild = inspectTargetShell("android", {
      cwd: tempWorkspace,
      env: shellEnv
    });

    expect(afterBuild.ok).toBe(false);
    expect(afterBuild.checks.find((check) => check.id === "android-generated-manifest")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "android-bootstrap-batch")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "android-runtime-descriptor")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "android-runtime-entry")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "android-shell-dir")?.ok).toBe(false);

    await initTargetShell("android", {
      cwd: tempWorkspace,
      templateRoot: path.join(originalCwd, "packages", "renderer-android", "android")
    });

    const afterShellInit = inspectTargetShell("android", {
      cwd: tempWorkspace,
      env: shellEnv
    });

    expect(afterShellInit.ok).toBe(false);
    expect(afterShellInit.checks.find((check) => check.id === "android-shell-dir")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-shell-wrapper")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-generated-manifest")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-bootstrap-batch")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-runtime-descriptor")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-runtime-entry")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-host-manifest")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "android-java-home")?.ok).toBe(false);
    expect(afterShellInit.checks.find((check) => check.id === "android-sdk-root")?.ok).toBe(false);
  });

  it("moves iOS shell doctor from missing shell state to shell-ready once shell assets exist", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);

    const beforeBuild = inspectTargetShell("ios", {
      cwd: tempWorkspace,
      env: process.env
    });

    expect(beforeBuild.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "ios-shell-dir")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "ios-generated-manifest")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "ios-bootstrap-batch")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "ios-runtime-descriptor")?.ok).toBe(false);
    expect(beforeBuild.checks.find((check) => check.id === "ios-runtime-entry")?.ok).toBe(false);

    await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });

    const afterBuild = inspectTargetShell("ios", {
      cwd: tempWorkspace,
      env: process.env
    });

    expect(afterBuild.ok).toBe(false);
    expect(afterBuild.checks.find((check) => check.id === "ios-generated-manifest")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "ios-bootstrap-batch")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "ios-runtime-descriptor")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "ios-runtime-entry")?.ok).toBe(true);
    expect(afterBuild.checks.find((check) => check.id === "ios-shell-dir")?.ok).toBe(false);

    await initTargetShell("ios", {
      cwd: tempWorkspace,
      templateRoot: path.join(originalCwd, "packages", "renderer-ios", "ios")
    });

    const afterShellInit = inspectTargetShell("ios", {
      cwd: tempWorkspace,
      env: process.env
    });

    expect(afterShellInit.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-shell-dir")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-package-swift")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-generated-manifest")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-bootstrap-batch")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-runtime-descriptor")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-runtime-entry")?.ok).toBe(true);
    expect(afterShellInit.checks.find((check) => check.id === "ios-host-manifest")?.ok).toBe(true);
  });

  it("assembles the generated Android proof shell when the local toolchain is available", async ({ skip }) => {
    const tempWorkspace = await copyProofWorkspace();
    const templateRoot = path.join(originalCwd, "packages", "renderer-android", "android");

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });
    await initTargetShell("android", {
      cwd: tempWorkspace,
      templateRoot
    });

    const report = inspectTargetShell("android", {
      cwd: tempWorkspace,
      env: process.env
    });
    const blockingChecks = report.checks.filter((check) => !check.ok);
    const nonToolchainBlockers = blockingChecks.filter(
      (check) => check.id !== "android-java-home" && check.id !== "android-sdk-root"
    );

    expect(nonToolchainBlockers).toEqual([]);

    if (blockingChecks.length > 0) {
      skip(`Skipping Android shell assemble smoke: ${blockingChecks.map((check) => check.label).join(", ")}.`);
      return;
    }

    const javaHome = resolveJavaHome(process.env);
    const androidSdkRoot = resolveAndroidSdkRoot(process.env);
    expect(javaHome).toBeTruthy();
    expect(androidSdkRoot).toBeTruthy();

    const shellDir = path.join(tempWorkspace, "android");
    await runShellGradleAssemble(shellDir, {
      ...process.env,
      JAVA_HOME: javaHome!,
      ANDROID_HOME: androidSdkRoot!,
      ANDROID_SDK_ROOT: androidSdkRoot!
    });

    await expect(
      readFile(path.join(shellDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk"))
    ).resolves.toBeTruthy();
  }, 300000);

  it("materializes a universal workspace fixture that the CLI can build for web", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    const workspace = getWorkspaceConfig();

    expect(workspace.mode).toBe("universal");
    expect(workspace.targets.selected).toEqual(["web", "android", "ios"]);
    expect(path.relative(tempWorkspace, workspace.sourceRoot).replace(/\\/g, "/")).toBe("src/shared");

    const result = await runBuildCommand({ target: ["web"] }, {
      cwd: tempWorkspace,
      viteBuild
    });

    expect(result.targets).toEqual(["web"]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      target: "web",
      status: "built",
      detail: "Production web bundle written to dist."
    });

    const manifest = JSON.parse(
      await readFile(path.join(tempWorkspace, "dist", ".vite", "manifest.json"), "utf8")
    ) as Record<string, unknown>;

    expect(manifest).toBeTruthy();
    expect(Object.keys(manifest).length).toBeGreaterThan(0);
    await expect(readFile(path.join(tempWorkspace, "dist", "index.html"), "utf8")).resolves.toContain("<script");
  });

  it("materializes a universal workspace fixture that the CLI can build for android", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    const workspace = getWorkspaceConfig();

    expect(workspace.mode).toBe("universal");
    expect(workspace.targets.selected).toEqual(["web", "android", "ios"]);
    expect(path.relative(tempWorkspace, workspace.sourceRoot).replace(/\\/g, "/")).toBe("src/shared");

    const result = await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    expect(result.targets).toEqual(["android"]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      target: "android",
      status: "built"
    });
    expect(result.results[0]?.detail).toContain(".terajs/generated/android");
    expect(result.results[0]?.detail).toContain(".terajs/hosts/android");

    const generatedManifest = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "android", "terajs-target.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      moduleCount: number;
      routeCount: number;
      routesFile: string;
      sourceRoot: string;
      generatedDir: string;
      hostDir: string;
      hostManifestFile: string;
      modules: Array<{
        kind: string;
        filePath: string;
        outputPath: string;
        name: string;
        importedBindings: string[];
        exposedBindings: string[];
      }>;
    };

    expect(generatedManifest).toMatchObject({
      target: "android",
      renderer: "android-views",
      routesFile: "routes.json",
      sourceRoot: "src/shared",
      generatedDir: ".terajs/generated/android",
      hostDir: ".terajs/hosts/android",
      hostManifestFile: "../../hosts/android/terajs-host.json"
    });
    expect(generatedManifest.moduleCount).toBeGreaterThanOrEqual(3);
    expect(generatedManifest.routeCount).toBeGreaterThanOrEqual(1);
    expect(generatedManifest.modules).toEqual(expect.arrayContaining([
      {
        kind: "component",
        filePath: "/src/shared/components/ProofCallout.tera",
        outputPath: "modules/components/ProofCallout.json",
        name: "ProofCallout",
        importedBindings: [],
        exposedBindings: ["title", "body"]
      },
      {
        kind: "page",
        filePath: "/src/shared/pages/index.tera",
        outputPath: "modules/pages/index.json",
        name: "index",
        importedBindings: [],
        exposedBindings: []
      },
      {
        kind: "layout",
        filePath: "/src/shared/pages/layout.tera",
        outputPath: "modules/pages/layout.json",
        name: "layout",
        importedBindings: [],
        exposedBindings: []
      }
    ]));
    expect(generatedManifest.modules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "component",
        filePath: "/src/shared/components/ProofStateBoard.tera",
        outputPath: "modules/components/ProofStateBoard.json",
        name: "ProofStateBoard"
      })
    ]));

    const hostManifest = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "hosts", "android", "terajs-host.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      sourceRoot: string;
      generatedManifest: string;
      routesFile: string;
    };

    expect(hostManifest).toMatchObject({
      target: "android",
      renderer: "android-views",
      sourceRoot: "src/shared",
      generatedManifest: "../../generated/android/terajs-target.json",
      routesFile: "../../generated/android/routes.json"
    });

    const runtimeDescriptor = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json"), "utf8")
    ) as {
      kind: string;
      initialRoutePath: string;
      generatedManifestFile: string;
      routesFile: string;
      entryScriptFile?: string;
    };

    expect(runtimeDescriptor).toMatchObject({
      kind: "generated-route-runtime",
      initialRoutePath: "/",
      generatedManifestFile: "../terajs-target.json",
      routesFile: "../routes.json",
      entryScriptFile: "live-runtime-entry.js"
    });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"),
      "utf8"
    );

    expect(runtimeEntry).toContain("__terajsNativeRuntime");
    expect(runtimeEntry).toContain("emitCommandBatch");
    expect(runtimeEntry).toContain("start(host)");
    expect(runtimeEntry).not.toContain("async start");
    expect(runtimeEntry).not.toContain("Promise.resolve(host.readTextAsset");

    await expect(readFile(path.join(tempWorkspace, "dist", "index.html"), "utf8")).rejects.toMatchObject({
      code: "ENOENT"
    });
  });

  it("materializes a universal workspace fixture that the CLI can build for ios", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    const workspace = getWorkspaceConfig();

    expect(workspace.mode).toBe("universal");
    expect(workspace.targets.selected).toEqual(["web", "android", "ios"]);
    expect(path.relative(tempWorkspace, workspace.sourceRoot).replace(/\\/g, "/")).toBe("src/shared");

    const result = await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });

    expect(result.targets).toEqual(["ios"]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      target: "ios",
      status: "built"
    });
    expect(result.results[0]?.detail).toContain(".terajs/generated/ios");
    expect(result.results[0]?.detail).toContain(".terajs/hosts/ios");

    const generatedManifest = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "ios", "terajs-target.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      moduleCount: number;
      routeCount: number;
      routesFile: string;
      sourceRoot: string;
      generatedDir: string;
      hostDir: string;
      hostManifestFile: string;
      bootstrap?: {
        initialCommandBatchFile?: string;
      };
      runtime?: {
        descriptorFile: string;
        kind: string;
      };
      modules: Array<{
        kind: string;
        filePath: string;
        outputPath: string;
        name: string;
        importedBindings: string[];
        exposedBindings: string[];
      }>;
    };

    expect(generatedManifest).toMatchObject({
      target: "ios",
      renderer: "uikit-views",
      routesFile: "routes.json",
      sourceRoot: "src/shared",
      generatedDir: ".terajs/generated/ios",
      hostDir: ".terajs/hosts/ios",
      hostManifestFile: "../../hosts/ios/terajs-host.json",
      bootstrap: {
        initialCommandBatchFile: "bootstrap/root-command-batch.json"
      },
      runtime: {
        kind: "generated-route-runtime",
        descriptorFile: "runtime/generated-route-runtime.json"
      }
    });
    expect(generatedManifest.moduleCount).toBeGreaterThanOrEqual(3);
    expect(generatedManifest.routeCount).toBeGreaterThanOrEqual(1);
    expect(generatedManifest.modules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "component",
        filePath: "/src/shared/components/ProofStateBoard.tera",
        outputPath: "modules/components/ProofStateBoard.json",
        name: "ProofStateBoard"
      })
    ]));

    const hostManifest = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "hosts", "ios", "terajs-host.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      sourceRoot: string;
      generatedManifest: string;
      routesFile: string;
      bootstrap?: {
        initialCommandBatchFile?: string;
      };
      runtime?: {
        descriptorFile: string;
        kind: string;
      };
    };

    expect(hostManifest).toMatchObject({
      target: "ios",
      renderer: "uikit-views",
      sourceRoot: "src/shared",
      generatedManifest: "../../generated/ios/terajs-target.json",
      routesFile: "../../generated/ios/routes.json",
      bootstrap: {
        initialCommandBatchFile: "../../generated/ios/bootstrap/root-command-batch.json"
      },
      runtime: {
        kind: "generated-route-runtime",
        descriptorFile: "../../generated/ios/runtime/generated-route-runtime.json"
      }
    });

    const runtimeDescriptor = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "ios", "runtime", "generated-route-runtime.json"), "utf8")
    ) as {
      kind: string;
      initialRoutePath: string;
      generatedManifestFile: string;
      routesFile: string;
      entryScriptFile?: string;
    };

    expect(runtimeDescriptor).toMatchObject({
      kind: "generated-route-runtime",
      initialRoutePath: "/",
      generatedManifestFile: "../terajs-target.json",
      routesFile: "../routes.json",
      entryScriptFile: "live-runtime-entry.js"
    });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"),
      "utf8"
    );

    expect(runtimeEntry).toContain("__terajsNativeRuntime");
    expect(runtimeEntry).toContain("emitCommandBatch");

    const iosBootstrap = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"),
      "utf8"
    );

    expect(iosBootstrap).toContain("Terajs iOS shell ready");
    expect(iosBootstrap).toContain("Rendered from the generated iOS command batch.");

    await expect(readFile(path.join(tempWorkspace, "dist", "index.html"), "utf8")).rejects.toMatchObject({
      code: "ENOENT"
    });
  });
});