import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { formatDoctorReport } from "../src/doctor.js";
import { inspectTargetShell } from "../src/shellDoctor.js";

describe("cli shell doctor", () => {
  it("passes when Android shell files, bootstrap assets, JDK, and SDK are present", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-cli-shell-doctor-ok-"));
    const fakeJavaHome = join(root, "fake-jdk");
    const fakeSdk = join(root, "fake-sdk");

    await mkdir(join(root, "android"), { recursive: true });
    await mkdir(join(root, ".terajs", "generated", "android", "bootstrap"), { recursive: true });
    await mkdir(join(root, ".terajs", "hosts", "android"), { recursive: true });
    await mkdir(join(fakeJavaHome, "bin"), { recursive: true });
    await mkdir(fakeSdk, { recursive: true });

    await Promise.all([
      writeFile(join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew"), "echo ok\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "terajs-target.json"), "{}\n", "utf8"),
      writeFile(join(root, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"), "[]\n", "utf8"),
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
});