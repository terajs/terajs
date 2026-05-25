import { spawnSync } from "node:child_process";
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
  runtimeEntryPath: string;
  runtimeDescriptorPath: string;
  shellDir: string;
}

interface IOSShellPaths {
  bootstrapBatchPath: string;
  generatedManifestPath: string;
  hostManifestPath: string;
  packageManifestPath: string;
  runtimeEntryPath: string;
  runtimeDescriptorPath: string;
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
    hostManifestPath: join(root, ".terajs", "hosts", "android", "terajs-host.json"),
    runtimeEntryPath: join(root, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"),
    runtimeDescriptorPath: join(root, ".terajs", "generated", "android", "runtime", "generated-route-runtime.json")
  };
}

function resolveIOSShellPaths(root: string, destinationDir?: string): IOSShellPaths {
  const shellDir = destinationDir ? join(root, destinationDir) : join(root, "ios");

  return {
    shellDir,
    packageManifestPath: join(shellDir, "Package.swift"),
    generatedManifestPath: join(root, ".terajs", "generated", "ios", "terajs-target.json"),
    bootstrapBatchPath: join(root, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"),
    runtimeEntryPath: join(root, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"),
    runtimeDescriptorPath: join(root, ".terajs", "generated", "ios", "runtime", "generated-route-runtime.json"),
    hostManifestPath: join(root, ".terajs", "hosts", "ios", "terajs-host.json")
  };
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }

  return 0;
}

function inspectCommandVersion(options: {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  versionPattern: RegExp;
  minimumVersion: string;
  missingDetails: string;
}): { ok: boolean; details: string } {
  const result = spawnSync(options.command, options.args, {
    encoding: "utf8",
    env: options.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error || result.status !== 0) {
    return {
      ok: false,
      details: options.missingDetails
    };
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const version = output.match(options.versionPattern)?.[1];
  if (!version) {
    return {
      ok: false,
      details: `${options.command} responded but did not report a parseable version.`
    };
  }

  if (compareVersions(version, options.minimumVersion) < 0) {
    return {
      ok: false,
      details: `${options.command} ${version} is older than the required ${options.minimumVersion}.`
    };
  }

  return {
    ok: true,
    details: `${options.command} ${version}`
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
      "android-runtime-descriptor",
      "Android generated route runtime descriptor present",
      paths.runtimeDescriptorPath,
      paths.runtimeDescriptorPath,
      "Run tera build --target android to generate the live runtime descriptor assets."
    ),
    checkPath(
      "android-runtime-entry",
      "Android live runtime entry bundle present",
      paths.runtimeEntryPath,
      paths.runtimeEntryPath,
      "Run tera build --target android to generate the Android live runtime entry bundle."
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

function inspectIOSShell(root: string, options: InspectShellOptions = {}): DoctorReport {
  const env = options.env ?? process.env;
  const paths = resolveIOSShellPaths(root, options.destinationDir);
  const isMacHost = process.platform === "darwin";

  const checks: DoctorCheck[] = [
    checkPath(
      "ios-shell-dir",
      "iOS shell directory present",
      paths.shellDir,
      paths.shellDir,
      `Run tera shell init ios${options.destinationDir ? ` --dir ${options.destinationDir}` : ""} to materialize the iOS shell.`
    ),
    checkPath(
      "ios-package-swift",
      "iOS Swift package manifest present",
      paths.packageManifestPath,
      paths.packageManifestPath,
      `Missing Package.swift at ${paths.packageManifestPath}. Re-run tera shell init ios to restore the shell scaffold.`
    ),
    checkPath(
      "ios-generated-manifest",
      "iOS generated manifest present",
      paths.generatedManifestPath,
      paths.generatedManifestPath,
      "Run tera build --target ios to emit native build artifacts."
    ),
    checkPath(
      "ios-bootstrap-batch",
      "iOS bootstrap command batch present",
      paths.bootstrapBatchPath,
      paths.bootstrapBatchPath,
      "Run tera build --target ios to generate the bootstrap command batch."
    ),
    checkPath(
      "ios-runtime-descriptor",
      "iOS generated route runtime descriptor present",
      paths.runtimeDescriptorPath,
      paths.runtimeDescriptorPath,
      "Run tera build --target ios to generate the live runtime descriptor assets."
    ),
    checkPath(
      "ios-runtime-entry",
      "iOS live runtime entry bundle present",
      paths.runtimeEntryPath,
      paths.runtimeEntryPath,
      "Run tera build --target ios to generate the iOS live runtime entry bundle."
    ),
    checkPath(
      "ios-host-manifest",
      "iOS host manifest present",
      paths.hostManifestPath,
      paths.hostManifestPath,
      "Run tera build --target ios to refresh host metadata."
    ),
    {
      id: "ios-hosted-platform",
      label: "macOS host available for native iOS validation",
      ok: isMacHost,
      level: "warn",
      details: isMacHost
        ? "macOS host detected for native iOS validation."
        : "Hosted iOS validation requires macOS and Xcode. This machine can still scaffold and inspect iOS artifacts."
    }
  ];

  if (isMacHost) {
    const swift = inspectCommandVersion({
      command: "swift",
      args: ["--version"],
      env,
      versionPattern: /Swift version\s+([0-9]+(?:\.[0-9]+)+)/i,
      minimumVersion: "5.9",
      missingDetails: "Install Swift 5.9+ or Xcode 15+ command line tools to validate the iOS shell."
    });
    const xcode = inspectCommandVersion({
      command: "xcodebuild",
      args: ["-version"],
      env,
      versionPattern: /^Xcode\s+([0-9]+(?:\.[0-9]+)+)/m,
      minimumVersion: "15.0",
      missingDetails: "Install Xcode 15+ to build or run the iOS shell."
    });

    checks.push(
      {
        id: "ios-swift-toolchain",
        label: "Swift 5.9+ toolchain available",
        ok: swift.ok,
        level: "error",
        details: swift.details
      },
      {
        id: "ios-xcode",
        label: "Xcode 15+ available",
        ok: xcode.ok,
        level: "error",
        details: xcode.details
      }
    );
  } else {
    checks.push(
      {
        id: "ios-swift-toolchain",
        label: "Swift 5.9+ toolchain available",
        ok: false,
        level: "warn",
        details: "Swift toolchain validation is only available on macOS."
      },
      {
        id: "ios-xcode",
        label: "Xcode 15+ available",
        ok: false,
        level: "warn",
        details: "Xcode validation is only available on macOS."
      }
    );
  }

  return {
    root,
    checks,
    ok: checks.every((check) => check.ok || check.level !== "error")
  };
}

export function inspectTargetShell(target: ShellTarget, options: InspectShellOptions = {}): DoctorReport {
  const root = options.cwd ?? process.cwd();

  if (target === "android") {
    return inspectAndroidShell(root, options);
  }

  return inspectIOSShell(root, options);
}