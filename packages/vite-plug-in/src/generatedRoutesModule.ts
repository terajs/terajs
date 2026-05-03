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

  for (const filePath of options.routeFiles) {
    if (isLayoutRouteFile(filePath, options.normalizePath)) {
      continue;
    }

    const importPath = options.toProjectImportPath(filePath);
    const parsedSfc = parseSFC(fs.readFileSync(filePath, "utf8"), importPath);
    const override = mergeRouteConfigOverride(
      parsedSfc.routeOverride,
      configuredRouteMap.get(options.normalizePath(filePath))
    );
    const routeShape = buildRouteFromSFC({
      ...parsedSfc,
      filePath: importPath,
      routeOverride: override
    });

    pageEntries.push({
      filePath: importPath,
      importPath,
      assetPath: options.getManifestAssetPath(filePath, options.manifest),
      meta: routeShape.meta,
      ai: routeShape.ai,
      override,
      layouts: resolveGeneratedRouteLayouts(filePath, layoutsByDirectory, options.normalizePath)
    });
  }

  return pageEntries;
}

function serializeGeneratedRouteEntries(routeEntries: GeneratedRouteEntry[]): string {
  return [
    "const routes = [",
    routeEntries.map((entry) => {
      const route = buildRouteFromSFC({
        filePath: entry.filePath,
        template: "",
        script: "",
        style: null,
        meta: entry.meta,
        ai: entry.ai,
        routeOverride: entry.override
      });

      const routeLines = [
        "  {",
        `    id: ${JSON.stringify(route.id)},`,
        `    path: ${JSON.stringify(route.path)},`,
        `    filePath: ${JSON.stringify(route.filePath)},`,
        `    component: () => import(${JSON.stringify(entry.importPath)}),`,
        entry.assetPath ? `    asset: ${JSON.stringify(entry.assetPath)},` : null,
        `    layout: ${route.layout === null ? "null" : JSON.stringify(route.layout)},`,
        route.mountTarget ? `    mountTarget: ${JSON.stringify(route.mountTarget)},` : null,
        `    middleware: ${JSON.stringify(route.middleware)},`,
        `    prerender: ${JSON.stringify(route.prerender)},`,
        `    hydrate: ${JSON.stringify(route.hydrate)},`,
        `    edge: ${JSON.stringify(route.edge)},`,
        `    meta: ${JSON.stringify(route.meta)},`,
        route.ai ? `    ai: ${JSON.stringify(route.ai)},` : null,
        "    layouts: [",
        entry.layouts.map((layout) => [
          "      {",
          `        id: ${JSON.stringify(layout.id)},`,
          `        filePath: ${JSON.stringify(layout.filePath)},`,
          `        component: () => import(${JSON.stringify(layout.importPath)})`,
          "      }"
        ].join("\n")).join(",\n"),
        "    ]",
        "  }"
      ].filter((line): line is string => line !== null);

      return routeLines.join("\n");
    }).join(",\n"),
    "];",
    "export { routes };",
    "export default routes;"
  ].join("\n");
}

export function generateRoutesModuleSource(options: GenerateRoutesModuleSourceOptions): string {
  const configuredRouteMap = new Map(
    options.configuredRoutes.map((route) => [options.normalizePath(route.filePath), route])
  );
  const routeEntries = createGeneratedRouteEntries(options, configuredRouteMap);
  return serializeGeneratedRouteEntries(routeEntries);
}