import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolveAndroidSdkRoot, resolveJavaHome } from "../src/androidToolchain.js";

describe("android toolchain resolution", () => {
  it("requires both java and javac in JAVA_HOME", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-android-toolchain-java-home-"));
    const javaHome = join(root, "fake-jdk");
    const binDir = join(javaHome, "bin");
    const javaBinary = process.platform === "win32" ? "java.exe" : "java";
    const javacBinary = process.platform === "win32" ? "javac.exe" : "javac";
    const env = {
      JAVA_HOME: javaHome,
      ProgramFiles: join(root, "missing-program-files"),
      LOCALAPPDATA: join(root, "missing-local-app-data"),
      USERPROFILE: join(root, "missing-user-profile"),
      HOME: join(root, "missing-home"),
      ANDROID_SDK_ROOT: "",
      ANDROID_HOME: "",
    };

    await mkdir(binDir, { recursive: true });
    await writeFile(join(binDir, javaBinary), "", "utf8");

    expect(resolveJavaHome(env)).toBeNull();

    await writeFile(join(binDir, javacBinary), "", "utf8");

    expect(resolveJavaHome(env)).toBe(javaHome);
  });

  const windowsOnly = process.platform === "win32" ? it : it.skip;

  windowsOnly("uses the provided Windows fallback env instead of process.env", async () => {
    const root = await mkdtemp(join(tmpdir(), "terajs-android-toolchain-win-fallback-"));
    const programFiles = join(root, "Program Files");
    const localAppData = join(root, "AppData", "Local");
    const fakeJbr = join(programFiles, "Android", "Android Studio", "jbr");
    const fakeSdk = join(localAppData, "Android", "Sdk");

    await mkdir(join(fakeJbr, "bin"), { recursive: true });
    await mkdir(fakeSdk, { recursive: true });
    await Promise.all([
      writeFile(join(fakeJbr, "bin", "java.exe"), "", "utf8"),
      writeFile(join(fakeJbr, "bin", "javac.exe"), "", "utf8"),
    ]);

    const env = {
      ProgramFiles: programFiles,
      LOCALAPPDATA: localAppData,
      USERPROFILE: root,
      HOME: root,
      JAVA_HOME: "",
      ANDROID_SDK_ROOT: "",
      ANDROID_HOME: "",
    };

    expect(resolveJavaHome(env)).toBe(fakeJbr);
    expect(resolveAndroidSdkRoot(env)).toBe(fakeSdk);
  });
});