import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { formatDoctorReport } from "../src/doctor.js";
import { inspectAndroidReleaseReadiness, inspectTargetShell } from "../src/shellDoctor.js";

describe("cli shell doctor", () => {
  it("passes when Android shell files, runtime assets, JDK, and SDK are present", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-shell-doctor-ok-"));
    const fakeJavaHome = join(root, "fake-jdk");
    const fakeSdk = join(root, "fake-sdk");

    await mkdir(join(root, "android"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "bootstrap"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "runtime"), { recursive: true });
    await mkdir(join(root, ".terajs", "hosts", "android"), { recursive: true });
    await mkdir(join(fakeJavaHome, "bin"), { recursive: true });
    await mkdir(fakeSdk, { recursive: true });

    await Promise.all([
      writeFile(join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew"), "echo ok\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "terajs-target.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"), "[]\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"), "globalThis.__terajsNativeRuntime = {};\n", "utf8"),
      writeFile(join(root, ".terajs", "hosts", "android", "terajs-host.json"), "{}\n", "utf8"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "java.exe" : "java"), "", "utf8"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "javac.exe" : "javac"), "", "utf8")
    ]);

    const report = inspectTargetShell("android", {
      cwd: root,
      env: {
        ...process.env,
        JAVA_HOME: fakeJavaHome,
        ANDROID_SDK_ROOT: fakeSdk,
        ANDROID_HOME: fakeSdk
      }
    });

    expect(report.ok).toBe(true);
    expect(report.checks.every((check) => check.ok)).toBe(true);
    expect(report.checks.find((check) => check.id === "android-runtime-descriptor")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "android-runtime-entry")?.ok).toBe(true);

    const text = formatDoctorReport(report);
    expect(text).toContain("Doctor summary: setup is ready for development.");
  });

  it("fails when Android shell prerequisites and synced assets are missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-shell-doctor-fail-"));

    const report = inspectTargetShell("android", {
      cwd: root,
      env: {
        ProgramFiles: root,
        LOCALAPPDATA: root,
        USERPROFILE: root,
        HOME: root,
        JAVA_HOME: "",
        ANDROID_SDK_ROOT: "",
        ANDROID_HOME: ""
      }
    });

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === "android-shell-dir" && !check.ok)).toBe(true);
    expect(report.checks.some((check) => check.id === "android-java-home" && !check.ok)).toBe(true);
    expect(report.checks.some((check) => check.id === "android-sdk-root" && !check.ok)).toBe(true);
  });

  it("reports Android release blockers when debug shell readiness is not enough to deploy", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-release-doctor-blocked-"));
    const fakeJavaHome = join(root, "fake-jdk");
    const fakeSdk = join(root, "fake-sdk");

    await mkdir(join(root, "android", "app"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "bootstrap"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "runtime"), { recursive: true });
    await mkdir(join(root, ".terajs", "hosts", "android"), { recursive: true });
    await mkdir(join(fakeJavaHome, "bin"), { recursive: true });
    await mkdir(fakeSdk, { recursive: true });

    await Promise.all([
      writeFile(join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew"), "echo ok\n", "utf8"),
      writeFile(join(root, "android", "app", "build.gradle.kts"), `
android {
  defaultConfig {
    applicationId = "dev.terajs.apps.release.ready.android"
    versionCode = 1
    versionName = "0.0.0"
  }

  buildTypes {
    getByName("release") {}
  }
}

tasks.register("syncTerajsShellAssets") {
  doLast {
    println(".terajs/generated/android")
    println(".terajs/hosts/android")
  }
}
`, "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "terajs-target.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"), "[]\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"), "globalThis.__terajsNativeRuntime = {};\n", "utf8"),
      writeFile(join(root, ".terajs", "hosts", "android", "terajs-host.json"), "{}\n", "utf8"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "java.exe" : "java"), "", "utf8"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "javac.exe" : "javac"), "", "utf8")
    ]);

    const report = inspectAndroidReleaseReadiness({
      cwd: root,
      env: {
        ...process.env,
        JAVA_HOME: fakeJavaHome,
        ANDROID_HOME: fakeSdk,
        ANDROID_SDK_ROOT: fakeSdk
      }
    });

    expect(report.ok).toBe(false);
    expect(report.checks.find((check) => check.id === "android-java-home")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "android-release-version")?.ok).toBe(false);
    expect(report.checks.find((check) => check.id === "android-release-signing-inputs")?.ok).toBe(false);
    expect(report.checks.find((check) => check.id === "android-release-asset-sync")?.ok).toBe(true);
  });

  it("passes Android release readiness when version metadata and local signing inputs are configured", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-release-doctor-ok-"));
    const fakeJavaHome = join(root, "fake-jdk");
    const fakeSdk = join(root, "fake-sdk");
    const fakeKeystore = join(root, "release.keystore");

    await mkdir(join(root, "android", "app"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "bootstrap"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "runtime"), { recursive: true });
    await mkdir(join(root, ".terajs", "hosts", "android"), { recursive: true });
    await mkdir(join(fakeJavaHome, "bin"), { recursive: true });
    await mkdir(fakeSdk, { recursive: true });

    await Promise.all([
      writeFile(join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew"), "echo ok\n", "utf8"),
      writeFile(join(root, "android", "app", "build.gradle.kts"), `
val teraReleaseStoreFile = providers.environmentVariable("TERA_ANDROID_RELEASE_STORE_FILE")

android {
  signingConfigs {
    create("release") {}
  }

  defaultConfig {
    applicationId = "dev.terajs.apps.release.ready.android"
    versionCode = 7
    versionName = "1.2.3"
  }

  buildTypes {
    getByName("release") {}
  }
}

tasks.register("syncTerajsShellAssets") {
  doLast {
    println(".terajs/generated/android")
    println(".terajs/hosts/android")
  }
}
`, "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "terajs-target.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"), "[]\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"), "globalThis.__terajsNativeRuntime = {};\n", "utf8"),
      writeFile(join(root, ".terajs", "hosts", "android", "terajs-host.json"), "{}\n", "utf8"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "java.exe" : "java"), "", "utf8"),
      writeFile(join(fakeJavaHome, "bin", process.platform === "win32" ? "javac.exe" : "javac"), "", "utf8"),
      writeFile(fakeKeystore, "fake", "utf8")
    ]);

    const report = inspectAndroidReleaseReadiness({
      cwd: root,
      env: {
        ...process.env,
        JAVA_HOME: fakeJavaHome,
        ANDROID_HOME: fakeSdk,
        ANDROID_SDK_ROOT: fakeSdk,
        TERA_ANDROID_RELEASE_STORE_FILE: fakeKeystore,
        TERA_ANDROID_RELEASE_STORE_PASSWORD: "store-password",
        TERA_ANDROID_RELEASE_KEY_ALIAS: "release",
        TERA_ANDROID_RELEASE_KEY_PASSWORD: "key-password"
      }
    });

    expect(report.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "android-release-version")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "android-release-signing-hooks")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "android-release-signing-inputs")?.ok).toBe(true);
  });

  it("passes iOS shell checks when the scaffold and synced artifacts are present on a non-mac host", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-shell-doctor-ios-ok-"));

    await mkdir(join(root, "ios", "Sources", "TerajsRendererHost"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "ios", "bootstrap"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "ios", "runtime"), { recursive: true });
    await mkdir(join(root, ".terajs", "hosts", "ios"), { recursive: true });

    await Promise.all([
      writeFile(join(root, "ios", "Package.swift"), "// swift-tools-version: 5.9\n", "utf8"),
      writeFile(join(root, "ios", "Sources", "TerajsRendererHost", "TerajsHostRuntime.swift"), "struct Placeholder {}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "ios", "terajs-target.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"), "[]\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "ios", "runtime", "generated-route-runtime.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"), "globalThis.__terajsNativeRuntime = {};\n", "utf8"),
      writeFile(join(root, ".terajs", "hosts", "ios", "terajs-host.json"), "{}\n", "utf8")
    ]);

    const report = inspectTargetShell("ios", {
      cwd: root,
      env: process.env
    });

    expect(report.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-shell-dir")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-package-swift")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-generated-manifest")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-bootstrap-batch")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-runtime-descriptor")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-runtime-entry")?.ok).toBe(true);
    expect(report.checks.find((check) => check.id === "ios-host-manifest")?.ok).toBe(true);
  });
});
