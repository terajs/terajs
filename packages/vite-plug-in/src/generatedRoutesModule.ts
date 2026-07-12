import fs from "node:fs";
import { parseSFC } from "@terajs/sfc";
import { buildRouteFromSFC, type RouteConfigInput } from "@terajs/router-manifest";
import type { RouteDefinition } from "@terajs/router";

interface GeneratedRouteConfigOverride {
  path?: string;
  layout?: string;
  mountTarget?: string;
  middleware?: string[];
  prerender?: boolean;
  hydrate?: RouteDefinition["hydrate"];
  edge?: boolean;
}

interface GeneratedRouteLayoutEntry {
  id: string;
  filePath: string;
  importPath: string;
}

interface GeneratedRouteEntry {
  filePath: string;
  importPath: string;
  assetPath?: string;
  meta: Record<string, unknown>;
  ai?: Record<string, unknown>;
  override: GeneratedRouteConfigOverride | null;
  layouts: GeneratedRouteLayoutEntry[];
  children: GeneratedRouteEntry[];
}

interface GenerateRoutesModuleSourceOptions {
  routeFiles: string[];
  configuredRoutes: RouteConfigInput[];
  manifest?: Record<string, any>;
  normalizePath(filePath: string): string;
  toProjectImportPath(filePath: string): string;
  getManifestAssetPath(filePath: string, manifest?: Record<string, any>): string | undefined;
}

function isLayoutRouteFile(filePath: string, normalizePath: (filePath: string) => string): boolean {
  return /(^|\/)layout\.tera$/i.test(normalizePath(filePath));
}

