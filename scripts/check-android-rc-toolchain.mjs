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
const wrapperPath = process.platform === "win32"
  ? join(androidModuleDir, "gradlew.bat")
  : join(androidModuleDir, "gradlew");

const env = { ...process.env };
const javaHome = resolveJavaHome(env);
const androidSdkRoot = resolveAndroidSdkRoot(env);

const checks = [
  {
    label: "JDK 17+ runtime and compiler",
    ok: javaHome !== null,
    details: javaHome ?? "Set JAVA_HOME to a JDK 17+ install, or install Android Studio with its bundled JBR.",
  },
  {
    label: "Android SDK",
    ok: androidSdkRoot !== null,
    details: androidSdkRoot ?? "Set ANDROID_SDK_ROOT or ANDROID_HOME to an installed Android SDK.",
  },
  {
    label: "Renderer Android Gradle wrapper",
    ok: existsSync(wrapperPath),
    details: wrapperPath,
  },
];

console.log("Terajs Android RC toolchain doctor");
console.log("");

for (const check of checks) {
  console.log(`[${check.ok ? "OK" : "FAIL"}] ${check.label}`);
  console.log(`  ${check.details}`);
}

console.log("");

if (checks.every((check) => check.ok)) {
  console.log("Android RC toolchain summary: ready to run npm run rc:native:android.");
  process.exit(0);
}

console.log("Android RC toolchain summary: fix FAIL items before running Gradle/Kotlin RC validation.");
process.exit(1);
