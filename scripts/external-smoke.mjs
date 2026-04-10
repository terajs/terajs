#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");
const cliEntry = join(repoRoot, "packages", "cli", "dist", "index.js");
const appName = "terajs-smoke-app";
const npmExecPath = process.env.npm_execpath;

const skipBuild = process.argv.includes("--skip-build");
const keepArtifacts = process.argv.includes("--keep-artifacts");

function toPosixPath(value) {
  return value.split("\\").join("/");
}

function toFileSpecifier(fromDir, targetPath) {
  const rel = toPosixPath(relative(fromDir, targetPath));
  const normalized = rel.startsWith(".") ? rel : `./${rel}`;
  return `file:${normalized}`;
}

function runCommand(command, args, options = {}) {
  const { cwd = repoRoot, capture = false } = options;

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      shell: false
    });

    let stdout = "";
    let stderr = "";

    if (capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", (error) => {
      rejectPromise(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      const message = capture && stderr.trim().length > 0
        ? stderr.trim()
        : `Command exited with code ${code}`;
      rejectPromise(new Error(`${command} ${args.join(" ")} failed: ${message}`));
    });
  });
}

function runNpm(args, options = {}) {
  if (typeof npmExecPath === "string" && npmExecPath.length > 0) {
    return runCommand(process.execPath, [npmExecPath, ...args], options);
  }

  if (process.platform === "win32") {
    return runCommand("npm.cmd", args, options);
  }

  return runCommand("npm", args, options);
}

async function collectTerajsPackages() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const directory = join(packagesRoot, entry.name);
    const manifestPath = join(directory, "package.json");
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (typeof manifest.name === "string" && manifest.name.startsWith("@terajs/")) {
      packages.push({
        name: manifest.name,
        directory
      });
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

async function packTerajsPackages(packDirectory) {
  const packageEntries = await collectTerajsPackages();
  const tarballs = new Map();

  for (const pkg of packageEntries) {
    const { stdout } = await runNpm(
      ["pack", "--pack-destination", packDirectory, "--silent"],
      { cwd: pkg.directory, capture: true }
    );

    const filename = stdout
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .at(-1);

    if (!filename) {
      throw new Error(`Unable to determine tarball filename for ${pkg.name}`);
    }

    const tarballPath = join(packDirectory, filename);
    await stat(tarballPath);
    tarballs.set(pkg.name, tarballPath);
  }

  return tarballs;
}

async function rewriteScaffoldPackage(appRoot, tarballs) {
  const packagePath = join(appRoot, "package.json");
  const manifest = JSON.parse(await readFile(packagePath, "utf8"));

  const runtimeTarball = tarballs.get("@terajs/runtime");
  const rendererTarball = tarballs.get("@terajs/renderer-web");
  const pluginTarball = tarballs.get("@terajs/vite-plugin");

  if (!runtimeTarball || !rendererTarball || !pluginTarball) {
    throw new Error("Required tarballs for runtime, renderer-web, and vite-plugin are missing.");
  }

  manifest.dependencies = {
    ...(manifest.dependencies ?? {}),
    "@terajs/runtime": toFileSpecifier(appRoot, runtimeTarball),
    "@terajs/renderer-web": toFileSpecifier(appRoot, rendererTarball)
  };

  manifest.devDependencies = {
    ...(manifest.devDependencies ?? {}),
    "@terajs/vite-plugin": toFileSpecifier(appRoot, pluginTarball)
  };

  const existingOverrides = manifest.overrides && typeof manifest.overrides === "object"
    ? manifest.overrides
    : {};
  manifest.overrides = { ...existingOverrides };

  for (const [name, tarballPath] of tarballs.entries()) {
    manifest.overrides[name] = toFileSpecifier(appRoot, tarballPath);
  }

  await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("[external-smoke] Starting external developer smoke run...");

  if (!skipBuild) {
    console.log("[external-smoke] Building workspace packages...");
    await runNpm(["run", "build"], { cwd: repoRoot });
  }

  if (!existsSync(cliEntry)) {
    throw new Error("CLI build output is missing. Run npm run build before smoke testing.");
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "terajs-external-smoke-"));
  const tarballsRoot = join(tempRoot, "tarballs");
  const appRoot = join(tempRoot, appName);

  try {
    await mkdir(tarballsRoot, { recursive: true });

    console.log("[external-smoke] Packing @terajs packages...");
    const tarballs = await packTerajsPackages(tarballsRoot);

    console.log("[external-smoke] Scaffolding app with CLI...");
    await runCommand(process.execPath, [cliEntry, "init", appName], { cwd: tempRoot });

    console.log("[external-smoke] Rewriting scaffold dependencies to local tarballs...");
    await rewriteScaffoldPackage(appRoot, tarballs);

    console.log("[external-smoke] Installing scaffold dependencies...");
    await runNpm(["install", "--no-audit", "--no-fund", "--prefer-offline"], {
      cwd: appRoot
    });

    console.log("[external-smoke] Building scaffold app...");
    await runNpm(["run", "build"], { cwd: appRoot });

    const manifestCandidates = [
      join(appRoot, "dist", "manifest.json"),
      join(appRoot, "dist", ".vite", "manifest.json")
    ];
    const hasManifest = (await Promise.all(manifestCandidates.map((filePath) => fileExists(filePath))))
      .some((exists) => exists);

    if (!hasManifest) {
      throw new Error("Scaffold build did not emit a Vite manifest file.");
    }

    console.log("[external-smoke] Success: scaffold app built with local package tarballs.");

    if (keepArtifacts) {
      console.log(`[external-smoke] Artifacts kept at: ${tempRoot}`);
      return;
    }

    await rm(tempRoot, { recursive: true, force: true });
    console.log("[external-smoke] Cleaned temporary workspace.");
  } catch (error) {
    console.error("[external-smoke] Smoke run failed.");
    console.error(error);
    console.error(`[external-smoke] Temporary workspace kept at: ${tempRoot}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[external-smoke] Fatal error.");
  console.error(error);
  process.exitCode = 1;
});
