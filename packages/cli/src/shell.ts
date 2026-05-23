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
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONObject

class MainActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val status = runCatching { buildStatusMessage() }
      .getOrElse { error ->
        """
        Terajs Android shell

        Failed to read synced Terajs assets.
        ${"${"}error.message ?: error.javaClass.simpleName}

        Re-run tera build --target android and assemble again.
        """.trimIndent()
      }

    val content = TextView(this).apply {
      text = status
      typeface = Typeface.MONOSPACE
      textSize = 14f
      setPadding(48, 48, 48, 48)
    }

    setContentView(ScrollView(this).apply {
      addView(content)
    })
  }

  private fun buildStatusMessage(): String {
    val hostManifest = readAssetJson(".terajs/hosts/android/terajs-host.json")
    val targetManifest = readAssetJson(".terajs/generated/android/terajs-target.json")

    return """
      Terajs Android shell ready

      Target: ${"${"}hostManifest.optString("target")}
      Renderer: ${"${"}hostManifest.optString("renderer")}
      Bridge model: ${"${"}hostManifest.optString("bridgeModel")}
      Source root: ${"${"}hostManifest.optString("sourceRoot")}
      Route count: ${"${"}targetManifest.optInt("routeCount")}
      Module count: ${"${"}targetManifest.optInt("moduleCount")}

      This shell is synced from the universal workspace .terajs output.
      The next Android milestone is connecting the JS runtime and bridge loop for end-to-end rendering.
    """.trimIndent()
  }

  private fun readAssetJson(assetPath: String): JSONObject {
    val content = assets.open(assetPath).bufferedReader().use { reader ->
      reader.readText()
    }

    return JSONObject(content)
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
- the app can read the synced Terajs host and target manifests directly from the packaged assets

The next Android milestone is connecting the JS runtime and bridge loop so the shell can mount the compiled Terajs output end-to-end.
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

export async function initTargetShell(targetInput: string, options: InitTargetShellOptions = {}): Promise<InitializedTargetShell> {
  const target = normalizeShellTarget(targetInput);
  const cwd = path.resolve(options.cwd ?? process.cwd());

  if (target !== "android") {
    throw new Error(`Target shell scaffolding for ${target} is not implemented yet.`);
  }

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

    const templateRoot = await resolveAndroidTemplateRoot(options.templateRoot);
    await materializeAndroidShell(cwd, shellDir, templateRoot);

    return {
      target,
      shellDir,
      generatedManifestPath: path.join(cwd, workspace.targets.android.generatedDir, "terajs-target.json"),
      hostManifestPath: path.join(cwd, workspace.targets.android.hostDir, "terajs-host.json")
    };
  } finally {
    process.chdir(originalCwd);
  }
}