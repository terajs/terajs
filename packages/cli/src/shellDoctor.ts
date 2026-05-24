import { existsSync } from "node:fs";
import { join } from "node:path";

import type { DoctorCheck, DoctorReport } from "./doctor.js";
import type { ShellTarget } from "./shell.js";
import {
  resolveAndroidSdkRoot as resolveSharedAndroidSdkRoot,
  resolveJavaHome as resolveSharedJavaHome,
} from "./androidToolchain.js";

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

export function resolveJavaHome(env: NodeJS.ProcessEnv): string | null {
  return resolveSharedJavaHome(env);
}

export function resolveAndroidSdkRoot(env: NodeJS.ProcessEnv): string | null {
  return resolveSharedAndroidSdkRoot(env);
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