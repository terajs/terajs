#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");
const rootReadmePath = join(repoRoot, "README.md");
const apiReferencePath = join(repoRoot, "API_REFERENCE.md");

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function collectPublicPackages() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const packages = [];

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

    packages.push({
      dir: packageDir,
      folder: entry.name,
      name: manifest.name,
      readmePath: join(packageDir, "README.md")
    });
  }

  return packages.sort((left, right) => left.name.localeCompare(right.name));
}

function ensureContains(content, needle, issues, ownerLabel) {
  if (!content.includes(needle)) {
    issues.push(`${ownerLabel}: missing \"${needle}\"`);
  }
}

async function main() {
  const issues = [];

  if (!existsSync(rootReadmePath)) {
    issues.push("README.md: missing root README");
  }

  if (!existsSync(apiReferencePath)) {
    issues.push("API_REFERENCE.md: missing root API reference");
  }

  if (issues.length > 0) {
    console.error("[audit-docs] FAILED");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const rootReadme = await readFile(rootReadmePath, "utf8");
  const apiReference = await readFile(apiReferencePath, "utf8");
  const publicPackages = await collectPublicPackages();

  for (const pkg of publicPackages) {
    if (!existsSync(pkg.readmePath)) {
      issues.push(`${pkg.name}: missing package README.md`);
      continue;
    }

    const packageReadme = await readFile(pkg.readmePath, "utf8");
    const expectedHeading = `# ${pkg.name}`;
    if (!packageReadme.startsWith(expectedHeading)) {
      issues.push(`${pkg.name}: README.md should start with \"${expectedHeading}\"`);
    }

    ensureContains(rootReadme, pkg.name, issues, "README.md");
    ensureContains(apiReference, pkg.name, issues, "API_REFERENCE.md");
  }

  const requiredReadmeTopics = [
    "@terajs/app/vite",
    "@terajs/app/devtools",
    "local-first",
    "DevTools",
    "SignalR",
    "Socket.IO",
    "WebSockets",
    "<ai>",
    "server-function",
    "SSR",
    "defineCustomElement",
    "@terajs/cli"
  ];

  for (const topic of requiredReadmeTopics) {
    ensureContains(rootReadme, topic, issues, "README.md");
  }

  const requiredApiTopics = [
    "@terajs/app/devtools",
    "<ai>",
    "server()",
    "hydrateRoot(component, root, props?)",
    "defineCustomElement(name, component)",
    "createSignalRHubTransport()",
    "createSocketIoHubTransport()",
    "createWebSocketHubTransport()"
  ];

  for (const topic of requiredApiTopics) {
    ensureContains(apiReference, topic, issues, "API_REFERENCE.md");
  }

  if (issues.length > 0) {
    console.error("[audit-docs] FAILED");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[audit-docs] OK (${publicPackages.length} public packages validated)`);
}

main().catch((error) => {
  console.error("[audit-docs] Fatal error");
  console.error(error);
  process.exitCode = 1;
});