import fs from "node:fs";
import path from "node:path";

import terajsPlugin, {
  getWorkspaceConfig,
  type TerajsWorkspaceConfig,
  type TerajsWorkspaceTarget
} from "@terajs/app/vite";
import type { InlineConfig } from "vite";

import {
  buildNativeTarget,
  type NativeBuildOutput,
  type NativeBuildStep
} from "./nativeBuild.js";

const TARGET_ORDER: TerajsWorkspaceTarget[] = ["web", "android", "ios"];
const VITE_CONFIG_FILES = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.cjs"
];

export interface BuildCommandOptions {
  target?: string[];
}

export interface BuildResult {
  target: TerajsWorkspaceTarget;
  status: "built" | "pending";
  detail: string;
}

export interface BuildCommandResult {
  workspace: TerajsWorkspaceConfig;
  targets: TerajsWorkspaceTarget[];
  results: BuildResult[];
}

interface BuildDependencies {
  viteBuild?(config: InlineConfig): Promise<unknown>;
  cwd?: string;
  hasFile?(filePath: string): boolean;
  getWorkspaceConfig?(): TerajsWorkspaceConfig;
  nativeBuild?(step: NativeBuildStep, dependencies?: { cwd?: string }): Promise<NativeBuildOutput>;
  pluginFactory?: typeof terajsPlugin;
}

interface WebBuildPlanStep {
  target: "web";
  kind: "web";
  outputDir: string;
}

type BuildPlanStep = WebBuildPlanStep | NativeBuildStep;

function isWorkspaceTarget(value: string): value is TerajsWorkspaceTarget {
  return value === "web" || value === "android" || value === "ios";
}

function formatRelativePath(cwd: string, targetPath: string): string {
  const relative = path.relative(cwd, targetPath);
  return relative.length > 0 ? relative.replace(/\\/g, "/") : ".";
}

function hasProjectViteConfig(cwd: string, hasFile: (filePath: string) => boolean): boolean {
  return VITE_CONFIG_FILES.some((fileName) => hasFile(path.join(cwd, fileName)));
}

export function collectBuildTarget(value: string, previous: string[] = []): string[] {
  const parts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return [...previous, ...parts];
}

export function parseBuildTargets(values?: string[]): TerajsWorkspaceTarget[] | undefined {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }

  const normalized: TerajsWorkspaceTarget[] = [];

  for (const rawValue of values) {
    const candidate = rawValue.trim().toLowerCase();
    if (!isWorkspaceTarget(candidate)) {
      throw new Error(`Invalid --target value "${rawValue}". Expected one of: web, android, ios.`);
    }

    if (!normalized.includes(candidate)) {
      normalized.push(candidate);
    }
  }

  return TARGET_ORDER.filter((target) => normalized.includes(target));
}

export function resolveBuildTargets(
  workspace: TerajsWorkspaceConfig,
  requestedTargets?: TerajsWorkspaceTarget[]
): TerajsWorkspaceTarget[] {
  const selectedTargets = requestedTargets ?? workspace.targets.selected;

  if (selectedTargets.length === 0) {
    throw new Error("No build targets selected. Configure workspace.targets.selected or pass --target.");
  }

  const configuredTargets = new Set(workspace.targets.selected);
  for (const target of selectedTargets) {
    if (!configuredTargets.has(target)) {
      throw new Error(
        `Target "${target}" is not enabled in workspace.targets.selected. Update terajs.config or choose one of: ${workspace.targets.selected.join(", ")}.`
      );
    }
  }

  return TARGET_ORDER.filter((target) => selectedTargets.includes(target));
}

export function createBuildPlan(
  workspace: TerajsWorkspaceConfig,
  requestedTargets?: TerajsWorkspaceTarget[]
): BuildPlanStep[] {
  const targets = resolveBuildTargets(workspace, requestedTargets);

  return targets.map((target) => {
    if (target === "web") {
      return {
        target,
        kind: "web",
        outputDir: workspace.targets.web.outputDir
      } satisfies WebBuildPlanStep;
    }

    const targetConfig = workspace.targets[target];
    return {
      target,
      kind: "native",
      sourceRoot: workspace.sourceRoot,
      generatedDir: targetConfig.generatedDir,
      hostDir: targetConfig.hostDir
    } satisfies NativeBuildStep;
  });
}

export async function buildWebTarget(
  step: WebBuildPlanStep,
  dependencies: BuildDependencies
): Promise<BuildResult> {
  if (!dependencies.viteBuild) {
    throw new Error("Vite build dependency is required for the web target.");
  }

  const cwd = dependencies.cwd ?? process.cwd();
  const hasFile = dependencies.hasFile ?? fs.existsSync;
  const outputDir = formatRelativePath(cwd, step.outputDir);
  const inlineConfig: InlineConfig = {
    root: cwd,
    build: {
      outDir: outputDir,
      manifest: true
    }
  };

  if (!hasProjectViteConfig(cwd, hasFile)) {
    const pluginFactory = dependencies.pluginFactory ?? terajsPlugin;
    inlineConfig.plugins = [pluginFactory()];
  }

  await dependencies.viteBuild(inlineConfig);

  return {
    target: "web",
    status: "built",
    detail: `Production web bundle written to ${outputDir}.`
  };
}

export async function executeBuildPlan(
  plan: BuildPlanStep[],
  dependencies: BuildDependencies
): Promise<BuildResult[]> {
  const cwd = dependencies.cwd ?? process.cwd();
  const runNativeBuild = dependencies.nativeBuild ?? buildNativeTarget;
  const results: BuildResult[] = [];

  for (const step of plan) {
    if (step.kind === "web") {
      results.push(await buildWebTarget(step, dependencies));
      continue;
    }

    const nativeOutput = await runNativeBuild(step, { cwd });

    results.push({
      target: step.target,
      status: "built",
      detail: `Native ${step.target} artifacts written to ${formatRelativePath(cwd, step.generatedDir)} (${nativeOutput.moduleCount} modules, ${nativeOutput.routeCount} routes) with host metadata in ${formatRelativePath(cwd, step.hostDir)}.`
    });
  }

  return results;
}

export async function runBuildCommand(
  options: BuildCommandOptions,
  dependencies: BuildDependencies
): Promise<BuildCommandResult> {
  const loadWorkspaceConfig = dependencies.getWorkspaceConfig ?? getWorkspaceConfig;
  const workspace = loadWorkspaceConfig();
  const requestedTargets = parseBuildTargets(options.target);
  const targets = resolveBuildTargets(workspace, requestedTargets);
  const results = await executeBuildPlan(createBuildPlan(workspace, requestedTargets), dependencies);

  return {
    workspace,
    targets,
    results
  };
}