#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");

async function removePath(targetPath) {
  if (!existsSync(targetPath)) {
    return;
  }

  await rm(targetPath, { recursive: true, force: true });
}

async function main() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDir = join(packagesRoot, entry.name);
    await removePath(join(packageDir, "dist"));
    await removePath(join(packageDir, "tsconfig.tsbuildinfo"));
  }

  await removePath(join(repoRoot, "tsconfig.tsbuildinfo"));
  await removePath(join(repoRoot, "tsconfig.devtools.tsbuildinfo"));
}

main().catch((error) => {
  console.error("[clean-workspace] Fatal error");
  console.error(error);
  process.exitCode = 1;
});