function getRouteRelativeDirectory(filePath: string, normalizePath: (filePath: string) => string): string {
  const normalized = normalizePath(filePath).replace(/^.*\/(pages|routes)\//, "");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? "" : normalized.slice(0, lastSlash);
}

function toLayoutId(filePath: string, normalizePath: (filePath: string) => string): string {
  return getRouteRelativeDirectory(filePath, normalizePath) || "root";
}

function normalizeRouteOverride(
  routeOverride: ReturnType<typeof parseSFC>["routeOverride"]
): GeneratedRouteConfigOverride | null {
  if (!routeOverride) {
    return null;
  }

  const normalized: GeneratedRouteConfigOverride = {
    path: routeOverride.path,
    layout: routeOverride.layout,
    mountTarget: routeOverride.mountTarget,
    middleware: Array.isArray(routeOverride.middleware)
      ? routeOverride.middleware
      : routeOverride.middleware
        ? [routeOverride.middleware]
        : undefined,
    prerender: routeOverride.prerender,
    hydrate: routeOverride.hydrate,
    edge: routeOverride.edge
  };

  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : null;
}

function mergeRouteConfigOverride(
  routeOverride: ReturnType<typeof parseSFC>["routeOverride"],
  routeConfig?: RouteConfigInput
): GeneratedRouteConfigOverride | null {
  const normalizedRouteOverride = normalizeRouteOverride(routeOverride);
  if (!routeConfig) {
    return normalizedRouteOverride;
  }

  const normalizedConfig: GeneratedRouteConfigOverride = {
    path: routeConfig.path,
    layout: routeConfig.layout,
    mountTarget: routeConfig.mountTarget,
    middleware: Array.isArray(routeConfig.middleware)
      ? routeConfig.middleware
      : routeConfig.middleware
        ? [routeConfig.middleware]
        : undefined,
    prerender: routeConfig.prerender,
    hydrate: routeConfig.hydrate,
    edge: routeConfig.edge
  };
  const merged = {
    ...normalizedConfig,
    ...(normalizedRouteOverride ?? {})
  };

  return Object.values(merged).some((value) => value !== undefined)
    ? merged
    : null;
}

function collectRouteConfigs(
  routeConfigs: RouteConfigInput[],
  visitor: (routeConfig: RouteConfigInput, parent: RouteConfigInput | null) => void,
  parent: RouteConfigInput | null = null
): void {
  for (const routeConfig of routeConfigs) {
    visitor(routeConfig, parent);
    collectRouteConfigs(routeConfig.children ?? [], visitor, routeConfig);
  }
}

function resolveGeneratedRouteLayouts(
  pageFilePath: string,
  layoutsByDirectory: Map<string, GeneratedRouteLayoutEntry>,
  normalizePath: (filePath: string) => string
): GeneratedRouteLayoutEntry[] {
  const relativeDirectory = getRouteRelativeDirectory(pageFilePath, normalizePath);
  const segments = relativeDirectory ? relativeDirectory.split("/") : [];
  const layouts: GeneratedRouteLayoutEntry[] = [];

  for (let index = 0; index <= segments.length; index += 1) {
    const key = index === 0 ? "" : segments.slice(0, index).join("/");
    const layout = layoutsByDirectory.get(key);
    if (layout) {
      layouts.push(layout);
    }
  }

  return layouts;
}

function createGeneratedRouteEntries(
  options: GenerateRoutesModuleSourceOptions,
  configuredRouteMap: Map<string, RouteConfigInput>
): GeneratedRouteEntry[] {
  const layoutsByDirectory = new Map<string, GeneratedRouteLayoutEntry>();
  const nestedConfiguredRouteFiles = new Set<string>();

  collectRouteConfigs(options.configuredRoutes, (routeConfig, parent) => {
    if (parent) {
      nestedConfiguredRouteFiles.add(options.normalizePath(routeConfig.filePath));
    }
  });

  for (const filePath of options.routeFiles) {
    if (isLayoutRouteFile(filePath, options.normalizePath)) {
      const importPath = options.toProjectImportPath(filePath);
      layoutsByDirectory.set(getRouteRelativeDirectory(filePath, options.normalizePath), {
        id: toLayoutId(filePath, options.normalizePath),
        filePath: importPath,
        importPath
      });
    }
  }

  const pageEntries: GeneratedRouteEntry[] = [];

  const createRouteEntry = (filePath: string, routeConfig?: RouteConfigInput): GeneratedRouteEntry => {
    const importPath = options.toProjectImportPath(filePath);
    const parsedSfc = parseSFC(fs.readFileSync(filePath, "utf8"), importPath);
    const override = mergeRouteConfigOverride(
      parsedSfc.routeOverride,
      routeConfig
    );
    const routeShape = buildRouteFromSFC({
      ...parsedSfc,
      filePath: importPath,
      routeOverride: override
    });

    return {
      filePath: importPath,
      importPath,
      assetPath: options.getManifestAssetPath(filePath, options.manifest),
      meta: routeShape.meta,
      ai: routeShape.ai,
      override,
      layouts: resolveGeneratedRouteLayouts(filePath, layoutsByDirectory, options.normalizePath),
      children: routeConfig?.children?.map((child) => createRouteEntry(child.filePath, child)) ?? []
    };
  };

  for (const filePath of options.routeFiles) {
    if (isLayoutRouteFile(filePath, options.normalizePath)) {
      continue;
    }
    if (nestedConfiguredRouteFiles.has(options.normalizePath(filePath))) {
      continue;
    }

    pageEntries.push(createRouteEntry(filePath, configuredRouteMap.get(options.normalizePath(filePath))));
  }

  return pageEntries;
}

function serializeGeneratedRouteEntries(routeEntries: GeneratedRouteEntry[]): string {
  const serializeRouteEntry = (entry: GeneratedRouteEntry, indent = "  "): string => {
    const route = buildRouteFromSFC({
      filePath: entry.filePath,
      template: "",
      script: "",
      style: null,
      meta: entry.meta,
      ai: entry.ai,
      routeOverride: entry.override
    });

    const propertyIndent = `${indent}  `;
    const nestedIndent = `${indent}    `;
    const routeLines = [
      `${indent}{`,
      `${propertyIndent}id: ${JSON.stringify(route.id)},`,
      `${propertyIndent}path: ${JSON.stringify(route.path)},`,
      `${propertyIndent}filePath: ${JSON.stringify(route.filePath)},`,
      `${propertyIndent}component: () => import(${JSON.stringify(entry.importPath)}),`,
      entry.assetPath ? `${propertyIndent}asset: ${JSON.stringify(entry.assetPath)},` : null,
      `${propertyIndent}layout: ${route.layout === null ? "null" : JSON.stringify(route.layout)},`,
      route.mountTarget ? `${propertyIndent}mountTarget: ${JSON.stringify(route.mountTarget)},` : null,
      `${propertyIndent}middleware: ${JSON.stringify(route.middleware)},`,
      `${propertyIndent}prerender: ${JSON.stringify(route.prerender)},`,
      `${propertyIndent}hydrate: ${JSON.stringify(route.hydrate)},`,
      `${propertyIndent}edge: ${JSON.stringify(route.edge)},`,
      `${propertyIndent}meta: ${JSON.stringify(route.meta)},`,
      route.ai ? `${propertyIndent}ai: ${JSON.stringify(route.ai)},` : null,
      `${propertyIndent}layouts: [`,
      entry.layouts.map((layout) => [
        `${nestedIndent}{`,
        `${nestedIndent}  id: ${JSON.stringify(layout.id)},`,
        `${nestedIndent}  filePath: ${JSON.stringify(layout.filePath)},`,
        `${nestedIndent}  component: () => import(${JSON.stringify(layout.importPath)})`,
        `${nestedIndent}}`
      ].join("\n")).join(",\n"),
      `${propertyIndent}]${entry.children.length > 0 ? "," : ""}`,
      entry.children.length > 0
        ? [
          `${propertyIndent}children: [`,
          entry.children.map((child) => serializeRouteEntry(child, `${propertyIndent}  `)).join(",\n"),
          `${propertyIndent}]`
        ].join("\n")
        : null,
      `${indent}}`
    ].filter((line): line is string => line !== null);

    return routeLines.join("\n");
  };

  return [
    "const routes = [",
    routeEntries.map((entry) => serializeRouteEntry(entry)).join(",\n"),
    "];",
    "export { routes };",
    "export default routes;"
  ].join("\n");
}

export function generateRoutesModuleSource(options: GenerateRoutesModuleSourceOptions): string {
  const configuredRouteMap = new Map<string, RouteConfigInput>();
  collectRouteConfigs(options.configuredRoutes, (route) => {
    configuredRouteMap.set(options.normalizePath(route.filePath), route);
  });
  const routeEntries = createGeneratedRouteEntries(options, configuredRouteMap);
  return serializeGeneratedRouteEntries(routeEntries);
}
