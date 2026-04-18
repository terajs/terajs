#!/usr/bin/env node
import { existsSync } from "node:fs";
import { builtinModules } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");
const runtimeExtensions = [".js", ".mjs", ".cjs"];
const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((value) => value.startsWith("node:") ? value : `node:${value}`)
]);

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

function normalizePackageSpecifier(specifier) {
  if (specifier.startsWith("@")) {
    const [scope = "", name = ""] = specifier.split("/");
    return `${scope}/${name}`;
  }

  const [name = ""] = specifier.split("/");
  return name;
}

function collectExportTargets(value, targets) {
  if (typeof value === "string") {
    targets.add(value);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const nested of Object.values(value)) {
    collectExportTargets(nested, targets);
  }
}

function collectEntryFiles(packageDir, manifest) {
  const targets = new Set();

  collectExportTargets(manifest.exports, targets);

  for (const field of ["main", "module", "browser"]) {
    if (typeof manifest[field] === "string") {
      targets.add(manifest[field]);
    }
  }

  const files = new Set();

  for (const target of targets) {
    if (!runtimeExtensions.some((extension) => target.endsWith(extension))) {
      continue;
    }

    files.add(resolve(packageDir, target));
  }

  return [...files].filter((filePath) => existsSync(filePath));
}

async function collectDistJsFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectDistJsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && runtimeExtensions.some((extension) => fullPath.endsWith(extension)) && !fullPath.endsWith(".spec.js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function hasSourceCounterpart(packageDir, distFilePath) {
  const relativePath = distFilePath.slice(packageDir.length + 1).replace(/\\/g, "/");
  if (!relativePath.startsWith("dist/")) {
    return false;
  }

  const sourceRelativeBase = relativePath
    .replace(/^dist\//, "src/")
    .replace(/\.(?:js|mjs|cjs)$/i, "");

  const candidates = [
    `${sourceRelativeBase}.ts`,
    `${sourceRelativeBase}.tsx`,
    `${sourceRelativeBase}.js`,
    `${sourceRelativeBase}.mjs`,
    `${sourceRelativeBase}.cjs`
  ].map((candidate) => resolve(packageDir, candidate));

  return candidates.some((candidate) => existsSync(candidate));
}

function resolveLocalImport(filePath, specifier) {
  const basePath = resolve(dirname(filePath), specifier);
  const candidates = [
    basePath,
    ...runtimeExtensions.map((extension) => `${basePath}${extension}`),
    ...runtimeExtensions.map((extension) => join(basePath, `index${extension}`))
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function collectRuntimeImports(filePath, sourceText) {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const specifiers = [];

  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier
      && ts.isStringLiteralLike(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length === 1
      && ts.isStringLiteralLike(node.arguments[0])) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

async function auditPackageRuntimeSurface(packageDir, manifest) {
  const issues = [];
  const entryFiles = collectEntryFiles(packageDir, manifest);
  const distDir = join(packageDir, "dist");
  const allDistFiles = await collectDistJsFiles(distDir);

  const allowedPackages = new Set([
    normalizePackageSpecifier(manifest.name),
    ...Object.keys(manifest.dependencies ?? {}).map(normalizePackageSpecifier),
    ...Object.keys(manifest.peerDependencies ?? {}).map(normalizePackageSpecifier),
    ...Object.keys(manifest.optionalDependencies ?? {}).map(normalizePackageSpecifier)
  ]);

  const visited = new Set();
  const queue = [...entryFiles];
  const missingDependencies = new Map();

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || visited.has(current) || !existsSync(current)) {
      continue;
    }

    visited.add(current);
    const sourceText = await readFile(current, "utf8");
    const specifiers = collectRuntimeImports(current, sourceText);

    for (const specifier of specifiers) {
      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        const resolved = resolveLocalImport(current, specifier);
        if (resolved) {
          queue.push(resolved);
        }
        continue;
      }

      if (builtins.has(specifier) || builtins.has(normalizePackageSpecifier(specifier))) {
        continue;
      }

      const normalized = normalizePackageSpecifier(specifier);
      if (allowedPackages.has(normalized)) {
        continue;
      }

      const relativeFile = current.slice(packageDir.length + 1).replace(/\\/g, "/");
      if (!missingDependencies.has(normalized)) {
        missingDependencies.set(normalized, new Set());
      }
      missingDependencies.get(normalized).add(relativeFile);
    }
  }

  for (const [specifier, files] of missingDependencies.entries()) {
    issues.push(`${manifest.name}: missing declared dependency for ${specifier} (${[...files].join(", ")})`);
  }

  const staleFiles = allDistFiles
    .filter((filePath) => !hasSourceCounterpart(packageDir, filePath))
    .map((filePath) => filePath.slice(packageDir.length + 1).replace(/\\/g, "/"))
    .sort();

  if (staleFiles.length > 0) {
    issues.push(`${manifest.name}: stale dist runtime files without source counterparts (${staleFiles.join(", ")})`);
  }

  return issues;
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

    issues.push(...await auditPackageRuntimeSurface(packageDir, manifest));
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