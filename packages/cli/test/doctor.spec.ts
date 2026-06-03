import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatDoctorReport, inspectTerajsProject } from "../src/doctor";
import { inspectUniversalWorkspace } from "../src/universalDoctor.js";

describe("cli doctor", () => {
  it("passes scaffold-like projects", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-doctor-ok-"));
    await mkdir(join(root, "src", "routes"), { recursive: true });

    await writeFile(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "doctor-ok",
          private: true,
          dependencies: {
            "@terajs/app": "*"
          },
          devDependencies: {
            "vite": "*"
          },
          scripts: {
            dev: "vite",
            build: "vite build"
          }
        },
        null,
        2
      )
    );

    await writeFile(join(root, "vite.config.ts"), "export default {};\n");
    await writeFile(join(root, "terajs.config.cjs"), "module.exports = {};\n");
    await writeFile(join(root, "src", "routes", "index.tera"), "<template><div/></template>\n");

    const report = await inspectTerajsProject(root);

    expect(report.ok).toBe(true);
    expect(report.checks.every((check) => check.ok)).toBe(true);
    expect(report.checks.some((check) => check.id === "dep:app-facade" && check.ok)).toBe(true);

    const text = formatDoctorReport(report);
    expect(text).toContain("Doctor summary: setup is ready for development.");
  });

  it("fails when required setup is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-doctor-fail-"));

    await writeFile(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "doctor-fail",
          private: true,
          dependencies: {},
          devDependencies: {},
          scripts: {}
        },
        null,
        2
      )
    );

    const report = await inspectTerajsProject(root);

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === "dep:@terajs/runtime" && check.ok === false)).toBe(true);
    expect(report.checks.some((check) => check.id === "vite-config" && check.ok === false)).toBe(true);

    const text = formatDoctorReport(report);
    expect(text).toContain("Doctor summary: fix FAIL items before continuing.");
  });

  it("passes a materialized universal workspace readiness check on a non-mac host", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-universal-doctor-ok-"));
    const fakeJavaHome = join(root, "fake-jdk");
    const fakeSdk = join(root, "fake-sdk");

    await Promise.all([
      mkdir(join(root, "src", "shared", "pages"), { recursive: true }),
      mkdir(join(root, "android"), { recursive: true }),
      mkdir(join(root, "ios", "Sources", "TerajsRendererHost"), { recursive: true }),
      mkdir(join(root, ".terajs", "generated", "android", "bootstrap"), { recursive: true }),
      mkdir(join(root, ".terajs", "generated", "android", "runtime"), { recursive: true }),
      mkdir(join(root, ".terajs", "generated", "ios", "bootstrap"), { recursive: true }),
      mkdir(join(root, ".terajs", "generated", "ios", "runtime"), { recursive: true }),
      mkdir(join(root, ".terajs", "hosts", "android"), { recursive: true }),
      mkdir(join(root, ".terajs", "hosts", "ios"), { recursive: true }),
      mkdir(join(fakeJavaHome, "bin"), { recursive: true }),
      mkdir(fakeSdk, { recursive: true }),
    ]);

    await Promise.all([
      writeFile(join(root, "package.json"), JSON.stringify({
        name: "universal-doctor-ok",
        private: true,
        dependencies: { "@terajs/app": "*" },
        devDependencies: { vite: "*" },
        scripts: { dev: "vite", build: "tera build" }
      }, null, 2)),
      writeFile(join(root, "vite.config.ts"), "export default {};\n"),
      writeFile(join(root, "terajs.config.cjs"), "module.exports = {};\n"),
      writeFile(join(root, "src", "shared", "pages", "index.tera"), "<template><main/></template>\n"),
      writeFile(join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew"), "echo ok\n"),
      writeFile(join(root, "ios", "Package.swift"), "// swift-tools-version: 5.9\n"),
      writeFile(join(root, ".terajs", "generated", "android", "terajs-target.json"), "{}\n"),
      writeFile(join(root, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"), "[]\n"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json"), "{}\n"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"), "globalThis.__terajsNativeRuntime = {};\n"),
      writeFile(join(root, ".terajs", "hosts", "android", "terajs-host.json"), "{}\n"),
      writeFile(join(root, ".terajs", "generated", "ios", "terajs-target.json"), "{}\n"),
      writeFile(join(root, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"), "[]\n"),
      writeFile(join(root, ".terajs", "generated", "ios", "runtime", "generated-route-runtime.json"), "{}\n"),
      writeFile(join(root, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"), "globalThis.__terajsNativeRuntime = {};\n"),
      writeFile(join(root, ".terajs", "hosts", "ios", "terajs-host.json"), "{}\n"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "java.exe" : "java"), ""),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "javac.exe" : "javac"), ""),
    ]);

    const report = await inspectUniversalWorkspace({
      cwd: root,
      env: {
        ...process.env,
        JAVA_HOME: fakeJavaHome,
        ANDROID_HOME: fakeSdk,
        ANDROID_SDK_ROOT: fakeSdk,
      },
      getWorkspaceConfig: () => ({
        mode: "universal",
        sourceRoot: join(root, "src", "shared"),
        targets: {
          selected: ["web", "android", "ios"],
          web: { outputDir: join(root, "dist") },
          android: {
            generatedDir: join(root, ".terajs", "generated", "android"),
            hostDir: join(root, ".terajs", "hosts", "android"),
          },
          ios: {
            generatedDir: join(root, ".terajs", "generated", "ios"),
            hostDir: join(root, ".terajs", "hosts", "ios"),
          },
        },
      }),
    });

    expect(report.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-mode")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-source-root")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-android-runtime-entry")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-ios-runtime-entry")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-ios-hosted-platform")?.level).toBe("warn");
  });

  it("fails universal readiness when selected native artifacts are missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-universal-doctor-fail-"));

    await mkdir(join(root, "src", "shared"), { recursive: true });
    await writeFile(join(root, "package.json"), JSON.stringify({
      name: "universal-doctor-fail",
      private: true,
      dependencies: { "@terajs/app": "*" },
      devDependencies: { vite: "*" },
      scripts: { dev: "vite", build: "tera build" }
    }, null, 2));
    await writeFile(join(root, "vite.config.ts"), "export default {};\n");

    const report = await inspectUniversalWorkspace({
      cwd: root,
      env: {
        ProgramFiles: root,
        LOCALAPPDATA: root,
        USERPROFILE: root,
        HOME: root,
        JAVA_HOME: "",
        ANDROID_HOME: "",
        ANDROID_SDK_ROOT: "",
      },
      getWorkspaceConfig: () => ({
        mode: "universal",
        sourceRoot: join(root, "src", "shared"),
        targets: {
          selected: ["web", "android", "ios"],
          web: { outputDir: join(root, "dist") },
          android: {
            generatedDir: join(root, ".terajs", "generated", "android"),
            hostDir: join(root, ".terajs", "hosts", "android"),
          },
          ios: {
            generatedDir: join(root, ".terajs", "generated", "ios"),
            hostDir: join(root, ".terajs", "hosts", "ios"),
          },
        },
      }),
    });

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === "universal-android-generated-manifest" && !check.ok)).toBe(true);
    expect(report.checks.some((check) => check.id === "universal-ios-generated-manifest" && !check.ok)).toBe(true);
  });

  it("loads universal workspace config from the requested cwd", async () => {
    const originalCwd = process.cwd();
    const outsideRoot = await mkdtemp(join(tmpdir(), "terajs-cli-universal-doctor-outside-"));
    const root = join(outsideRoot, "workspace");

    await mkdir(join(root, "src", "shared", "pages"), { recursive: true });
    await mkdir(join(root, "src", "shared", "components"), { recursive: true });
    await writeFile(join(root, "package.json"), JSON.stringify({
      name: "universal-doctor-cwd",
      private: true,
      dependencies: { "@terajs/app": "*" },
      devDependencies: { vite: "*" },
      scripts: { dev: "vite", build: "tera build" }
    }, null, 2));
    await writeFile(join(root, "vite.config.ts"), "export default {};\n");
    await writeFile(join(root, "src", "shared", "pages", "index.tera"), "<template><main/></template>\n");
    await writeFile(join(root, "terajs.config.cjs"), `
module.exports = {
  workspace: {
    mode: "universal",
    sourceRoot: "src/shared",
    targets: {
      selected: ["web"],
      web: { outputDir: "dist" }
    }
  },
  autoImportDirs: ["src/shared/components"],
  routeDirs: ["src/shared/pages"]
};
`);

    process.chdir(originalCwd);
    const report = await inspectUniversalWorkspace({
      cwd: root,
      env: process.env
    });

    expect(process.cwd()).toBe(originalCwd);
    expect(report.root).toBe(root);
    expect(report.checks.find((check) => check.id === "universal-mode")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-source-root")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "universal-target:web")?.ok).toBe(true);
  });
});
