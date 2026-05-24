import type { TerajsWorkspaceTarget } from "@terajs/app/vite";
export type NativeBuildTarget = Exclude<TerajsWorkspaceTarget, "web">;
export interface NativeBuildStep {
    target: NativeBuildTarget;
    kind: "native";
    sourceRoot: string;
    generatedDir: string;
    hostDir: string;
}
export interface NativeBuildDependencies {
    cwd?: string;
}
export interface NativeBuildModuleRecord {
    kind: "page" | "layout" | "component" | "module";
    filePath: string;
    outputPath: string;
    name: string;
    importedBindings: string[];
    exposedBindings: string[];
}
export interface NativeBuildRouteRecord {
    id: string;
    path: string;
    filePath: string;
    layout?: string;
    mountTarget?: string;
    asset?: string;
    middleware: string[];
    prerender: boolean;
    hydrate: string;
    edge: boolean;
    meta: Record<string, unknown>;
    ai?: Record<string, any>;
    layouts: Array<{
        id: string;
        filePath: string;
    }>;
}
export interface NativeBuildManifest {
    target: NativeBuildTarget;
    renderer: string;
    bridgeModel: "thin-command-bridge";
    generatedAt: string;
    sourceRoot: string;
    generatedDir: string;
    hostDir: string;
    routesFile: string;
    hostManifestFile: string;
    moduleCount: number;
    routeCount: number;
    modules: NativeBuildModuleRecord[];
    bootstrap?: {
        initialCommandBatchFile?: string;
    };
}
export interface NativeHostManifest {
    target: NativeBuildTarget;
    renderer: string;
    bridgeModel: "thin-command-bridge";
    generatedAt: string;
    generatedManifest: string;
    routesFile: string;
    sourceRoot: string;
    bootstrap?: {
        initialCommandBatchFile?: string;
    };
}
export interface NativeBuildOutput {
    target: NativeBuildTarget;
    moduleCount: number;
    routeCount: number;
    generatedManifestPath: string;
    hostManifestPath: string;
}
export declare function buildNativeTarget(step: NativeBuildStep, dependencies?: NativeBuildDependencies): Promise<NativeBuildOutput>;
//# sourceMappingURL=nativeBuild.d.ts.map