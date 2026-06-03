import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import os from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  resolveAndroidSdkRoot,
  resolveJavaHome,
} from "../packages/cli/src/androidToolchain.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const proofWorkspaceRoot = join(repoRoot, "packages", "shared", "test", "fixtures", "proof-workspace");
const androidTemplateRoot = join(repoRoot, "packages", "renderer-android", "android");
const cliBuildPath = join(repoRoot, "packages", "cli", "dist", "build.js");
const cliShellPath = join(repoRoot, "packages", "cli", "dist", "shell.js");

function assertBuiltCliAvailable() {
  if (!existsSync(cliBuildPath) || !existsSync(cliShellPath)) {
    console.error("Missing built CLI outputs. Run npm run build before Android proof shell assemble validation.");
    process.exit(1);
  }
}

function resolveAndroidEnv() {
  const env = { ...process.env };
  const javaHome = resolveJavaHome(env);
  const androidSdkRoot = resolveAndroidSdkRoot(env);

  if (javaHome) {
    env.JAVA_HOME = javaHome;
  }

  if (!androidSdkRoot) {
    console.error("Missing Android SDK. Set ANDROID_SDK_ROOT or ANDROID_HOME before running Android proof shell assemble validation.");
    process.exit(1);
  }

  env.ANDROID_SDK_ROOT = androidSdkRoot;
  env.ANDROID_HOME = androidSdkRoot;
  return { androidSdkRoot, env, javaHome };
}

async function copyProofWorkspace() {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "terajs-android-proof-shell-"));
  const tempWorkspace = join(tempRoot, "shared-workspace");

  await cp(proofWorkspaceRoot, tempWorkspace, { recursive: true });
  await symlink(
    join(repoRoot, "node_modules"),
    join(tempWorkspace, "node_modules"),
    process.platform === "win32" ? "junction" : "dir"
  );

  return { tempRoot, tempWorkspace };
}

async function runGradle(shellDir, env) {
  const wrapperPath = process.platform === "win32"
    ? join(shellDir, "gradlew.bat")
    : join(shellDir, "gradlew");

  if (!existsSync(wrapperPath)) {
    throw new Error(`Missing generated shell Gradle wrapper at ${wrapperPath}.`);
  }

  const command = process.platform === "win32" ? "cmd.exe" : wrapperPath;
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", wrapperPath, "--no-daemon", "assembleDebug"]
    : ["--no-daemon", "assembleDebug"];

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: shellDir,
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Android proof shell assemble terminated by signal ${signal}.`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`Android proof shell assemble failed with exit code ${code ?? -1}.`));
        return;
      }

      resolve();
    });
  });
}

assertBuiltCliAvailable();
const { androidSdkRoot, env, javaHome } = resolveAndroidEnv();
const { runBuildCommand } = await import("../packages/cli/dist/build.js");
const { initTargetShell } = await import("../packages/cli/dist/shell.js");

let tempRoot;

try {
  const copied = await copyProofWorkspace();
  tempRoot = copied.tempRoot;
  const tempWorkspace = copied.tempWorkspace;
  const originalCwd = process.cwd();

  console.log("Terajs Android proof shell assemble");
  console.log(`Using workspace: ${tempWorkspace}`);
  console.log(`Using Android SDK: ${androidSdkRoot}`);
  if (javaHome) {
    console.log(`Using JAVA_HOME: ${javaHome}`);
  }

  process.chdir(tempWorkspace);
  try {
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });
    await initTargetShell("android", {
      cwd: tempWorkspace,
      templateRoot: androidTemplateRoot,
    });
  } finally {
    process.chdir(originalCwd);
  }

  const shellDir = join(tempWorkspace, "android");
  await runGradle(shellDir, env);

  const apkPath = join(shellDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  if (!existsSync(apkPath)) {
    throw new Error(`Android proof shell assemble completed but no debug APK was found at ${apkPath}.`);
  }

  console.log(`Android proof shell debug APK: ${apkPath}`);
} finally {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
