import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as viteBuild } from "vite";
import * as ts from "typescript";

import { buildRouteManifest } from "@terajs/app";
import type { IRModule } from "@terajs/compiler";
import type { TerajsWorkspaceTarget } from "@terajs/app/vite";
import { compileComponentModuleParts, parseSFC } from "@terajs/sfc";

import {
  createAndroidRouteBootstrapCommandBatch,
  type NativeBootstrapCompiledModule,
} from "./nativeBootstrap.js";

type BuiltRoute = ReturnType<typeof buildRouteManifest>[number];

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
  runtime?: {
    descriptorFile: string;
    kind: "generated-route-runtime";
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
  runtime?: {
    descriptorFile: string;
    kind: "generated-route-runtime";
  };
}

export interface NativeRuntimeDescriptor {
  entryScriptFile?: string;
  generatedManifestFile: string;
  initialRoutePath: string;
  kind: "generated-route-runtime";
  routesFile: string;
}

export interface NativeBuildOutput {
  target: NativeBuildTarget;
  moduleCount: number;
  routeCount: number;
  generatedManifestPath: string;
  hostManifestPath: string;
}

interface NativeCompiledModule extends NativeBootstrapCompiledModule {
  outputPath: string;
}

const TARGET_RENDERER: Record<NativeBuildTarget, string> = {
  android: "android-views",
  ios: "uikit-views"
};

const TARGET_LABEL: Record<NativeBuildTarget, string> = {
  android: "Android Views",
  ios: "UIKit"
};

function importRuntimeModule<T = unknown>(specifier: string): Promise<T> {
  return import(specifier) as Promise<T>;
}

function resolveRepoModuleHref(relativePath: string): string {
  return new URL(relativePath, import.meta.url).href;
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function formatRelativePath(fromPath: string, targetPath: string): string {
  const relative = path.relative(fromPath, targetPath);
  return relative.length > 0 ? normalizePath(relative) : ".";
}

function toWorkspaceFilePath(cwd: string, filePath: string): string {
  const relative = formatRelativePath(cwd, filePath);
  return relative === "." ? "/" : `/${relative}`;
}

function classifyModule(sourceRoot: string, filePath: string): NativeBuildModuleRecord["kind"] {
  const relative = normalizePath(path.relative(sourceRoot, filePath));

  if (relative.startsWith("pages/") || relative.startsWith("routes/")) {
    return /(^|\/)layout\.tera$/i.test(relative) ? "layout" : "page";
  }

  if (relative.startsWith("components/")) {
    return "component";
  }

  return "module";
}

async function collectTeraFiles(rootDir: string): Promise<string[]> {
  try {
    await fs.access(rootDir);
  } catch {
    return [];
  }

  const teraFiles: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".tera")) {
        teraFiles.push(entryPath);
      }
    }
  }

  await walk(rootDir);
  return teraFiles.sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)));
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, value: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function createModuleOutputPath(sourceRoot: string, filePath: string): string {
  const relative = normalizePath(path.relative(sourceRoot, filePath));
  return normalizePath(path.join("modules", relative)).replace(/\.tera$/i, ".json");
}

function serializeRoute(route: BuiltRoute): NativeBuildRouteRecord {
  return {
    id: route.id,
    path: route.path,
    filePath: normalizePath(route.filePath),
    layout: typeof route.layout === "string" ? route.layout : undefined,
    mountTarget: route.mountTarget,
    asset: route.asset,
    middleware: [...route.middleware],
    prerender: route.prerender,
    hydrate: route.hydrate,
    edge: route.edge,
    meta: route.meta,
    ai: route.ai,
    layouts: route.layouts.map((layout) => ({
      id: layout.id,
      filePath: normalizePath(layout.filePath)
    }))
  };
}

