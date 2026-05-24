import type { IRModule } from "@terajs/compiler";
export interface NativeBootstrapCompiledModule {
    kind: "page" | "layout" | "component" | "module";
    filePath: string;
    name: string;
    setupCode: string;
    importedBindings: string[];
    exposedBindings: string[];
    ir: IRModule;
}
export interface NativeBootstrapRouteRecord {
    id: string;
    path: string;
    filePath: string;
    layouts: Array<{
        id: string;
        filePath: string;
    }>;
}
export declare function createAndroidRouteBootstrapCommandBatch(options: {
    modules: NativeBootstrapCompiledModule[];
    routes: NativeBootstrapRouteRecord[];
}): Promise<string | null>;
//# sourceMappingURL=nativeBootstrap.d.ts.map