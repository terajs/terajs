/// <reference types="node" />

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workspaceRoot = process.cwd();
const packagesRoot = path.join(workspaceRoot, "packages");

const strictNeutralPackages = [
  "shared",
  "reactivity",
  "renderer",
  "compiler",
  "sfc",
  "router"
];

const guardedPackages = [...strictNeutralPackages];

const adapterImports = [
  "@terajs/app",
  "@terajs/renderer-web",
  "@terajs/renderer-ssr",
  "@terajs/vite-plugin",
  "@terajs/vite-plug-in",
  "@terajs/renderer-ios",
  "@terajs/renderer-android",
  "@terajs/router-manifest",
  "@terajs/ui",
  "@terajs/adapter-ai"
];

const allowedRootDevDependencies = new Set([
  "@changesets/cli",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@types/vue",
  "jsdom",
  "lit",
  "preact",
  "react",
  "react-dom",
  "solid-js",
  "typescript",
  "vitest",
  "vue"
]);

const allowedPackageExternalDependencies = new Map<string, Set<string>>([
  ["adapter-react", new Set<string>()],
  ["adapter-vue", new Set<string>()],
  ["adapter-ai", new Set<string>()],
  ["cli", new Set(["commander", "vite"])],
  ["create-terajs", new Set(["@terajs/cli"])],
  ["vite-plug-in", new Set<string>()],
  ["renderer-web", new Set<string>()],
  ["renderer-ssr", new Set<string>()],
  ["compiler", new Set<string>()],
  ["devtools", new Set<string>()],
  ["reactivity", new Set<string>()],
  ["renderer", new Set<string>()],
  ["router", new Set<string>()],
  ["router-manifest", new Set<string>()],
  ["runtime", new Set<string>()],
  ["sfc", new Set<string>()],
  ["shared", new Set<string>()],
  ["hub-signalr", new Set<string>()],
  ["hub-socketio", new Set<string>()],
  ["hub-websockets", new Set<string>()],
  ["terajs", new Set<string>()],
  ["ui", new Set<string>()]
]);

const allowedPackageExternalPeerDependencies = new Map<string, Set<string>>([
  ["vite-plug-in", new Set(["vite"])],
  ["terajs", new Set(["vite"])],
  ["hub-signalr", new Set(["@microsoft/signalr"])],
  ["hub-socketio", new Set(["socket.io-client"])],
  ["hub-websockets", new Set<string>()],
  ["adapter-react", new Set(["react", "react-dom"])],
  ["adapter-vue", new Set(["vue"])],
  ["adapter-ai", new Set<string>()]
]);

