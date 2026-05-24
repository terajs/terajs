import fs from "node:fs/promises";
import path from "node:path";

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
  bootstrapCommandBatchPath?: string
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

async function createAndroidSummaryCommandBatch(options: {
  sourceRoot: string;
  routeCount: number;
  moduleCount: number;
}): Promise<string> {
  const rendererAndroidPackage = "@terajs/renderer-android";
  const rendererAndroidSourceHref = resolveRepoModuleHref("../../renderer-android/src/index.js");
  const { createAndroidWireTransport } = await import(rendererAndroidPackage)
    .catch(() => importRuntimeModule<{ createAndroidWireTransport: () => {
      session: { mountIRModule: (ir: IRModule, ctx: Record<string, unknown>) => void };
      drainCommandBatchPayload: () => string | null;
    } }>(rendererAndroidSourceHref));
  const transport = createAndroidWireTransport();
  transport.session.mountIRModule(createAndroidBootstrapModule(options), {});
  const payload = transport.drainCommandBatchPayload();

  if (!payload) {
    throw new Error("Failed to generate Android bootstrap command batch.");
  }

  return payload;
}

export async function buildNativeTarget(
  step: NativeBuildStep,
  dependencies: NativeBuildDependencies = {}
): Promise<NativeBuildOutput> {
  const cwd = dependencies.cwd ?? process.cwd();
  const generatedAt = new Date().toISOString();
  const sourceFiles = await collectTeraFiles(step.sourceRoot);

  if (sourceFiles.length === 0) {
    throw new Error(
      `No .tera files found under ${formatRelativePath(cwd, step.sourceRoot)} for ${step.target} build.`
    );
  }

  await fs.rm(step.generatedDir, { recursive: true, force: true });
  await fs.mkdir(step.generatedDir, { recursive: true });
  await fs.mkdir(step.hostDir, { recursive: true });

  const modules: NativeBuildModuleRecord[] = [];
  const compiledModules: NativeCompiledModule[] = [];

  for (const filePath of sourceFiles) {
    const source = await fs.readFile(filePath, "utf8");
    const workspaceFilePath = toWorkspaceFilePath(cwd, filePath);
    const parsed = parseSFC(source, workspaceFilePath);
    const compiled = compileComponentModuleParts(parsed);
    const kind = classifyModule(step.sourceRoot, filePath);
    const outputPath = createModuleOutputPath(step.sourceRoot, filePath);

    await writeJson(path.join(step.generatedDir, outputPath), {
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
      ...(await collectTeraFiles(path.join(step.sourceRoot, "pages"))),
      ...(await collectTeraFiles(path.join(step.sourceRoot, "routes")))
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

  const routesPath = path.join(step.generatedDir, "routes.json");
  const generatedManifestPath = path.join(step.generatedDir, "terajs-target.json");
  const hostManifestPath = path.join(step.hostDir, "terajs-host.json");
  const readmePath = path.join(step.hostDir, "README.md");
  const bootstrapCommandBatchPath = step.target === "android"
    ? path.join(step.generatedDir, "bootstrap", "root-command-batch.json")
    : undefined;

  await writeJson(routesPath, routes);

  if (bootstrapCommandBatchPath) {
    const routeBootstrapPayload = await createAndroidRouteBootstrapCommandBatch({
      modules: compiledModules,
      routes
    }).catch(() => null);

    await writeText(
      bootstrapCommandBatchPath,
      routeBootstrapPayload ?? await createAndroidSummaryCommandBatch({
        sourceRoot: formatRelativePath(cwd, step.sourceRoot),
        routeCount: routes.length,
        moduleCount: modules.length
      })
    );
  }

  const bootstrap = bootstrapCommandBatchPath
    ? {
        initialCommandBatchFile: formatRelativePath(step.hostDir, bootstrapCommandBatchPath)
      }
    : undefined;

  const manifest: NativeBuildManifest = {
    target: step.target,
    renderer: TARGET_RENDERER[step.target],
    bridgeModel: "thin-command-bridge",
    generatedAt,
    sourceRoot: formatRelativePath(cwd, step.sourceRoot),
    generatedDir: formatRelativePath(cwd, step.generatedDir),
    hostDir: formatRelativePath(cwd, step.hostDir),
    routesFile: path.basename(routesPath),
    hostManifestFile: formatRelativePath(step.generatedDir, hostManifestPath),
    moduleCount: modules.length,
    routeCount: routes.length,
    modules,
    bootstrap
  };

  const hostManifest: NativeHostManifest = {
    target: step.target,
    renderer: TARGET_RENDERER[step.target],
    bridgeModel: "thin-command-bridge",
    generatedAt,
    generatedManifest: formatRelativePath(step.hostDir, generatedManifestPath),
    routesFile: formatRelativePath(step.hostDir, routesPath),
    sourceRoot: formatRelativePath(cwd, step.sourceRoot),
    bootstrap
  };

  await writeJson(generatedManifestPath, manifest);
  await writeJson(hostManifestPath, hostManifest);
  await fs.writeFile(
    readmePath,
    `${createHostReadme(step, hostManifestPath, generatedManifestPath, routesPath, bootstrapCommandBatchPath)}\n`,
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