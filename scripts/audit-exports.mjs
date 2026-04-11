#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");
const strict = process.argv.includes("--strict");

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function collectExportTargets(exportsField) {
  const targets = [];

  function visit(value) {
    if (!value) {
      return;
    }

    if (typeof value === "string") {
      targets.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value === "object") {
      for (const key of Object.keys(value)) {
        visit(value[key]);
      }
    }
  }

  visit(exportsField);
  return [...new Set(targets)];
}

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

function normalizeRelPath(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.startsWith("./") ? value.slice(2) : value;
}

function collectInternalDependencyRanges(manifest, pkgName) {
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const result = [];

  for (const section of sections) {
    const table = manifest[section];
    if (!table || typeof table !== "object") {
      continue;
    }

    for (const [depName, depRange] of Object.entries(table)) {
      if (!depName.startsWith("@terajs/") || depName === pkgName) {
        continue;
      }

      result.push({
        section,
        depName,
        depRange
      });
    }
  }

  return result;
}

function collectManifestWarnings(pkgName, manifest, warnings) {
  const isPrivate = manifest.private === true;

  if (!isPrivate) {
    if (typeof manifest.license !== "string" || manifest.license.trim().length === 0) {
      warnings.push(`${pkgName}: missing license field`);
    }

    if (!("repository" in manifest)) {
      warnings.push(`${pkgName}: missing repository field`);
    }

    if (pkgName.startsWith("@terajs/") && manifest.publishConfig?.access !== "public") {
      warnings.push(`${pkgName}: publishConfig.access is not set to public`);
    }
  }

  const exportsRoot = manifest.exports && typeof manifest.exports === "object"
    ? manifest.exports["."]
    : undefined;
  if (exportsRoot && typeof exportsRoot === "object") {
    const exportImport = exportsRoot.import ?? exportsRoot.default;
    const exportTypes = exportsRoot.types;

    if (typeof manifest.main === "string" && typeof exportImport === "string") {
      if (normalizeRelPath(manifest.main) !== normalizeRelPath(exportImport)) {
        warnings.push(`${pkgName}: main (${manifest.main}) does not match exports.import (${exportImport})`);
      }
    }

    if (typeof manifest.types === "string" && typeof exportTypes === "string") {
      if (normalizeRelPath(manifest.types) !== normalizeRelPath(exportTypes)) {
        warnings.push(`${pkgName}: types (${manifest.types}) does not match exports.types (${exportTypes})`);
      }
    }
  }

  for (const dep of collectInternalDependencyRanges(manifest, pkgName)) {
    if (dep.depRange === "*") {
      warnings.push(`${pkgName}: ${dep.section} uses wildcard internal range for ${dep.depName}`);
    }
  }
}

function validatePath(pkgName, packageDir, fieldName, relPath, issues) {
  if (typeof relPath !== "string" || relPath.length === 0) {
    return;
  }

  const absPath = join(packageDir, relPath);
  if (!existsSync(absPath)) {
    issues.push(`${pkgName}: missing ${fieldName} target ${relPath}`);
  }
}

async function main() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const issues = [];
  const warnings = [];
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
    const pkgName = typeof manifest.name === "string" ? manifest.name : entry.name;

    checkedCount += 1;

    validatePath(pkgName, packageDir, "main", manifest.main, issues);
    validatePath(pkgName, packageDir, "types", manifest.types, issues);
    collectManifestWarnings(pkgName, manifest, warnings);

    if (manifest.exports) {
      const targets = collectExportTargets(manifest.exports)
        .filter((target) => target.startsWith("./"));

      for (const target of asArray(targets)) {
        validatePath(pkgName, packageDir, "exports", target, issues);
      }
    }
  }

  if (strict && warnings.length > 0) {
    for (const warning of warnings) {
      issues.push(`[strict] ${warning}`);
    }
  }

  if (issues.length > 0) {
    console.error("[audit-exports] FAILED");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }

    if (!strict && warnings.length > 0) {
      console.error("[audit-exports] Warnings");
      for (const warning of warnings) {
        console.error(`- ${warning}`);
      }
    }

    process.exitCode = 1;
    return;
  }

  if (warnings.length > 0) {
    console.log(`[audit-exports] WARN (${checkedCount} packages validated, ${warnings.length} warnings)`);
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
    return;
  }

  console.log(`[audit-exports] OK (${checkedCount} packages validated)`);
}

main().catch((error) => {
  console.error("[audit-exports] Fatal error");
  console.error(error);
  process.exitCode = 1;
});