function createHostReadme(
  step: NativeBuildStep,
  hostManifestPath: string,
  generatedManifestPath: string,
  routesPath: string,
  bootstrapCommandBatchPath?: string,
  runtimeDescriptorPath?: string,
  runtimeEntryScriptPath?: string
): string {
  const lines = [
    `# Terajs ${step.target === "android" ? "Android" : "iOS"} Host Output`,
    "",
    `This directory is generated by tera build --target ${step.target}.`,
    "",
    `- Generated artifact manifest: ${formatRelativePath(step.hostDir, generatedManifestPath)}`,
    `- Route manifest: ${formatRelativePath(step.hostDir, routesPath)}`,
    `- Host manifest: ${path.basename(hostManifestPath)}`,
  ];

  if (bootstrapCommandBatchPath) {
    lines.push(`- Bootstrap command batch: ${formatRelativePath(step.hostDir, bootstrapCommandBatchPath)}`);
  }

  if (runtimeDescriptorPath) {
    lines.push(`- Generated route runtime descriptor: ${formatRelativePath(step.hostDir, runtimeDescriptorPath)}`);
  }

  if (runtimeEntryScriptPath) {
    lines.push(`- Live runtime entry bundle: ${formatRelativePath(step.hostDir, runtimeEntryScriptPath)}`);
  }

  lines.push(
    "",
    `The current builder emits compiled Terajs module artifacts and target metadata for the ${TARGET_LABEL[step.target]} renderer contract.`
  );

  return lines.join("\n");
}

function createAndroidBootstrapModule(options: {
  sourceRoot: string;
  routeCount: number;
  moduleCount: number;
}): IRModule {
  const summaryLines = [
    `Source root: ${options.sourceRoot}`,
    `Routes: ${options.routeCount}`,
    `Modules: ${options.moduleCount}`,
    "Rendered from the generated Android command batch."
  ];

  return {
    filePath: "/.terajs/generated/android/bootstrap/root-command-batch.tera",
    template: [
      {
        type: "element",
        tag: "stack-view",
        props: [
          {
            kind: "static",
            name: "style",
            value: {
              padding: "24"
            }
          }
        ],
        children: [
          {
            type: "element",
            tag: "h2",
            props: [],
            children: [
              {
                type: "text",
                value: "Terajs Android shell ready",
                flags: { static: true }
              }
            ],
            flags: { static: true }
          },
          ...summaryLines.map((line) => ({
            type: "element",
            tag: "p",
            props: [],
            children: [
              {
                type: "text",
                value: line,
                flags: { static: true }
              }
            ],
            flags: { static: true }
          }))
        ],
        flags: { static: true }
      }
    ],
    meta: {},
    route: null
  } as IRModule;
}

function createIOSBootstrapModule(options: {
  sourceRoot: string;
  routeCount: number;
  moduleCount: number;
}): IRModule {
  const summaryLines = [
    `Source root: ${options.sourceRoot}`,
    `Routes: ${options.routeCount}`,
    `Modules: ${options.moduleCount}`,
    "Rendered from the generated iOS command batch."
  ];

  return {
    filePath: "/.terajs/generated/ios/bootstrap/root-command-batch.tera",
    template: [
      {
        type: "element",
        tag: "stack-view",
        props: [
          {
            kind: "static",
            name: "style",
            value: {
              padding: "24"
            }
          }
        ],
        children: [
          {
            type: "element",
            tag: "h2",
            props: [],
            children: [
              {
                type: "text",
                value: "Terajs iOS shell ready",
                flags: { static: true }
              }
            ],
            flags: { static: true }
          },
          ...summaryLines.map((line) => ({
            type: "element",
            tag: "p",
            props: [],
            children: [
              {
                type: "text",
                value: line,
                flags: { static: true }
              }
            ],
            flags: { static: true }
          }))
        ],
        flags: { static: true }
      }
    ],
    meta: {},
    route: null
  } as IRModule;
}

async function createAndroidSummaryCommandBatch(options: {
  sourceRoot: string;
  routeCount: number;
  moduleCount: number;
}): Promise<string> {
  const rendererAndroidPackage = "@terajs/renderer-android";
  const rendererAndroidDistHref = resolveRepoModuleHref("../../renderer-android/dist/index.js");
  const { createAndroidWireTransport } = await import(rendererAndroidPackage)
    .catch(() => importRuntimeModule<{ createAndroidWireTransport: () => {
      session: { mountIRModule: (ir: IRModule, ctx: Record<string, unknown>) => void };
      drainCommandBatchPayload: () => string | null;
    } }>(rendererAndroidDistHref));
  const transport = createAndroidWireTransport();
  transport.session.mountIRModule(createAndroidBootstrapModule(options), {});
  const payload = transport.drainCommandBatchPayload();

  if (!payload) {
    throw new Error("Failed to generate Android bootstrap command batch.");
  }

  return payload;
}

