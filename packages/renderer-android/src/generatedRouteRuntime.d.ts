import type { IRModule } from "@terajs/compiler";
import type { AndroidWireTransport } from "./wireTransport.js";

export interface AndroidGeneratedCompiledModule {
    kind: "page" | "layout" | "component" | "module";
    filePath: string;
    name: string;
    setupCode: string;
    importedBindings: string[];
    exposedBindings: string[];
    ir: IRModule;
}

export interface AndroidGeneratedRouteRecord {
    id: string;
    path: string;
    filePath: string;
    layouts: Array<{
        id: string;
        filePath: string;
    }>;
}

export interface CreateAndroidGeneratedRouteTransportOptions {
    modules: AndroidGeneratedCompiledModule[];
    routes: AndroidGeneratedRouteRecord[];
    initialPath?: string;
    transport?: AndroidWireTransport;
}

export interface AndroidGeneratedRouteTransport {
    route: AndroidGeneratedRouteRecord;
    transport: AndroidWireTransport;
}

export declare function createAndroidGeneratedRouteTransport(options: CreateAndroidGeneratedRouteTransportOptions): AndroidGeneratedRouteTransport;