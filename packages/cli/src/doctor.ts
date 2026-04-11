import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export type DoctorCheckLevel = "error" | "warn";

export interface DoctorCheck {
  id: string;
  label: string;
  ok: boolean;
  level: DoctorCheckLevel;
  details: string;
}

export interface DoctorReport {
  root: string;
  checks: DoctorCheck[];
  ok: boolean;
}

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Inspects a project folder and reports common Terajs setup issues.
 */
export async function inspectTerajsProject(root: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  const packagePath = join(root, "package.json");
  const packageExists = await fileExists(packagePath);
  checks.push({
    id: "package-json",
    label: "package.json exists",
    ok: packageExists,
    level: "error",
    details: packageExists ? packagePath : "Create package.json in the project root."
  });

  let manifest: PackageManifest | null = null;
  if (packageExists) {
    manifest = await readPackageManifest(packagePath);

    const hasFacade = dependencyValue(manifest, "terajs") !== undefined;
    if (hasFacade) {
      checks.push({
        id: "dep:terajs",
        label: "terajs dependency declared",
        ok: true,
        level: "error",
        details: `terajs@${dependencyValue(manifest, "terajs")}`
      });
    } else {
      checks.push(checkDependency(manifest, "@terajs/runtime", "error"));
      checks.push(checkDependency(manifest, "@terajs/renderer-web", "error"));
      checks.push(checkDependency(manifest, "@terajs/vite-plugin", "error"));
      checks.push({
        id: "dep:terajs",
        label: "terajs dependency declared",
        ok: false,
        level: "warn",
        details: "Recommended: add terajs as the default app package for simplified setup."
      });
    }

    checks.push(checkScript(manifest, "dev", "warn"));
    checks.push(checkScript(manifest, "build", "warn"));
  }

  const viteConfig = await findFirstExisting(root, [
    "vite.config.ts",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.cjs"
  ]);
  checks.push({
    id: "vite-config",
    label: "Vite config present",
    ok: viteConfig !== null,
    level: "error",
    details: viteConfig ?? "Add vite.config.ts or vite.config.js in the project root."
  });

  const terajsConfig = await findFirstExisting(root, [
    "terajs.config.cjs",
    "terajs.config.js"
  ]);
  checks.push({
    id: "terajs-config",
    label: "Terajs config present",
    ok: terajsConfig !== null,
    level: "warn",
    details: terajsConfig ?? "Add terajs.config.cjs to configure auto imports and route dirs."
  });

  const routeIndex = await findFirstExisting(root, [
    "src/routes/index.tera",
    "src/pages/index.tera"
  ]);
  checks.push({
    id: "route-entry",
    label: "Route entry file present",
    ok: routeIndex !== null,
    level: "warn",
    details: routeIndex ?? "Add src/routes/index.tera or src/pages/index.tera."
  });

  const hasBlockingIssue = checks.some((check) => !check.ok && check.level === "error");
  return {
    root,
    checks,
    ok: !hasBlockingIssue
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  const lines = [
    `Terajs Doctor report for ${report.root}`,
    ""
  ];

  for (const check of report.checks) {
    const state = check.ok ? "OK" : check.level === "error" ? "FAIL" : "WARN";
    lines.push(`[${state}] ${check.label}`);
    lines.push(`  ${check.details}`);
  }

  lines.push("");
  lines.push(report.ok
    ? "Doctor summary: setup is ready for development."
    : "Doctor summary: fix FAIL items before continuing.");

  return lines.join("\n");
}

function checkDependency(
  manifest: PackageManifest,
  depName: string,
  level: DoctorCheckLevel
): DoctorCheck {
  const value = dependencyValue(manifest, depName);
  return {
    id: `dep:${depName}`,
    label: `${depName} dependency declared`,
    ok: typeof value === "string" && value.length > 0,
    level,
    details: value ? `${depName}@${value}` : `Add ${depName} to dependencies or devDependencies.`
  };
}

function dependencyValue(manifest: PackageManifest, depName: string): string | undefined {
  return manifest.dependencies?.[depName] ?? manifest.devDependencies?.[depName];
}

function checkScript(
  manifest: PackageManifest,
  scriptName: string,
  level: DoctorCheckLevel
): DoctorCheck {
  const value = manifest.scripts?.[scriptName];
  return {
    id: `script:${scriptName}`,
    label: `npm script '${scriptName}' exists`,
    ok: typeof value === "string" && value.length > 0,
    level,
    details: value ? `${scriptName}: ${value}` : `Add a '${scriptName}' script in package.json.`
  };
}

async function readPackageManifest(packagePath: string): Promise<PackageManifest> {
  try {
    const raw = await readFile(packagePath, "utf8");
    return JSON.parse(raw) as PackageManifest;
  } catch {
    return {};
  }
}

async function findFirstExisting(root: string, relativePaths: string[]): Promise<string | null> {
  for (const relPath of relativePaths) {
    const fullPath = join(root, relPath);
    if (await fileExists(fullPath)) {
      return relPath;
    }
  }

  return null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