async function createIOSSummaryCommandBatch(options: {
  sourceRoot: string;
  routeCount: number;
  moduleCount: number;
}): Promise<string> {
  const rendererIOSPackage = "@terajs/renderer-ios";
  const rendererIOSDistHref = resolveRepoModuleHref("../../renderer-ios/dist/index.js");
  const { createUIKitWireTransport } = await import(rendererIOSPackage)
    .catch(() => importRuntimeModule<{ createUIKitWireTransport: () => {
      session: { mountIRModule: (ir: IRModule, ctx: Record<string, unknown>) => void };
      drainCommandBatchPayload: () => string | null;
    } }>(rendererIOSDistHref));
  const transport = createUIKitWireTransport();
  transport.session.mountIRModule(createIOSBootstrapModule(options), {});
  const payload = transport.drainCommandBatchPayload();

  if (!payload) {
    throw new Error("Failed to generate iOS bootstrap command batch.");
  }

  return payload;
}

function createAndroidLiveRuntimeEntrySource(): string {
  return [
    'import { createAndroidGeneratedRouteTransport } from "@terajs/renderer-android";',
    '',
    'function normalizeAssetPath(assetPath) {',
    '  return assetPath.replace(/\\\\/g, "/");',
    '}',
    '',
    'function resolveAssetPath(baseAssetPath, relativePath) {',
    '  const base = normalizeAssetPath(baseAssetPath);',
    '  const target = normalizeAssetPath(relativePath);',
    '  if (target.startsWith("/")) {',
    '    return target;',
    '  }',
    '  const parts = base.split("/");',
    '  parts.pop();',
    '  for (const part of target.split("/")) {',
    '    if (!part || part === ".") {',
    '      continue;',
    '    }',
    '    if (part === "..") {',
    '      if (parts.length > 0) {',
    '        parts.pop();',
    '      }',
    '      continue;',
    '    }',
    '    parts.push(part);',
    '  }',
    '  return parts.join("/");',
    '}',
    '',
    'function requireHostMethod(host, methodName) {',
    '  const value = host && host[methodName];',
    '  if (typeof value !== "function") {',
    '    throw new Error(`Android native runtime host is missing ${methodName}().`);',
    '  }',
    '  return value.bind(host);',
    '}',
    '',
    'function readTextAsset(host, assetPath) {',
    '  const value = host.readTextAsset(assetPath);',
    '  if (typeof value !== "string") {',
    '    throw new Error(`Android native runtime host returned a non-string asset for ${assetPath}.`);',
    '  }',
    '  return value;',
    '}',
    '',
    'function readJsonAsset(host, assetPath) {',
    '  return JSON.parse(readTextAsset(host, assetPath));',
    '}',
    '',
    'function loadRuntimeAssets(host, descriptorAssetPath, descriptor) {',
    '  const generatedManifestAssetPath = resolveAssetPath(',
    '    descriptorAssetPath,',
    '    typeof descriptor.generatedManifestFile === "string" && descriptor.generatedManifestFile.length > 0',
    '      ? descriptor.generatedManifestFile',
    '      : "../terajs-target.json"',
    '  );',
    '  const routesAssetPath = resolveAssetPath(',
    '    descriptorAssetPath,',
    '    typeof descriptor.routesFile === "string" && descriptor.routesFile.length > 0',
    '      ? descriptor.routesFile',
    '      : "../routes.json"',
    '  );',
    '  const generatedManifest = readJsonAsset(host, generatedManifestAssetPath);',
    '  const routes = readJsonAsset(host, routesAssetPath);',
    '  const modules = (generatedManifest.modules || []).map((moduleRecord) => {',
    '    const compiledAssetPath = resolveAssetPath(generatedManifestAssetPath, moduleRecord.outputPath);',
    '    const compiledModule = readJsonAsset(host, compiledAssetPath);',
    '    return {',
    '      ...moduleRecord,',
    '      setupCode: compiledModule.setupCode,',
    '      ir: compiledModule.ir,',
    '    };',
    '  });',
    '  return { modules, routes };',
    '}',
    '',
    'const runtime = {',
    '  start(host) {',
    '    requireHostMethod(host, "readTextAsset");',
    '    const emitCommandBatch = requireHostMethod(host, "emitCommandBatch");',
    '    const descriptorAssetPath = typeof host.runtimeDescriptorPath === "string" && host.runtimeDescriptorPath.length > 0',
    '      ? host.runtimeDescriptorPath',
    '      : ".terajs/generated/android/runtime/generated-route-runtime.json";',
    '    const descriptor = readJsonAsset(host, descriptorAssetPath);',
    '    const { modules, routes } = loadRuntimeAssets(host, descriptorAssetPath, descriptor);',
    '    const { route, transport } = createAndroidGeneratedRouteTransport({',
    '      modules,',
    '      routes,',
    '      initialPath: typeof descriptor.initialRoutePath === "string" && descriptor.initialRoutePath.length > 0',
    '        ? descriptor.initialRoutePath',
    '        : "/",',
    '    });',
    '    const flushPendingCommands = () => {',
    '      const payload = transport.drainCommandBatchPayload();',
    '      if (payload) {',
    '        emitCommandBatch(payload);',
    '      }',
    '      return payload;',
    '    };',
    '    const dispatchNativeEventPayload = (payload) => {',
    '      transport.dispatchNativeEventPacketPayload(payload);',
    '      flushPendingCommands();',
    '    };',
    '    if (typeof host.onNativeEvent === "function") {',
    '      host.onNativeEvent(dispatchNativeEventPayload);',
    '    } else if (typeof host.setNativeEventHandler === "function") {',
    '      host.setNativeEventHandler(dispatchNativeEventPayload);',
    '    }',
    '    flushPendingCommands();',
    '    return {',
    '      descriptor,',
    '      route,',
    '      dispatchNativeEventPayload,',
    '      flushPendingCommands,',
    '    };',
    '  },',
    '};',
    '',
    'globalThis.__terajsNativeRuntime = runtime;',
    '',
    'export default runtime;',
  ].join("\n");
}

