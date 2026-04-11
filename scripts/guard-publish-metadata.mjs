#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");

function hasLicense(manifest) {
  return typeof manifest.license === "string" && manifest.license.trim().length > 0;
}

function hasRepository(manifest) {
  if (typeof manifest.repository === "string") {
    return manifest.repository.trim().length > 0;
  }

  if (manifest.repository && typeof manifest.repository === "object") {
    return typeof manifest.repository.url === "string" && manifest.repository.url.trim().length > 0;
  }

  return false;
}

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function main() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const issues = [];
  let checkedCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDir = join(packagesRoot, entry.name);
    const packageJsonPath = join(packageDir, "package.json");
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const manifest = await readJson(packageJsonPath);
    if (manifest.private === true) {
      continue;
    }

    const pkgName = typeof manifest.name === "string" ? manifest.name : entry.name;
    checkedCount += 1;

    if (!hasLicense(manifest)) {
      issues.push(`${pkgName}: missing license field`);
    }

    if (!hasRepository(manifest)) {
      issues.push(`${pkgName}: missing repository field`);
    }
  }

  if (issues.length > 0) {
    console.error(`[guard:publish-metadata] FAILED (${checkedCount} packages checked)`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[guard:publish-metadata] OK (${checkedCount} packages checked)`);
}

main().catch((error) => {
  console.error("[guard:publish-metadata] Fatal error");
  console.error(error);
  process.exitCode = 1;
});