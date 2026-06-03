#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");

const allowedSourceArtifacts = new Set([
  "packages/cli/src/androidToolchain.js",
  "packages/cli/src/commander.d.ts",
  "packages/shared/test/fixtures/proof-workspace/src/env.d.ts",
  "packages/vite-plug-in/src/autoImports.d.ts",
]);

function toRepoPath(filePath) {
  return filePath.slice(repoRoot.length + 1).replace(/\\/g, "/");
}

function isGeneratedSourceArtifact(filePath) {
  return filePath.endsWith(".js")
    || filePath.endsWith(".d.ts")
    || filePath.endsWith(".d.ts.map");
}

function sourceCounterpart(filePath) {
  if (filePath.endsWith(".d.ts.map")) {
    return `${filePath.slice(0, -".d.ts.map".length)}.ts`;
  }

  if (filePath.endsWith(".d.ts")) {
    return `${filePath.slice(0, -".d.ts".length)}.ts`;
  }

  if (filePath.endsWith(".js")) {
    return `${filePath.slice(0, -".js".length)}.ts`;
  }

  return null;
}

async function collectFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const issues = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const srcDir = join(packagesRoot, entry.name, "src");
    const files = await collectFiles(srcDir);

    for (const filePath of files) {
      if (!isGeneratedSourceArtifact(filePath)) {
        continue;
      }

      const repoPath = toRepoPath(filePath);
      if (allowedSourceArtifacts.has(repoPath)) {
        continue;
      }

      const counterpart = sourceCounterpart(filePath);
      if (counterpart && existsSync(counterpart)) {
        issues.push(repoPath);
      }
    }
  }

  if (issues.length > 0) {
    console.error("[guard:source-artifacts] FAILED");
    console.error("Generated TypeScript output must be emitted to package dist/ directories, not package src/ directories.");
    for (const issue of issues.sort()) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("[guard:source-artifacts] OK");
}

main().catch((error) => {
  console.error("[guard:source-artifacts] Fatal error");
  console.error(error);
  process.exitCode = 1;
});
