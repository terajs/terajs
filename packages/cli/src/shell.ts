import { chmod, cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { getWorkspaceConfig } from "@terajs/app/vite";

import { runBuildCommand } from "./build.js";

export type ShellTarget = "android" | "ios";

export interface InitTargetShellOptions {
  cwd?: string;
  destinationDir?: string;
  templateRoot?: string;
}

export interface InitializedTargetShell {
  target: ShellTarget;
  shellDir: string;
  generatedManifestPath: string;
  hostManifestPath: string;
}

interface AndroidPluginVersions {
  androidGradlePlugin: string;
  kotlin: string;
}

function isShellTarget(value: string): value is ShellTarget {
  return value === "android" || value === "ios";
}

function formatRelativePath(fromPath: string, targetPath: string): string {
  const relative = path.relative(fromPath, targetPath);
  return relative.length > 0 ? relative.replace(/\\/g, "/") : ".";
}

function normalizeShellTarget(value: string): ShellTarget {
  const normalized = value.trim().toLowerCase();
  if (!isShellTarget(normalized)) {
    throw new Error(`Invalid shell target "${value}". Expected one of: android, ios.`);
  }

  return normalized;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readWorkspacePackageName(workspaceRoot: string): Promise<string> {
  const manifestPath = path.join(workspaceRoot, "package.json");

  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      name?: string;
    };

    if (typeof manifest.name === "string" && manifest.name.trim().length > 0) {
      return manifest.name.trim();
    }
  } catch {
    // Fall back to the workspace directory name below.
  }

  return path.basename(workspaceRoot);
}

function createAndroidNamespace(packageName: string): string {
  const segments = packageName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .split(".")
    .filter((segment) => segment.length > 0)
    .map((segment) => (/^[a-z]/.test(segment) ? segment : `app${segment}`));

  return ["dev", "terajs", "apps", ...(segments.length > 0 ? segments : ["shell"]), "android"].join(".");
}

