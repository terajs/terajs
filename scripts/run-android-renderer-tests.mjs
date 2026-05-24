import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  resolveAndroidSdkRoot,
  resolveJavaHome,
} from "../packages/cli/src/androidToolchain.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const androidModuleDir = join(repoRoot, "packages", "renderer-android", "android");

const gradleArgs = process.argv.slice(2);
if (gradleArgs.length === 0) {
  gradleArgs.push("testDebugUnitTest");
}

const env = { ...process.env };
const javaHome = resolveJavaHome(env);
if (javaHome) {
  env.JAVA_HOME = javaHome;
}

const androidSdkRoot = resolveAndroidSdkRoot(env);
if (!androidSdkRoot) {
  console.error("Missing Android SDK. Set ANDROID_SDK_ROOT or ANDROID_HOME before running Android unit tests.");
  process.exit(1);
}

env.ANDROID_SDK_ROOT = androidSdkRoot;
env.ANDROID_HOME = androidSdkRoot;

const wrapperPath = process.platform === "win32"
  ? join(androidModuleDir, "gradlew.bat")
  : join(androidModuleDir, "gradlew");

if (!existsSync(wrapperPath)) {
  console.error(`Missing Gradle wrapper at ${wrapperPath}.`);
  process.exit(1);
}

console.log(`Using Android SDK: ${androidSdkRoot}`);
if (env.JAVA_HOME) {
  console.log(`Using JAVA_HOME: ${env.JAVA_HOME}`);
}

const command = process.platform === "win32" ? "cmd.exe" : wrapperPath;
const commandArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", wrapperPath, ...gradleArgs]
  : gradleArgs;

const child = spawn(command, commandArgs, {
  cwd: androidModuleDir,
  env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});