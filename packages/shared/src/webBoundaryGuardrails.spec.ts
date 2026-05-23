/// <reference types="node" />

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workspaceRoot = process.cwd();
const packagesRoot = path.join(workspaceRoot, "packages");

const domBoundaryProtectedPackages = [
  "shared",
  "reactivity",
  "renderer",
  "compiler",
  "sfc",
  "router",
  "router-manifest"
];

const browserPattern = /\bwindow\b|\bdocument\b|\bnavigator\b|\blocalStorage\b|\bsessionStorage\b|\bCustomEvent\b|\bMutationObserver\b|\bcustomElements\b|\bWindow\b|\bDocument\b|\bHTMLElement\b|\bIntersectionObserver\b|\brequestIdleCallback\b/;

describe("web boundary guardrails", () => {
  it("keeps DOM globals out of neutral compile and renderer layers", () => {
    const violations: string[] = [];

    for (const packageName of domBoundaryProtectedPackages) {
      for (const filePath of collectFiles(path.join(packagesRoot, packageName, "src"), (candidate) => isProductionSourceFile(candidate))) {
        if (browserPattern.test(read(filePath))) {
          violations.push(formatViolation(filePath, "references browser-specific globals or DOM types"));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("prevents neutral compile and renderer layers from importing renderer-web DOM surfaces", () => {
    const violations: string[] = [];

    for (const packageName of domBoundaryProtectedPackages) {
      for (const filePath of collectFiles(path.join(packagesRoot, packageName, "src"), (candidate) => isProductionSourceFile(candidate))) {
        for (const importPath of extractAllImports(read(filePath))) {
          if (importPath === "@terajs/renderer-web" || importPath.startsWith("@terajs/renderer-web/")) {
            violations.push(formatViolation(filePath, `imports web-owned renderer surface ${importPath}`));
            continue;
          }

          if ((importPath.startsWith(".") || importPath.startsWith("/")) && importPath.includes("renderer-web/")) {
            violations.push(formatViolation(filePath, `imports renderer-web internals by path ${importPath}`));
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("documents the protected DOM seam in renderer-web", () => {
    const domPath = path.join(packagesRoot, "renderer-web", "src", "dom.ts");
    const renderFromIRPath = path.join(packagesRoot, "renderer-web", "src", "renderFromIR.ts");

    expect(fs.existsSync(domPath)).toBe(true);
    expect(read(renderFromIRPath)).toMatch(/from\s+["']\.\/dom\.js["']/);
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

function isProductionSourceFile(filePath: string): boolean {
  return /\.tsx?$/.test(filePath)
    && !/\.spec\.tsx?$/.test(filePath)
    && !/\.test\.tsx?$/.test(filePath)
    && !/(?:Suite|SpecShared)\.tsx?$/.test(filePath);
}

function read(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function extractAllImports(source: string): string[] {
  const imports = new Set<string>();
  const pattern = /^\s*import(?:\s+[^"';]+?\s+from\s+)?["']([^"']+)["']/gm;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(source)) !== null) {
    const importPath = match[1];
    if (!importPath) {
      continue;
    }

    imports.add(importPath);
  }

  return [...imports];
}

function formatViolation(filePath: string, message: string): string {
  return `${path.relative(workspaceRoot, filePath).replace(/\\/g, "/")}: ${message}`;
}