function createDisplayName(packageName: string): string {
  return packageName
    .split(/[\W_]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Terajs";
}

async function readAndroidPluginVersions(templateRoot: string): Promise<AndroidPluginVersions> {
  const templateBuild = await readFile(path.join(templateRoot, "build.gradle.kts"), "utf8");
  const androidGradlePlugin = templateBuild.match(/com\.android\.library"\)\s+version\s+"([^"]+)"/)?.[1];
  const kotlin = templateBuild.match(/kotlin\("android"\)\s+version\s+"([^"]+)"/)?.[1];

  if (!androidGradlePlugin || !kotlin) {
    throw new Error("Unable to resolve Android shell plugin versions from the renderer-android template.");
  }

  return {
    androidGradlePlugin,
    kotlin
  };
}

async function resolveAndroidTemplateRoot(templateRoot?: string): Promise<string> {
  const resolved = templateRoot
    ? path.resolve(templateRoot)
    : path.join(path.dirname(createRequire(import.meta.url).resolve("@terajs/renderer-android/package.json")), "android");

  if (!await pathExists(path.join(resolved, "build.gradle.kts"))) {
    throw new Error(`Android shell template not found at ${resolved}.`);
  }

  return resolved;
}

async function resolveIOSTemplateRoot(templateRoot?: string): Promise<string> {
  const resolved = templateRoot
    ? path.resolve(templateRoot)
    : path.join(path.dirname(createRequire(import.meta.url).resolve("@terajs/renderer-ios/package.json")), "ios");

  if (!await pathExists(path.join(resolved, "Package.swift"))) {
    throw new Error(`iOS shell template not found at ${resolved}.`);
  }

  return resolved;
}

async function copyAndroidTemplateScaffold(templateRoot: string, androidRoot: string): Promise<void> {
  const hostModuleRoot = path.join(androidRoot, "terajs-host");
  await mkdir(hostModuleRoot, { recursive: true });

  await Promise.all([
    cp(path.join(templateRoot, "gradle"), path.join(androidRoot, "gradle"), { recursive: true }),
    cp(path.join(templateRoot, "gradlew"), path.join(androidRoot, "gradlew"), { recursive: true }),
    cp(path.join(templateRoot, "gradlew.bat"), path.join(androidRoot, "gradlew.bat"), { recursive: true }),
    cp(path.join(templateRoot, "gradle.properties"), path.join(androidRoot, "gradle.properties"), { recursive: true }),
    cp(path.join(templateRoot, "build.gradle.kts"), path.join(hostModuleRoot, "build.gradle.kts"), { recursive: true }),
    cp(path.join(templateRoot, "src"), path.join(hostModuleRoot, "src"), { recursive: true })
  ]);

  try {
    await chmod(path.join(androidRoot, "gradlew"), 0o755);
  } catch {
    // Windows can ignore executable mode updates.
  }
}

async function copyIOSTemplateScaffold(templateRoot: string, shellDir: string): Promise<void> {
  await mkdir(shellDir, { recursive: true });
  await Promise.all([
    cp(path.join(templateRoot, "Package.swift"), path.join(shellDir, "Package.swift")),
    cp(path.join(templateRoot, "Sources"), path.join(shellDir, "Sources"), { recursive: true })
  ]);
}

function createAndroidSettings(projectName: string): string {
  return `pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = ${JSON.stringify(`${projectName}-android-shell`)}

include(":app")
include(":terajs-host")
`;
}

function createAndroidRootBuild(): string {
  return `// Root build for the Terajs Android shell workspace.
`;
}

function createAndroidGitIgnore(): string {
  return `.gradle
build
app/build
terajs-host/build
local.properties
`;
}

function createIOSGitIgnore(): string {
  return `.build
.swiftpm
build
DerivedData
`;
}

function createAndroidAppBuild(namespace: string, versions: AndroidPluginVersions): string {
  return `plugins {
  id("com.android.application") version "${versions.androidGradlePlugin}"
  kotlin("android") version "${versions.kotlin}"
}

val workspaceRoot = rootProject.projectDir.parentFile
val shellAssetsDir = layout.buildDirectory.dir("generated/terajs-shell-assets")

val syncTerajsShellAssets by tasks.registering(Copy::class) {
  from(File(workspaceRoot, ".terajs/generated/android")) {
    into(".terajs/generated/android")
  }
  from(File(workspaceRoot, ".terajs/hosts/android")) {
    into(".terajs/hosts/android")
  }
  into(shellAssetsDir)

  doFirst {
    val generatedDir = File(workspaceRoot, ".terajs/generated/android")
    val hostDir = File(workspaceRoot, ".terajs/hosts/android")

    check(generatedDir.exists()) {
      "Missing Terajs Android generated artifacts at ${"${"}generatedDir.path}. Run tera build --target android first."
    }
    check(hostDir.exists()) {
      "Missing Terajs Android host metadata at ${"${"}hostDir.path}. Run tera build --target android first."
    }
  }
}

android {
  namespace = "${namespace}"
  compileSdk = 35

  defaultConfig {
    applicationId = "${namespace}"
    minSdk = 26
    targetSdk = 35
    versionCode = 1
    versionName = "0.0.0"
  }

  buildFeatures {
    buildConfig = false
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }

  sourceSets.named("main") {
    manifest.srcFile("src/main/AndroidManifest.xml")
    java.srcDirs("src/main/kotlin")
    assets.srcDir(shellAssetsDir)
  }
}

dependencies {
  implementation(project(":terajs-host"))
}

tasks.named("preBuild").configure {
  dependsOn(syncTerajsShellAssets)
}
`;
}

function createAndroidAppManifest(displayName: string): string {
  return `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application
    android:allowBackup="false"
    android:label="${displayName} Android Shell"
    android:supportsRtl="true"
    android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">
    <activity
      android:name=".MainActivity"
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
`;
}

function createAndroidMainActivity(namespace: string): string {
  return `package ${namespace}

import android.app.Activity
import android.graphics.Typeface
import android.os.Bundle
import android.view.View
import android.widget.ScrollView
import android.widget.TextView
import dev.terajs.renderer.android.AndroidRhinoRuntime
import dev.terajs.renderer.android.AndroidHostRuntime
import dev.terajs.renderer.android.AndroidRuntimeAssetReader
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val content = runCatching { createBootstrapView() }
      .getOrElse { error ->
        createStatusView(
          """
          Terajs Android shell

          Failed to read synced Terajs assets.
          ${"${"}error.message ?: error.javaClass.simpleName}

          Re-run tera build --target android and assemble again.
          """.trimIndent()
        )
      }

    setContentView(content)
  }

  private fun createBootstrapView(): View {
    val hostManifest = readAssetJson(".terajs/hosts/android/terajs-host.json")
    val runtimeDescriptorAssetPath = resolveRuntimeDescriptorAssetPath(hostManifest)
    val runtimeEntryAssetPath = resolveRuntimeEntryAssetPath(hostManifest)
    ensureLiveRuntimeAssets(hostManifest)
    val bootstrapAssetPath = resolveBootstrapAssetPath(hostManifest)
    val commandBatchPayload = readAssetText(bootstrapAssetPath)
    val liveRuntimeEntrySource = readAssetText(runtimeEntryAssetPath)

    val runtime = AndroidHostRuntime(
      context = this,
      runtimeDescriptorPath = runtimeDescriptorAssetPath,
      readTextAssetImpl = AndroidRuntimeAssetReader { assetPath ->
        readAssetText(assetPath)
      }
    )
    val liveRuntime = AndroidRhinoRuntime(runtime)
    val liveRuntimeError = runCatching {
      liveRuntime.start(liveRuntimeEntrySource)
    }.exceptionOrNull()

    if (runtime.rootView == null) {
      runtime.receiveCommandBatchPayload(commandBatchPayload)
    }

    val failureSummary = if (liveRuntimeError != null) {
      buildString {
        append("Live runtime failure: ")
        append(liveRuntimeError.message ?: liveRuntimeError.javaClass.simpleName)
        appendLine()
        appendLine()
      }
    } else {
      ""
    }
    val statusMessage = buildString {
      appendLine("Terajs Android shell")
      appendLine()
      append(failureSummary)
      appendLine("The live runtime and bootstrap fallback did not produce a root view.")
      append("Check ${"$"}runtimeEntryAssetPath, ${"$"}bootstrapAssetPath, and re-run tera build --target android.")
    }

    return runtime.rootView ?: createStatusView(statusMessage)
  }

  private fun ensureLiveRuntimeAssets(hostManifest: JSONObject) {
    val runtimeDescriptorAssetPath = resolveRuntimeDescriptorAssetPath(hostManifest)
    val runtimeDescriptor = readAssetJson(runtimeDescriptorAssetPath)
    val generatedManifestAssetPath = resolveAssetPath(
      runtimeDescriptorAssetPath,
      runtimeDescriptor.optString("generatedManifestFile").takeIf { it.isNotBlank() }
        ?: "../terajs-target.json"
    )
    val routesAssetPath = resolveAssetPath(
      runtimeDescriptorAssetPath,
      runtimeDescriptor.optString("routesFile").takeIf { it.isNotBlank() }
        ?: "../routes.json"
    )
    val runtimeEntryAssetPath = resolveRuntimeEntryAssetPath(hostManifest)

    readAssetJson(generatedManifestAssetPath)
    readAssetArray(routesAssetPath)
    readAssetText(runtimeEntryAssetPath)
  }

  private fun resolveRuntimeEntryAssetPath(hostManifest: JSONObject): String {
    val runtimeDescriptorAssetPath = resolveRuntimeDescriptorAssetPath(hostManifest)
    val runtimeDescriptor = readAssetJson(runtimeDescriptorAssetPath)
    val relativePath = runtimeDescriptor.optString("entryScriptFile")
      .takeIf { it.isNotBlank() }
      ?: "live-runtime-entry.js"

    return resolveAssetPath(runtimeDescriptorAssetPath, relativePath)
  }

  private fun resolveBootstrapAssetPath(hostManifest: JSONObject): String {
    val relativePath = hostManifest.optJSONObject("bootstrap")
      ?.optString("initialCommandBatchFile")
      ?.takeIf { it.isNotBlank() }
      ?: "../../generated/android/bootstrap/root-command-batch.json"

    return resolveAssetPath(".terajs/hosts/android/terajs-host.json", relativePath)
  }

  private fun resolveRuntimeDescriptorAssetPath(hostManifest: JSONObject): String {
    val relativePath = hostManifest.optJSONObject("runtime")
      ?.optString("descriptorFile")
      ?.takeIf { it.isNotBlank() }
      ?: "../../generated/android/runtime/generated-route-runtime.json"

    return resolveAssetPath(".terajs/hosts/android/terajs-host.json", relativePath)
  }

  private fun resolveAssetPath(baseAssetPath: String, relativePath: String): String {
    val baseSegments = baseAssetPath.split('/').dropLast(1).toMutableList()

    for (segment in relativePath.split('/')) {
      when (segment) {
        "", "." -> Unit
        ".." -> if (baseSegments.isNotEmpty()) {
          baseSegments.removeAt(baseSegments.lastIndex)
        }
        else -> baseSegments.add(segment)
      }
    }

    return baseSegments.joinToString("/")
  }

  private fun createStatusView(message: String): View {
    val content = TextView(this).apply {
      text = message
      typeface = Typeface.MONOSPACE
      textSize = 14f
      setPadding(48, 48, 48, 48)
    }

    return ScrollView(this).apply {
      addView(content)
    }
  }

  private fun readAssetText(assetPath: String): String {
    return assets.open(assetPath).bufferedReader().use { reader ->
      reader.readText()
    }
  }

  private fun readAssetJson(assetPath: String): JSONObject {
    return JSONObject(readAssetText(assetPath))
  }

  private fun readAssetArray(assetPath: String): JSONArray {
    return JSONArray(readAssetText(assetPath))
  }
}
`;
}

function createAndroidShellReadme(displayName: string): string {
  return `# ${displayName} Android Shell

This Android workspace shell was materialized by \`tera shell init android\`.

## Workflow

1. Refresh generated artifacts from the universal workspace:

   \`tera build --target android\`

2. Build the Android shell:

   \`./gradlew assembleDebug\`

3. Install it on a connected device or emulator:

   \`./gradlew installDebug\`

## What this shell proves now

- a real Android Gradle project exists under \`android/\`
- the shell syncs \`.terajs/generated/android\` and \`.terajs/hosts/android\` into app assets at build time
- the app can read the synced Terajs host metadata directly from the packaged assets
- the app can resolve the generated route runtime descriptor plus the generated manifest, routes, and live runtime entry bundle it points at
- the app can render a real native bootstrap tree from \`.terajs/generated/android/bootstrap/root-command-batch.json\`

The next Android milestone is embedding a JS engine that executes the generated live runtime entry and closes the bridge loop end-to-end.
`;
}

function createIOSShellReadme(displayName: string): string {
  return `# ${displayName} iOS Shell

This iOS workspace shell was materialized by \`tera shell init ios\`.

## Workflow

1. Refresh generated artifacts from the universal workspace:

  \`tera build --target ios\`

2. On macOS, validate the packaged UIKit host surface:

  \`swift build\`

3. Open \`Package.swift\` in Xcode when you are ready to wire a real iOS app wrapper around the host package.

## What this shell proves now

- a real Swift package host exists under \`ios/\`
- the universal workspace emits \`.terajs/generated/ios\` and \`.terajs/hosts/ios\` artifacts, including a bootstrap command batch, generated route runtime descriptor, and live runtime entry bundle
- the CLI can materialize a concrete iOS host package instead of stopping at an unimplemented shell stub

Hosted iOS compilation and simulator or device validation still require macOS with Xcode.
`;
}

async function materializeAndroidShell(cwd: string, shellDir: string, templateRoot: string): Promise<void> {
  const packageName = await readWorkspacePackageName(cwd);
  const displayName = createDisplayName(packageName);
  const namespace = createAndroidNamespace(packageName);
  const versions = await readAndroidPluginVersions(templateRoot);
  const appRoot = path.join(shellDir, "app");
  const appSourceRoot = path.join(appRoot, "src", "main");
  const kotlinRoot = path.join(appSourceRoot, "kotlin", ...namespace.split("."));

  await copyAndroidTemplateScaffold(templateRoot, shellDir);
  await mkdir(kotlinRoot, { recursive: true });

  await Promise.all([
    writeFile(path.join(shellDir, "settings.gradle.kts"), createAndroidSettings(packageName), "utf8"),
    writeFile(path.join(shellDir, "build.gradle.kts"), createAndroidRootBuild(), "utf8"),
    writeFile(path.join(shellDir, ".gitignore"), createAndroidGitIgnore(), "utf8"),
    writeFile(path.join(shellDir, "README.md"), createAndroidShellReadme(displayName), "utf8"),
    writeFile(path.join(appRoot, "build.gradle.kts"), createAndroidAppBuild(namespace, versions), "utf8"),
    writeFile(path.join(appSourceRoot, "AndroidManifest.xml"), createAndroidAppManifest(displayName), "utf8"),
    writeFile(path.join(kotlinRoot, "MainActivity.kt"), createAndroidMainActivity(namespace), "utf8")
  ]);
}

async function materializeIOSShell(cwd: string, shellDir: string, templateRoot: string): Promise<void> {
  const packageName = await readWorkspacePackageName(cwd);
  const displayName = createDisplayName(packageName);

  await copyIOSTemplateScaffold(templateRoot, shellDir);
  await Promise.all([
    writeFile(path.join(shellDir, ".gitignore"), createIOSGitIgnore(), "utf8"),
    writeFile(path.join(shellDir, "README.md"), createIOSShellReadme(displayName), "utf8")
  ]);
}

export async function initTargetShell(targetInput: string, options: InitTargetShellOptions = {}): Promise<InitializedTargetShell> {
  const target = normalizeShellTarget(targetInput);
  const cwd = path.resolve(options.cwd ?? process.cwd());

  const shellDir = path.join(cwd, options.destinationDir ?? target);
  if (await pathExists(shellDir)) {
    throw new Error(`Target shell directory already exists at ${formatRelativePath(cwd, shellDir)}.`);
  }

  const originalCwd = process.cwd();
  process.chdir(cwd);

  try {
    const workspace = getWorkspaceConfig();

    if (workspace.mode !== "universal") {
      throw new Error("Target shell scaffolding requires a universal workspace.");
    }

    if (!workspace.targets.selected.includes(target)) {
      throw new Error(`Target shell ${target} is not enabled in workspace.targets.selected.`);
    }

    await runBuildCommand(
      { target: [target] },
      {
        cwd,
        getWorkspaceConfig: () => workspace
      }
    );

    if (target === "android") {
      const templateRoot = await resolveAndroidTemplateRoot(options.templateRoot);
      await materializeAndroidShell(cwd, shellDir, templateRoot);
    } else {
      const templateRoot = await resolveIOSTemplateRoot(options.templateRoot);
      await materializeIOSShell(cwd, shellDir, templateRoot);
    }

    const targetConfig = target === "android"
      ? workspace.targets.android
      : workspace.targets.ios;

    return {
      target,
      shellDir,
      generatedManifestPath: path.join(cwd, targetConfig.generatedDir, "terajs-target.json"),
      hostManifestPath: path.join(cwd, targetConfig.hostDir, "terajs-host.json")
    };
  } finally {
    process.chdir(originalCwd);
  }
}