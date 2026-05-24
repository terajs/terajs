import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { DoctorCheck, DoctorReport } from "./doctor.js";
import type { ShellTarget } from "./shell.js";

export interface InspectShellOptions {
  cwd?: string;
  destinationDir?: string;
  env?: NodeJS.ProcessEnv;
}

interface AndroidShellPaths {
  bootstrapBatchPath: string;
  generatedManifestPath: string;
  gradleWrapperPath: string;
  hostManifestPath: string;
  shellDir: string;
}

function isDirectory(path: string | undefined): boolean {
  return typeof path === "string" && path.length > 0 && existsSync(path);
}

function hasBinary(root: string | undefined, binaryName: string): boolean {
  if (!isDirectory(root)) {
    return false;
  }

  const fileName = process.platform === "win32" ? `${binaryName}.exe` : binaryName;
  return existsSync(join(root, "bin", fileName));
}

function findMatchingJavaHome(root: string, matcher: (name: string) => boolean): string | null {
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

export function resolveJavaHome(env: NodeJS.ProcessEnv): string | null {
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

export function resolveAndroidSdkRoot(env: NodeJS.ProcessEnv): string | null {
  const directCandidates = [env.ANDROID_SDK_ROOT, env.ANDROID_HOME];
  for (const candidate of directCandidates) {
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

function checkPath(id: string, label: string, filePath: string, okDetails: string, failDetails: string): DoctorCheck {
  const ok = existsSync(filePath);
  return {
    id,
    label,
    ok,
    level: "error",
    details: ok ? okDetails : failDetails
  };
}

function resolveAndroidShellPaths(root: string, destinationDir?: string): AndroidShellPaths {
  const shellDir = destinationDir ? join(root, destinationDir) : join(root, "android");

  return {
    shellDir,
    gradleWrapperPath: join(shellDir, process.platform === "win32" ? "gradlew.bat" : "gradlew"),
    generatedManifestPath: join(root, ".terajs", "generated", "android", "terajs-target.json"),
    bootstrapBatchPath: join(root, ".terajs", "generated", "android", "bootstrap", "root-command-batch.json"),
    hostManifestPath: join(root, ".terajs", "hosts", "android", "terajs-host.json")
  };
}

function inspectAndroidShell(root: string, options: InspectShellOptions = {}): DoctorReport {
  const env = options.env ?? process.env;
  const paths = resolveAndroidShellPaths(root, options.destinationDir);
  const javaHome = resolveJavaHome(env);
  const androidSdkRoot = resolveAndroidSdkRoot(env);

  const checks: DoctorCheck[] = [
    checkPath(
      "android-shell-dir",
      "Android shell directory present",
      paths.shellDir,
      paths.shellDir,
      `Run tera shell init android${options.destinationDir ? ` --dir ${options.destinationDir}` : ""} to materialize the Android shell.`
    ),
    checkPath(
      "android-shell-wrapper",
      "Android Gradle wrapper present",
      paths.gradleWrapperPath,
      paths.gradleWrapperPath,
      `Missing Gradle wrapper at ${paths.gradleWrapperPath}. Re-run tera shell init android to restore the shell scaffold.`
    ),
    checkPath(
      "android-generated-manifest",
      "Android generated manifest present",
      paths.generatedManifestPath,
      paths.generatedManifestPath,
      "Run tera build --target android to emit native build artifacts."
    ),
    checkPath(
      "android-bootstrap-batch",
      "Android bootstrap command batch present",
      paths.bootstrapBatchPath,
      paths.bootstrapBatchPath,
      "Run tera build --target android to generate the route bootstrap command batch."
    ),
    checkPath(
      "android-host-manifest",
      "Android host manifest present",
      paths.hostManifestPath,
      paths.hostManifestPath,
      "Run tera build --target android to refresh host metadata."
    ),
    {
      id: "android-java-home",
      label: "Java 17+ runtime and compiler available",
      ok: javaHome !== null,
      level: "error",
      details: javaHome
        ? `JAVA_HOME resolves to ${javaHome}`
        : "Install JDK 17+ or Android Studio with its bundled JBR so the Android shell can run Gradle builds."
    },
    {
      id: "android-sdk-root",
      label: "Android SDK available",
      ok: androidSdkRoot !== null,
      level: "error",
      details: androidSdkRoot
        ? `Android SDK resolves to ${androidSdkRoot}`
        : "Install the Android SDK and expose it via ANDROID_SDK_ROOT, ANDROID_HOME, or the default local SDK path."
    }
  ];

  return {
    root,
    checks,
    ok: checks.every((check) => check.ok || check.level !== "error")
  };
}

export function inspectTargetShell(target: ShellTarget, options: InspectShellOptions = {}): DoctorReport {
  const root = options.cwd ?? process.cwd();

  if (target !== "android") {
    return {
      root,
      checks: [
        {
          id: `shell-${target}-unsupported`,
          label: `${target} shell doctor available`,
          ok: false,
          level: "error",
          details: `${target} shell doctor is not implemented yet. Android is the current supported shell doctor target.`
        }
      ],
      ok: false
    };
  }

  return inspectAndroidShell(root, options);
}