function createIOSLiveRuntimeEntrySource(): string {
  return [
    'import { createUIKitGeneratedRouteTransport } from "@terajs/renderer-ios";',
    '',
    'function normalizeAssetPath(assetPath) {',
    '  return assetPath.replace(/\\\\/g, "/");',
    '}',
    '',
    'function resolveAssetPath(baseAssetPath, relativePath) {',
    '  const base = normalizeAssetPath(baseAssetPath);',
    '  const target = normalizeAssetPath(relativePath);',
    '  if (target.startsWith("/")) {',
    '    return target;',
    '  }',
    '  const parts = base.split("/");',
    '  parts.pop();',
    '  for (const part of target.split("/")) {',
    '    if (!part || part === ".") {',
    '      continue;',
    '    }',
    '    if (part === "..") {',
    '      if (parts.length > 0) {',
    '        parts.pop();',
    '      }',
    '      continue;',
    '    }',
    '    parts.push(part);',
    '  }',
    '  return parts.join("/");',
    '}',
    '',
    'function requireHostMethod(host, methodName) {',
    '  const value = host && host[methodName];',
    '  if (typeof value !== "function") {',
    '    throw new Error(`iOS native runtime host is missing ${methodName}().`);',
    '  }',
    '  return value.bind(host);',
    '}',
    '',
    'async function readTextAsset(host, assetPath) {',
    '  const value = await Promise.resolve(host.readTextAsset(assetPath));',
    '  if (typeof value !== "string") {',
    '    throw new Error(`iOS native runtime host returned a non-string asset for ${assetPath}.`);',
    '  }',
    '  return value;',
    '}',
    '',
    'async function readJsonAsset(host, assetPath) {',
    '  return JSON.parse(await readTextAsset(host, assetPath));',
    '}',
    '',
    'async function loadRuntimeAssets(host, descriptorAssetPath, descriptor) {',
    '  const generatedManifestAssetPath = resolveAssetPath(',
    '    descriptorAssetPath,',
    '    typeof descriptor.generatedManifestFile === "string" && descriptor.generatedManifestFile.length > 0',
    '      ? descriptor.generatedManifestFile',
    '      : "../terajs-target.json"',
    '  );',
    '  const routesAssetPath = resolveAssetPath(',
    '    descriptorAssetPath,',
    '    typeof descriptor.routesFile === "string" && descriptor.routesFile.length > 0',
    '      ? descriptor.routesFile',
    '      : "../routes.json"',
    '  );',
    '  const generatedManifest = await readJsonAsset(host, generatedManifestAssetPath);',
    '  const routes = await readJsonAsset(host, routesAssetPath);',
    '  const modules = await Promise.all((generatedManifest.modules || []).map(async (moduleRecord) => {',
    '    const compiledAssetPath = resolveAssetPath(generatedManifestAssetPath, moduleRecord.outputPath);',
    '    const compiledModule = await readJsonAsset(host, compiledAssetPath);',
    '    return {',
    '      ...moduleRecord,',
    '      setupCode: compiledModule.setupCode,',
    '      ir: compiledModule.ir,',
    '    };',
    '  }));',
    '  return { modules, routes };',
    '}',
    '',
    'const runtime = {',
    '  async start(host) {',
    '    requireHostMethod(host, "readTextAsset");',
    '    const emitCommandBatch = requireHostMethod(host, "emitCommandBatch");',
    '    const descriptorAssetPath = typeof host.runtimeDescriptorPath === "string" && host.runtimeDescriptorPath.length > 0',
    '      ? host.runtimeDescriptorPath',
    '      : ".terajs/generated/ios/runtime/generated-route-runtime.json";',
    '    const descriptor = await readJsonAsset(host, descriptorAssetPath);',
    '    const { modules, routes } = await loadRuntimeAssets(host, descriptorAssetPath, descriptor);',
    '    const { route, transport } = createUIKitGeneratedRouteTransport({',
    '      modules,',
    '      routes,',
    '      initialPath: typeof descriptor.initialRoutePath === "string" && descriptor.initialRoutePath.length > 0',
    '        ? descriptor.initialRoutePath',
    '        : "/",',
    '    });',
    '    const flushPendingCommands = () => {',
    '      const payload = transport.drainCommandBatchPayload();',
    '      if (payload) {',
    '        void emitCommandBatch(payload);',
    '      }',
    '      return payload;',
    '    };',
    '    const dispatchNativeEventPayload = (payload) => {',
    '      transport.dispatchNativeEventPacketPayload(payload);',
    '      flushPendingCommands();',
    '    };',
    '    if (typeof host.onNativeEvent === "function") {',
    '      host.onNativeEvent(dispatchNativeEventPayload);',
    '    } else if (typeof host.setNativeEventHandler === "function") {',
    '      host.setNativeEventHandler(dispatchNativeEventPayload);',
    '    }',
    '    flushPendingCommands();',
    '    return {',
    '      descriptor,',
    '      route,',
    '      dispatchNativeEventPayload,',
    '      flushPendingCommands,',
    '    };',
    '  },',
    '};',
    '',
    'globalThis.__terajsNativeRuntime = runtime;',
    '',
    'export default runtime;',
  ].join("\n");
}

