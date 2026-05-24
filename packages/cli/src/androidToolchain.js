import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * @param {string | undefined} path
 * @returns {boolean}
 */
function isDirectory(path) {
  return typeof path === "string" && path.length > 0 && existsSync(path);
}

/**
 * @param {string | undefined} root
 * @param {string} binaryName
 * @returns {boolean}
 */
function hasBinary(root, binaryName) {
  if (!isDirectory(root)) {
    return false;
  }

  const fileName = process.platform === "win32" ? `${binaryName}.exe` : binaryName;
  return existsSync(join(root, "bin", fileName));
}

/**
 * @param {string} root
 * @param {(name: string) => boolean} matcher
 * @returns {string | null}
 */
function findMatchingJavaHome(root, matcher) {
  if (!isDirectory(root)) {
    return null;
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !matcher(entry.name)) {
      continue;
    }

    const candidate = join(root, entry.name);
    if (hasBinary(candidate, "java") && hasBinary(candidate, "javac")) {
      return candidate;
    }
  }

  return null;
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {string | null}
 */
export function resolveJavaHome(env) {
  if (hasBinary(env.JAVA_HOME, "java") && hasBinary(env.JAVA_HOME, "javac")) {
    return env.JAVA_HOME ?? null;
  }

  if (process.platform === "win32") {
    const programFiles = env.ProgramFiles ?? "C:\\Program Files";
    const studioJbr = join(programFiles, "Android", "Android Studio", "jbr");
    if (hasBinary(studioJbr, "java") && hasBinary(studioJbr, "javac")) {
      return studioJbr;
    }

    const javaRoot = join(programFiles, "Java");
    const directJdk = findMatchingJavaHome(javaRoot, (name) => /jdk-?17/i.test(name));
    if (directJdk) {
      return directJdk;
    }

    const adoptiumRoot = join(programFiles, "Eclipse Adoptium");
    const adoptiumJdk = findMatchingJavaHome(adoptiumRoot, (name) => /jdk-?17|temurin-?17/i.test(name));
    if (adoptiumJdk) {
      return adoptiumJdk;
    }
  }

  return null;
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {string | null}
 */
export function resolveAndroidSdkRoot(env) {
  for (const candidate of [env.ANDROID_SDK_ROOT, env.ANDROID_HOME]) {
    if (isDirectory(candidate)) {
      return candidate ?? null;
    }
  }

  if (process.platform === "win32") {
    const localAppData = env.LOCALAPPDATA ?? join(env.USERPROFILE ?? "C:\\Users", "AppData", "Local");
    const defaultSdk = join(localAppData, "Android", "Sdk");
    if (isDirectory(defaultSdk)) {
      return defaultSdk;
    }
  }

  const home = env.HOME ?? env.USERPROFILE;
  if (home) {
    for (const candidate of [join(home, "Library", "Android", "sdk"), join(home, "Android", "Sdk")]) {
      if (isDirectory(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}