import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
  appBuildPath: string;
  bootstrapBatchPath: string;
  generatedManifestPath: string;
  gradleWrapperPath: string;
  hostManifestPath: string;
  runtimeEntryPath: string;
  runtimeDescriptorPath: string;
  shellDir: string;
}

interface IOSShellPaths {
  appHostConfigPath: string;
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
    appBuildPath: join(shellDir, "app", "build.gradle.kts"),
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
    appHostConfigPath: join(shellDir, "TerajsAppHost.json"),
    packageManifestPath: join(shellDir, "Package.swift"),
    generatedManifestPath: join(root, ".terajs", "generated", "ios", "terajs-target.json"),
    bootstrapBatchPath: join(root, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"),
    runtimeEntryPath: join(root, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"),
    runtimeDescriptorPath: join(root, ".terajs", "generated", "ios", "runtime", "generated-route-runtime.json"),
    hostManifestPath: join(root, ".terajs", "hosts", "ios", "terajs-host.json")
  };
}

function readTextIfExists(filePath: string): string | null {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function parseGradleAssignment(text: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|([^\\s]+))`, "m"));
  return match?.[1] ?? match?.[2] ?? null;
}

function readAndroidReleaseProperties(shellDir: string): Record<string, string> {
  const gradleProperties = readTextIfExists(join(shellDir, "gradle.properties"));
  if (!gradleProperties) {
    return {};
  }

  const entries: Record<string, string> = {};
  for (const line of gradleProperties.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    entries[trimmed.slice(0, separatorIndex).trim()] = trimmed.slice(separatorIndex + 1).trim();
  }

  return entries;
}

function resolveReleaseInput(name: string, env: NodeJS.ProcessEnv, properties: Record<string, string>): string | null {
  const value = env[name] ?? properties[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readJsonIfExists(filePath: string): Record<string, unknown> | null {
  const text = readTextIfExists(filePath);
  if (!text) {
    return null;
  }

  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

export function inspectAndroidReleaseReadiness(options: InspectShellOptions = {}): DoctorReport {
  const root = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const baseReport = inspectAndroidShell(root, options);
  const paths = resolveAndroidShellPaths(root, options.destinationDir);
  const appBuild = readTextIfExists(paths.appBuildPath);
  const releaseProperties = readAndroidReleaseProperties(paths.shellDir);
  const releaseStoreFile = resolveReleaseInput("TERA_ANDROID_RELEASE_STORE_FILE", env, releaseProperties);
  const releaseStorePassword = resolveReleaseInput("TERA_ANDROID_RELEASE_STORE_PASSWORD", env, releaseProperties);
  const releaseKeyAlias = resolveReleaseInput("TERA_ANDROID_RELEASE_KEY_ALIAS", env, releaseProperties);
  const releaseKeyPassword = resolveReleaseInput("TERA_ANDROID_RELEASE_KEY_PASSWORD", env, releaseProperties);
  const versionCode = appBuild ? parseGradleAssignment(appBuild, "versionCode") : null;
  const versionName = appBuild ? parseGradleAssignment(appBuild, "versionName") : null;
  const applicationId = appBuild ? parseGradleAssignment(appBuild, "applicationId") : null;
  const hasSigningHooks = appBuild?.includes("TERA_ANDROID_RELEASE_STORE_FILE") === true
    && appBuild.includes("signingConfigs")
    && appBuild.includes("getByName(\"release\")");
  const hasSigningInputs = releaseStoreFile !== null
    && releaseStorePassword !== null
    && releaseKeyAlias !== null
    && releaseKeyPassword !== null
    && existsSync(releaseStoreFile);

  const releaseChecks: DoctorCheck[] = [
    checkPath(
      "android-release-app-build",
      "Android app build script present",
      paths.appBuildPath,
      paths.appBuildPath,
      "Run tera shell init android to materialize the Android application shell."
    ),
    {
      id: "android-release-application-id",
      label: "Android release application id configured",
      ok: applicationId !== null && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(applicationId),
      level: "error",
      details: applicationId
        ? `applicationId = ${applicationId}`
        : "Set android.defaultConfig.applicationId in android/app/build.gradle.kts."
    },
    {
      id: "android-release-version",
      label: "Android release version metadata configured",
      ok: versionCode !== null && versionCode !== "1" && versionName !== null && versionName !== "0.0.0",
      level: "error",
      details: versionCode !== null && versionName !== null
        ? `versionCode = ${versionCode}, versionName = ${versionName}`
        : "Set android.defaultConfig.versionCode and versionName in android/app/build.gradle.kts."
    },
    {
      id: "android-release-build-type",
      label: "Android release build type configured",
      ok: appBuild?.includes("getByName(\"release\")") === true || appBuild?.includes("release {") === true,
      level: "error",
      details: appBuild
        ? "Release build type is declared in android/app/build.gradle.kts."
        : "Run tera shell init android to create android/app/build.gradle.kts."
    },
    {
      id: "android-release-signing-hooks",
      label: "Android release signing hooks configured",
      ok: hasSigningHooks,
      level: "error",
      details: hasSigningHooks
        ? "Release signing can be supplied via TERA_ANDROID_RELEASE_* Gradle properties or environment variables."
        : "Configure release signing in android/app/build.gradle.kts using local Gradle properties or environment variables."
    },
    {
      id: "android-release-signing-inputs",
      label: "Android release signing inputs available",
      ok: hasSigningInputs,
      level: "error",
      details: hasSigningInputs
        ? `Release keystore resolves to ${releaseStoreFile}`
        : "Provide TERA_ANDROID_RELEASE_STORE_FILE, TERA_ANDROID_RELEASE_STORE_PASSWORD, TERA_ANDROID_RELEASE_KEY_ALIAS, and TERA_ANDROID_RELEASE_KEY_PASSWORD locally before assembleRelease."
    },
    {
      id: "android-release-asset-sync",
      label: "Android release assets sync generated Terajs output",
      ok: appBuild?.includes("syncTerajsShellAssets") === true
        && appBuild.includes(".terajs/generated/android")
        && appBuild.includes(".terajs/hosts/android"),
      level: "error",
      details: appBuild
        ? "Release builds depend on the same synced generated runtime and host assets as debug builds."
        : "Run tera shell init android to create android/app/build.gradle.kts."
    }
  ];
  const checks = [
    ...baseReport.checks,
    ...releaseChecks
  ];

  return {
    root,
    checks,
    ok: checks.every((check) => check.ok || check.level !== "error")
  };
}

export function inspectIOSReleaseReadiness(options: InspectShellOptions = {}): DoctorReport {
  const root = options.cwd ?? process.cwd();
  const baseReport = inspectIOSShell(root, options);
  const paths = resolveIOSShellPaths(root, options.destinationDir);
  const packageSwift = readTextIfExists(paths.packageManifestPath);
  const appHostConfig = readJsonIfExists(paths.appHostConfigPath);
  const bundleIdentifier = stringValue(appHostConfig?.bundleIdentifier);
  const minimumOSVersion = stringValue(appHostConfig?.minimumOSVersion);
  const packageProduct = stringValue(appHostConfig?.packageProduct);
  const generatedHostManifest = stringValue(appHostConfig?.generatedHostManifest);
  const generatedRuntimeDescriptor = stringValue(appHostConfig?.generatedRuntimeDescriptor);
  const generatedRuntimeEntry = stringValue(appHostConfig?.generatedRuntimeEntry);
  const bootstrapCommandBatch = stringValue(appHostConfig?.bootstrapCommandBatch);
  const hostSourceRoot = join(paths.shellDir, "Sources", "TerajsRendererHost");
  const requiredHostSources = [
    "TerajsCommandApplier.swift",
    "TerajsHostRuntime.swift",
    "TerajsHostRuntimeContract.swift",
    "TerajsHostTransport.swift",
    "TerajsWireTypes.swift"
  ];
  const missingHostSources = requiredHostSources.filter((fileName) => !existsSync(join(hostSourceRoot, fileName)));
  const isMacHost = process.platform === "darwin";

  const releaseChecks: DoctorCheck[] = [
    checkPath(
      "ios-release-app-host-config",
      "iOS app wrapper metadata present",
      paths.appHostConfigPath,
      paths.appHostConfigPath,
      "Run tera shell init ios to create TerajsAppHost.json for Xcode app-wrapper wiring."
    ),
    {
      id: "ios-release-bundle-id",
      label: "iOS bundle identifier configured",
      ok: bundleIdentifier !== null && /^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$/.test(bundleIdentifier),
      level: "error",
      details: bundleIdentifier
        ? `bundleIdentifier = ${bundleIdentifier}`
        : "Set bundleIdentifier in ios/TerajsAppHost.json before wiring an Xcode app wrapper."
    },
    {
      id: "ios-release-minimum-os",
      label: "iOS minimum OS version configured",
      ok: minimumOSVersion !== null && compareVersions(minimumOSVersion, "15.0") >= 0,
      level: "error",
      details: minimumOSVersion
        ? `minimumOSVersion = ${minimumOSVersion}`
        : "Set minimumOSVersion in ios/TerajsAppHost.json."
    },
    {
      id: "ios-release-package-product",
      label: "iOS host package product configured",
      ok: packageProduct === "TerajsRendererHost",
      level: "error",
      details: packageProduct
        ? `packageProduct = ${packageProduct}`
        : "Set packageProduct to TerajsRendererHost in ios/TerajsAppHost.json."
    },
    {
      id: "ios-release-package-platform",
      label: "iOS Swift package platform configured",
      ok: packageSwift?.includes(".iOS(.v15)") === true,
      level: "error",
      details: packageSwift
        ? "Package.swift declares .iOS(.v15)."
        : "Run tera shell init ios to create Package.swift."
    },
    {
      id: "ios-release-package-library",
      label: "iOS Swift package exposes host library",
      ok: packageSwift?.includes("name: \"TerajsRendererHost\"") === true
        && packageSwift.includes(".library(")
        && packageSwift.includes("targets: [\"TerajsRendererHost\"]"),
      level: "error",
      details: packageSwift
        ? "Package.swift exposes the TerajsRendererHost library target."
        : "Run tera shell init ios to create Package.swift."
    },
    {
      id: "ios-release-host-sources",
      label: "iOS host source files present",
      ok: missingHostSources.length === 0,
      level: "error",
      details: missingHostSources.length === 0
        ? "Required UIKit host source files are present."
        : `Missing iOS host source files: ${missingHostSources.join(", ")}.`
    },
    {
      id: "ios-release-asset-contract",
      label: "iOS app metadata points at generated Terajs assets",
      ok: generatedHostManifest === "../.terajs/hosts/ios/terajs-host.json"
        && generatedRuntimeDescriptor === "../.terajs/generated/ios/runtime/generated-route-runtime.json"
        && generatedRuntimeEntry === "../.terajs/generated/ios/runtime/live-runtime-entry.js"
        && bootstrapCommandBatch === "../.terajs/generated/ios/bootstrap/root-command-batch.json",
      level: "error",
      details: "TerajsAppHost.json should point at generated host manifest, runtime descriptor, runtime entry, and bootstrap command batch."
    },
    {
      id: "ios-release-platform-validation",
      label: "macOS host available for iOS release validation",
      ok: isMacHost,
      level: "warn",
      details: isMacHost
        ? "macOS host detected for Swift/Xcode release validation."
        : "This source-level check is complete, but Swift build, simulator, archive, and signing validation require macOS with Xcode."
    }
  ];
  const checks = [
    ...baseReport.checks,
    ...releaseChecks
  ];

  return {
    root,
    checks,
    ok: checks.every((check) => check.ok || check.level !== "error")
  };
}