async function createNativeLiveRuntimeBundle(
  outputPath: string,
  tempPrefix: string,
  entrySource: string,
  postTransformTarget?: string
): Promise<void> {
  const runtimeDir = path.dirname(outputPath);
  const tempBuildDir = await fs.mkdtemp(
    path.join(path.dirname(fileURLToPath(import.meta.url)), tempPrefix)
  );
  const tempEntryPath = path.join(tempBuildDir, "entry.mjs");

  await writeText(tempEntryPath, entrySource);

  try {
    await viteBuild({
      configFile: false,
      publicDir: false,
      logLevel: "silent",
      root: tempBuildDir,
      build: {
        emptyOutDir: false,
        minify: false,
        outDir: runtimeDir,
        sourcemap: false,
        target: "es2018",
        rollupOptions: {
          input: tempEntryPath,
          output: {
            entryFileNames: path.basename(outputPath),
            format: "iife",
            name: "TerajsNativeRuntime"
          }
        }
      }
    });

    if (postTransformTarget) {
      const emittedEntry = await fs.readFile(outputPath, "utf8");
      const transformedEntry = ts.transpileModule(emittedEntry, {
        compilerOptions: {
          allowJs: true,
          module: ts.ModuleKind.None,
          target: postTransformTarget === "es5" ? ts.ScriptTarget.ES5 : ts.ScriptTarget.ES2018,
        },
        fileName: path.basename(outputPath),
      });

      await writeText(outputPath, transformedEntry.outputText);
    }
  } finally {
    await fs.rm(tempBuildDir, { recursive: true, force: true });
  }
}