const frameworkImportPattern = /from\s+["'](?:react|react\/[^"']*|vue|vue\/[^"']*)["']/i;
const vitestImportPattern = /from\s+["']vitest["']/i;
const testSupportSourcePattern = /(?:Suite|SpecShared)\.tsx?$/;
const approvedRootCodeFiles = new Set([
  "terajs.config.js",
  "vite.config.js",
  "vite.config.ts",
  "vitest.config.ts",
  "vitest.setup.ts"
]);
const approvedPackageRootCodeFiles = new Map<string, Set<string>>([
  ["devtools", new Set(["postcss.config.js", "tailwind.config.js"])],
  ["vite-plug-in", new Set(["App.tera", "index.js", "index.ts"])]
]);

const maxProductionSourceLines = 500;
const legacyProductionSourceLineCaps = new Map<string, number>([
  ["packages/devtools/src/aiHelpers.ts", 512],
  ["packages/devtools/src/app.ts", 846],
  ["packages/devtools/src/overlayInspectorAndRuntimeStyles.ts", 517],
  ["packages/devtools/src/overlayInspectorSuite.ts", 537],
  ["packages/devtools/src/overlayPanelAndContentStyles.ts", 533],
  ["packages/devtools/src/overlayValueAndInteractiveStyles.ts", 511],
  ["packages/devtools/src/overlay.ts", 2090],
  ["packages/devtools/src/overlayStyles.ts", 1600],
  ["packages/devtools/src/panels/aiDiagnosticsPanel.ts", 528],
  ["packages/vite-plug-in/src/index.ts", 852],
  ["packages/sfc/src/stripTypes.ts", 619],
  ["packages/renderer-web/src/renderFromIR.ts", 530],
  ["packages/renderer-ssr/src/renderToString.ts", 513],
  ["packages/devtools/src/inspector/runtimeMonitor.ts", 540]
]);

describe("architecture guardrails", () => {
  it("prevents React or Vue imports in package source files", () => {
    const violations = collectFiles(path.join(packagesRoot), (filePath) => isSourceFile(filePath))
      .filter((filePath) => {
        const packageName = getPackageName(filePath);
        if (packageName === "adapter-react" || packageName === "adapter-vue") {
          return false;
        }
        return frameworkImportPattern.test(read(filePath));
      });

    expect(violations).toEqual([]);
  });

  it("prevents neutral packages from importing adapter packages", () => {
    const violations: string[] = [];

    for (const packageName of guardedPackages) {
      for (const filePath of collectFiles(path.join(packagesRoot, packageName, "src"), (candidate) => isSourceFile(candidate))) {
        const source = read(filePath);
        for (const adapterImport of adapterImports) {
          if (source.includes(`from \"${adapterImport}\"`) || source.includes(`from '${adapterImport}'`)) {
            violations.push(formatViolation(filePath, `imports adapter package ${adapterImport}`));
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("prevents browser globals in strict neutral packages", () => {
    const browserPattern = /\bwindow\b|\bdocument\b|\bnavigator\b|\blocalStorage\b|\bsessionStorage\b|\bCustomEvent\b|\bMutationObserver\b|\bcustomElements\b|\bWindow\b|\bDocument\b|\bHTMLElement\b|\bIntersectionObserver\b|\brequestIdleCallback\b/;
    const violations: string[] = [];

    for (const packageName of strictNeutralPackages) {
      for (const filePath of collectFiles(path.join(packagesRoot, packageName, "src"), (candidate) => isProductionSourceFile(candidate))) {
        const source = read(filePath);
        if (browserPattern.test(source)) {
          violations.push(formatViolation(filePath, "references browser-specific globals or DOM types"));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("prevents tracked code artifacts outside approved repo surfaces", () => {
    const violations = getTrackedWorkspaceFiles()
      .filter((filePath) => isCodeBearingFile(filePath))
      .filter((filePath) => !isApprovedTrackedCodeSurface(filePath));

    expect(violations).toEqual([]);
  });

  it("prevents vitest imports in production source files", () => {
    const violations = collectFiles(path.join(packagesRoot), (filePath) => isProductionSourceFile(filePath))
      .filter((filePath) => vitestImportPattern.test(read(filePath)))
      .map((filePath) => formatViolation(filePath, "imports vitest from production source"));

    expect(violations).toEqual([]);
  });

  it("prevents unexpected external dependencies in package manifests", () => {
    const violations: string[] = [];

    const rootPackage = JSON.parse(read(path.join(workspaceRoot, "package.json"))) as {
      devDependencies?: Record<string, string>;
    };

    for (const dependencyName of Object.keys(rootPackage.devDependencies ?? {})) {
      if (!allowedRootDevDependencies.has(dependencyName)) {
        violations.push(`package.json: unexpected root devDependency ${dependencyName}`);
      }
    }

    for (const packageDir of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
      if (!packageDir.isDirectory()) {
        continue;
      }

      const packageName = packageDir.name;
      const manifestPath = path.join(packagesRoot, packageName, "package.json");
      if (!fs.existsSync(manifestPath)) {
        continue;
      }

      const manifest = JSON.parse(read(manifestPath)) as {
        dependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };

      const allowedDependencies = allowedPackageExternalDependencies.get(packageName) ?? new Set<string>();
      for (const dependencyName of Object.keys(manifest.dependencies ?? {})) {
        if (dependencyName.startsWith("@terajs/")) {
          continue;
        }

        if (!allowedDependencies.has(dependencyName)) {
          violations.push(`packages/${packageName}/package.json: unexpected dependency ${dependencyName}`);
        }
      }

      const allowedPeerDependencies = allowedPackageExternalPeerDependencies.get(packageName) ?? new Set<string>();
      for (const dependencyName of Object.keys(manifest.peerDependencies ?? {})) {
        if (dependencyName.startsWith("@terajs/")) {
          continue;
        }

        if (!allowedPeerDependencies.has(dependencyName)) {
          violations.push(`packages/${packageName}/package.json: unexpected peerDependency ${dependencyName}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("prevents unexpected external imports in production source", () => {
    const violations: string[] = [];

    for (const filePath of collectFiles(path.join(packagesRoot), (candidate) => isProductionSourceFile(candidate))) {
      const packageName = getPackageName(filePath);
      const source = read(filePath);
      for (const importPath of extractBareImports(source)) {
        if (importPath.startsWith("@terajs/") || importPath.startsWith("node:")) {
          continue;
        }

        if ((packageName === "vite-plug-in" || packageName === "cli") && importPath === "vite") {
          continue;
        }

        if (packageName === "vite-plug-in" && (importPath === "@terajs/app" || importPath === "@terajs/app/vite" || importPath === "@terajs/app/devtools")) {
          continue;
        }

        if (packageName === "cli" && importPath === "@terajs/app/vite") {
          continue;
        }

        if (packageName === "cli" && importPath === "commander") {
          continue;
        }

        if (packageName === "create-terajs" && importPath === "@terajs/cli") {
          continue;
        }

        if (packageName === "adapter-react" && (importPath === "react" || importPath === "react-dom")) {
          continue;
        }

        if (packageName === "adapter-vue" && importPath === "vue") {
          continue;
        }

        if (packageName === "hub-socketio" && importPath === "socket.io-client") {
          continue;
        }

        violations.push(formatViolation(filePath, `imports unexpected external module ${importPath}`));
      }
    }

    expect(violations).toEqual([]);
  });

  it("classifies approved code surfaces structurally instead of by temp-file names", () => {
    expect(isApprovedTrackedCodeSurface("packages/shared/src/index.ts")).toBe(true);
    expect(isApprovedTrackedCodeSurface("packages/cli/test/doctor.spec.ts")).toBe(true);
    expect(isApprovedTrackedCodeSurface("packages/vite-plug-in/index.ts")).toBe(true);
    expect(isApprovedTrackedCodeSurface("benchmarks/frameworks-browser.ts")).toBe(true);
    expect(isApprovedTrackedCodeSurface("benchmarks/vite.browser-bench.config.ts")).toBe(true);
    expect(isApprovedTrackedCodeSurface("scripts/audit-exports.mjs")).toBe(true);

    expect(isApprovedTrackedCodeSurface("debug-check.ts")).toBe(false);
    expect(isApprovedTrackedCodeSurface("packages/shared/debug-check.ts")).toBe(false);
    expect(isApprovedTrackedCodeSurface("packages/router/notes.tera")).toBe(false);
  });

  it("enforces manageable production source file sizes", () => {
    const violations: string[] = [];

    for (const filePath of collectFiles(path.join(packagesRoot), (candidate) => isProductionSourceFile(candidate))) {
      const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, "/");
      const lineCount = countNonEmptyLines(filePath);
      const legacyCap = legacyProductionSourceLineCaps.get(relativePath);

      if (legacyCap !== undefined) {
        if (lineCount > legacyCap) {
          violations.push(`${relativePath}: ${lineCount} non-empty lines exceeds legacy cap ${legacyCap}`);
        }
        continue;
      }

      if (lineCount > maxProductionSourceLines) {
        violations.push(`${relativePath}: ${lineCount} non-empty lines exceeds ${maxProductionSourceLines} line readability cap`);
      }
    }

    expect(violations).toEqual([]);
  });
});

function collectFiles(root: string, predicate: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  const results: string[] = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "dist" || entry.name === "node_modules") {
        continue;
      }

      results.push(...collectFiles(fullPath, predicate));
      continue;
    }

    if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function isSourceFile(filePath: string): boolean {
  return /\.tsx?$/.test(filePath);
}

function isProductionSourceFile(filePath: string): boolean {
  return isSourceFile(filePath)
    && !/\.spec\.tsx?$/.test(filePath)
    && !/\.test\.tsx?$/.test(filePath)
    && !testSupportSourcePattern.test(filePath);
}

function getTrackedWorkspaceFiles(): string[] {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: workspaceRoot,
    encoding: "utf8"
  });

  return output
    .split("\0")
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .map((filePath) => filePath.replace(/\\/g, "/"));
}

function isCodeBearingFile(filePath: string): boolean {
  return /\.(?:[cm]?[jt]sx?|tera)$/.test(filePath);
}

function isApprovedTrackedCodeSurface(filePath: string): boolean {
  if (!filePath || filePath.startsWith(".git/") || filePath.startsWith("node_modules/") || filePath.includes("/node_modules/") || filePath.includes("/dist/")) {
    return false;
  }

  if (approvedRootCodeFiles.has(filePath)) {
    return true;
  }

  if (filePath.startsWith("scripts/")) {
    return true;
  }

  if (filePath.startsWith("benchmarks/")) {
    return true;
  }

  const packageMatch = /^packages\/([^/]+)\/(.+)$/.exec(filePath);
  if (!packageMatch) {
    return false;
  }

  const [, packageName, packageRelativePath] = packageMatch;

  if (packageRelativePath.startsWith("src/") || packageRelativePath.startsWith("test/")) {
    return true;
  }

  if (/^[^/]+\.config\.[cm]?[jt]s$/.test(packageRelativePath)) {
    return true;
  }

  const approvedPackageFiles = approvedPackageRootCodeFiles.get(packageName);
  if (approvedPackageFiles?.has(packageRelativePath)) {
    return true;
  }

  return false;
}

function read(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function countNonEmptyLines(filePath: string): number {
  return read(filePath)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .length;
}

function extractBareImports(source: string): string[] {
  const imports = new Set<string>();
  const pattern = /^\s*import(?:\s+[^"';]+?\s+from\s+)?["']([^"']+)["']/gm;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(source)) !== null) {
    const importPath = match[1];
    if (!importPath || importPath.startsWith(".") || importPath.startsWith("/")) {
      continue;
    }

    imports.add(importPath);
  }

  return [...imports];
}

function getPackageName(filePath: string): string {
  const relativePath = path.relative(packagesRoot, filePath).replace(/\\/g, "/");
  return relativePath.split("/")[0] ?? "";
}

function formatViolation(filePath: string, message: string): string {
  return `${path.relative(workspaceRoot, filePath).replace(/\\/g, "/")}: ${message}`;
}