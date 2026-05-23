import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const androidModuleDir = join(repoRoot, "packages", "renderer-android", "android");

function isDirectory(path) {
  return typeof path === "string" && path.length > 0 && existsSync(path);
}

function hasJavaBinary(javaHome) {
  if (!isDirectory(javaHome)) {
    return false;
  }

  const javaBinary = process.platform === "win32"
    ? join(javaHome, "bin", "java.exe")
    : join(javaHome, "bin", "java");
  return existsSync(javaBinary);
}

function findMatchingJavaHome(root, matcher) {
  if (!isDirectory(root)) {
    return null;
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (!matcher(entry.name)) {
      continue;
    }

    const candidate = join(root, entry.name);
    if (hasJavaBinary(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveJavaHome(env) {
  if (hasJavaBinary(env.JAVA_HOME)) {
    return env.JAVA_HOME;
  }

  if (process.platform === "win32") {
    const studioJbr = join(process.env.ProgramFiles ?? "C:\\Program Files", "Android", "Android Studio", "jbr");
    if (hasJavaBinary(studioJbr)) {
      return studioJbr;
    }

    const javaRoot = join(process.env.ProgramFiles ?? "C:\\Program Files", "Java");
    const directJdk = findMatchingJavaHome(javaRoot, (name) => /jdk-?17/i.test(name));
    if (directJdk) {
      return directJdk;
    }

    const adoptiumRoot = join(process.env.ProgramFiles ?? "C:\\Program Files", "Eclipse Adoptium");
    const adoptiumJdk = findMatchingJavaHome(adoptiumRoot, (name) => /jdk-?17|temurin-?17/i.test(name));
    if (adoptiumJdk) {
      return adoptiumJdk;
    }
  }

  return null;
}

function resolveAndroidSdkRoot(env) {
  const directCandidates = [
    env.ANDROID_SDK_ROOT,
    env.ANDROID_HOME,
  ];

  for (const candidate of directCandidates) {
    if (isDirectory(candidate)) {
      return candidate;
    }
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? join(process.env.USERPROFILE ?? "C:\\Users", "AppData", "Local");
    const defaultSdk = join(localAppData, "Android", "Sdk");
    if (isDirectory(defaultSdk)) {
      return defaultSdk;
    }
  }

  const home = env.HOME ?? env.USERPROFILE;
  if (home) {
    const unixCandidates = [
      join(home, "Library", "Android", "sdk"),
      join(home, "Android", "Sdk"),
    ];
    for (const candidate of unixCandidates) {
      if (isDirectory(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

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