async function createAndroidLiveRuntimeBundle(outputPath: string): Promise<void> {
  await createNativeLiveRuntimeBundle(
    outputPath,
    ".android-live-runtime-",
    createAndroidLiveRuntimeEntrySource(),
    "es5"
  );
}

async function createIOSLiveRuntimeBundle(outputPath: string): Promise<void> {
  await createNativeLiveRuntimeBundle(outputPath, ".ios-live-runtime-", createIOSLiveRuntimeEntrySource());
}

export async function buildNativeTarget(
  step: NativeBuildStep,
  dependencies: NativeBuildDependencies = {}
): Promise<NativeBuildOutput> {
  const cwd = dependencies.cwd ?? process.cwd();
  const sourceRoot = path.resolve(cwd, step.sourceRoot);
  const generatedDir = path.resolve(cwd, step.generatedDir);
  const hostDir = path.resolve(cwd, step.hostDir);
  const resolvedStep: NativeBuildStep = {
    ...step,
    sourceRoot,
    generatedDir,
    hostDir
  };
  const generatedAt = new Date().toISOString();
  const sourceFiles = await collectTeraFiles(sourceRoot);

  if (sourceFiles.length === 0) {
    throw new Error(
      `No .tera files found under ${formatRelativePath(cwd, sourceRoot)} for ${step.target} build.`
    );
  }

  await fs.rm(generatedDir, { recursive: true, force: true });
  await fs.mkdir(generatedDir, { recursive: true });
  await fs.mkdir(hostDir, { recursive: true });

  const modules: NativeBuildModuleRecord[] = [];
  const compiledModules: NativeCompiledModule[] = [];

  for (const filePath of sourceFiles) {
    const source = await fs.readFile(filePath, "utf8");
    const workspaceFilePath = toWorkspaceFilePath(cwd, filePath);
    const parsed = parseSFC(source, workspaceFilePath);
    const compiled = compileComponentModuleParts(parsed);
    const kind = classifyModule(sourceRoot, filePath);
    const outputPath = createModuleOutputPath(sourceRoot, filePath);

    await writeJson(path.join(generatedDir, outputPath), {
      kind,
      filePath: workspaceFilePath,
      name: compiled.name,
      setupCode: compiled.setupCode,
      importedBindings: compiled.importedBindings,
      exposedBindings: compiled.exposedBindings,
      ir: compiled.ir
    });

    modules.push({
      kind,
      filePath: workspaceFilePath,
      outputPath,
      name: compiled.name,
      importedBindings: compiled.importedBindings,
      exposedBindings: compiled.exposedBindings
    });

    compiledModules.push({
      kind,
      filePath: workspaceFilePath,
      outputPath,
      name: compiled.name,
      setupCode: compiled.setupCode,
      importedBindings: compiled.importedBindings,
      exposedBindings: compiled.exposedBindings,
      ir: compiled.ir
    });
  }

  const routeFiles = Array.from(
    new Set([
      ...(await collectTeraFiles(path.join(sourceRoot, "pages"))),
      ...(await collectTeraFiles(path.join(sourceRoot, "routes")))
    ])
  ).sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)));
  const routes = buildRouteManifest(
    await Promise.all(
      routeFiles.map(async (filePath) => ({
        filePath: toWorkspaceFilePath(cwd, filePath),
        source: await fs.readFile(filePath, "utf8")
      }))
    )
  ).map(serializeRoute);

  const routesPath = path.join(generatedDir, "routes.json");
  const generatedManifestPath = path.join(generatedDir, "terajs-target.json");
  const hostManifestPath = path.join(hostDir, "terajs-host.json");
  const readmePath = path.join(hostDir, "README.md");
  const runtimeDescriptorPath = path.join(generatedDir, "runtime", "generated-route-runtime.json");
  const runtimeEntryScriptPath = path.join(generatedDir, "runtime", "live-runtime-entry.js");
  const bootstrapCommandBatchPath = path.join(generatedDir, "bootstrap", "root-command-batch.json");

  await writeJson(routesPath, routes);

  const initialRoutePath = routes.find((candidate) => candidate.path === "/")?.path
    ?? routes[0]?.path
    ?? "/";
  const runtimeDescriptor: NativeRuntimeDescriptor = {
    kind: "generated-route-runtime",
    initialRoutePath,
    generatedManifestFile: formatRelativePath(path.dirname(runtimeDescriptorPath), generatedManifestPath),
    routesFile: formatRelativePath(path.dirname(runtimeDescriptorPath), routesPath),
    entryScriptFile: formatRelativePath(path.dirname(runtimeDescriptorPath), runtimeEntryScriptPath)
  };
  await writeJson(runtimeDescriptorPath, runtimeDescriptor);

  if (step.target === "android") {
    await createAndroidLiveRuntimeBundle(runtimeEntryScriptPath);
  } else {
    await createIOSLiveRuntimeBundle(runtimeEntryScriptPath);
  }

  const routeBootstrapPayload = step.target === "android"
    ? await createAndroidRouteBootstrapCommandBatch({
        modules: compiledModules,
        routes
      }).catch(() => null)
    : null;

  await writeText(
    bootstrapCommandBatchPath,
    routeBootstrapPayload ?? await (step.target === "android"
      ? createAndroidSummaryCommandBatch({
          sourceRoot: formatRelativePath(cwd, sourceRoot),
          routeCount: routes.length,
          moduleCount: modules.length
        })
      : createIOSSummaryCommandBatch({
          sourceRoot: formatRelativePath(cwd, sourceRoot),
          routeCount: routes.length,
          moduleCount: modules.length
        }))
  );

  const bootstrap = {
    initialCommandBatchFile: formatRelativePath(generatedDir, bootstrapCommandBatchPath)
  };
  const runtime = {
    kind: "generated-route-runtime" as const,
    descriptorFile: formatRelativePath(generatedDir, runtimeDescriptorPath)
  };

  const manifest: NativeBuildManifest = {
    target: step.target,
    renderer: TARGET_RENDERER[step.target],
    bridgeModel: "thin-command-bridge",
    generatedAt,
    sourceRoot: formatRelativePath(cwd, sourceRoot),
    generatedDir: formatRelativePath(cwd, generatedDir),
    hostDir: formatRelativePath(cwd, hostDir),
    routesFile: path.basename(routesPath),
    hostManifestFile: formatRelativePath(generatedDir, hostManifestPath),
    moduleCount: modules.length,
    routeCount: routes.length,
    modules,
    bootstrap,
    runtime
  };

  const hostManifest: NativeHostManifest = {
    target: step.target,
    renderer: TARGET_RENDERER[step.target],
    bridgeModel: "thin-command-bridge",
    generatedAt,
    generatedManifest: formatRelativePath(hostDir, generatedManifestPath),
    routesFile: formatRelativePath(hostDir, routesPath),
    sourceRoot: formatRelativePath(cwd, sourceRoot),
    bootstrap: {
      initialCommandBatchFile: formatRelativePath(hostDir, bootstrapCommandBatchPath)
    },
    runtime: {
      ...runtime,
      descriptorFile: formatRelativePath(hostDir, runtimeDescriptorPath)
    }
  };

  await writeJson(generatedManifestPath, manifest);
  await writeJson(hostManifestPath, hostManifest);
  await fs.writeFile(
    readmePath,
    `${createHostReadme(
      resolvedStep,
      hostManifestPath,
      generatedManifestPath,
      routesPath,
      bootstrapCommandBatchPath,
      runtimeDescriptorPath,
      runtimeEntryScriptPath
    )}\n`,
    "utf8"
  );

  return {
    target: step.target,
    moduleCount: modules.length,
    routeCount: routes.length,
    generatedManifestPath,
    hostManifestPath
  };
}
