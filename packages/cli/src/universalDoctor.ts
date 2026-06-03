import { existsSync } from "node:fs";
import path from "node:path";

import {
  getWorkspaceConfig,
  type TerajsWorkspaceConfig,
  type TerajsWorkspaceTarget,
} from "@terajs/app/vite";

import {
  type DoctorCheck,
  type DoctorReport,
  inspectTerajsProject,
} from "./doctor.js";
import { inspectTargetShell, type InspectShellOptions } from "./shellDoctor.js";

export interface InspectUniversalWorkspaceOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  getWorkspaceConfig?: () => TerajsWorkspaceConfig;
}

const DEPLOY_TARGETS: TerajsWorkspaceTarget[] = ["web", "android", "ios"];

function formatPath(root: string, filePath: string): string {
  const relativePath = path.relative(root, filePath);
  return relativePath.length > 0 ? relativePath.replace(/\\/g, "/") : ".";
}

function checkWorkspaceMode(workspace: TerajsWorkspaceConfig): DoctorCheck {
  return {
    id: "universal-mode",
    label: "Universal workspace mode enabled",
    ok: workspace.mode === "universal",
    level: "error",
    details: workspace.mode === "universal"
      ? "terajs.config declares mode: universal."
      : "Set workspace.mode to universal before using shared-source deployment targets."
  };
}

function checkSharedSourceRoot(root: string, workspace: TerajsWorkspaceConfig): DoctorCheck {
  const sourceRoot = path.isAbsolute(workspace.sourceRoot)
    ? workspace.sourceRoot
    : path.join(root, workspace.sourceRoot);
  const ok = existsSync(sourceRoot);

  return {
    id: "universal-source-root",
    label: "Shared source root exists",
    ok,
    level: "error",
    details: ok
      ? formatPath(root, sourceRoot)
      : `Create the shared source root at ${formatPath(root, sourceRoot)}.`
  };
}

function checkSelectedTarget(target: TerajsWorkspaceTarget, workspace: TerajsWorkspaceConfig): DoctorCheck {
  const ok = workspace.targets.selected.includes(target);

  return {
    id: `universal-target:${target}`,
    label: `${target} target selected`,
    ok,
    level: "warn",
    details: ok
      ? `${target} is included in workspace.targets.selected.`
      : `Add ${target} to workspace.targets.selected when this workspace should deploy there.`
  };
}

function prefixShellCheck(target: "android" | "ios", check: DoctorCheck): DoctorCheck {
  return {
    ...check,
    id: `universal-${check.id}`,
    label: `${target}: ${check.label}`,
  };
}

function inspectSelectedNativeTarget(
  target: "android" | "ios",
  root: string,
  options: InspectShellOptions
): DoctorCheck[] {
  return inspectTargetShell(target, {
    ...options,
    cwd: root,
  }).checks.map((check) => prefixShellCheck(target, check));
}

export async function inspectUniversalWorkspace(
  options: InspectUniversalWorkspaceOptions = {}
): Promise<DoctorReport> {
  const root = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const loadWorkspaceConfig = options.getWorkspaceConfig ?? getWorkspaceConfig;

  const projectReport = await inspectTerajsProject(root);
  const workspace = loadWorkspaceConfig();
  const checks: DoctorCheck[] = [
    ...projectReport.checks,
    checkWorkspaceMode(workspace),
    checkSharedSourceRoot(root, workspace),
    ...DEPLOY_TARGETS.map((target) => checkSelectedTarget(target, workspace)),
  ];

  if (workspace.targets.selected.includes("android")) {
    checks.push(...inspectSelectedNativeTarget("android", root, { env }));
  }

  if (workspace.targets.selected.includes("ios")) {
    checks.push(...inspectSelectedNativeTarget("ios", root, { env }));
  }

  return {
    root,
    checks,
    ok: checks.every((check) => check.ok || check.level !== "error")
  };
}
