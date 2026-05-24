import terajsPlugin, { type TerajsWorkspaceConfig, type TerajsWorkspaceTarget } from "@terajs/app/vite";
import type { InlineConfig } from "vite";
import { type NativeBuildOutput, type NativeBuildStep } from "./nativeBuild.js";
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
    nativeBuild?(step: NativeBuildStep, dependencies?: {
        cwd?: string;
    }): Promise<NativeBuildOutput>;
    pluginFactory?: typeof terajsPlugin;
}
interface WebBuildPlanStep {
    target: "web";
    kind: "web";
    outputDir: string;
}
type BuildPlanStep = WebBuildPlanStep | NativeBuildStep;
export declare function collectBuildTarget(value: string, previous?: string[]): string[];
export declare function parseBuildTargets(values?: string[]): TerajsWorkspaceTarget[] | undefined;
export declare function resolveBuildTargets(workspace: TerajsWorkspaceConfig, requestedTargets?: TerajsWorkspaceTarget[]): TerajsWorkspaceTarget[];
export declare function createBuildPlan(workspace: TerajsWorkspaceConfig, requestedTargets?: TerajsWorkspaceTarget[]): BuildPlanStep[];
export declare function buildWebTarget(step: WebBuildPlanStep, dependencies: BuildDependencies): Promise<BuildResult>;
export declare function executeBuildPlan(plan: BuildPlanStep[], dependencies: BuildDependencies): Promise<BuildResult[]>;
export declare function runBuildCommand(options: BuildCommandOptions, dependencies: BuildDependencies): Promise<BuildCommandResult>;
export {};
//# sourceMappingURL=build.d.ts.map