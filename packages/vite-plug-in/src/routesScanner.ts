import path from "node:path";
import type { RouteDefinition } from "@terajs/router";

function normalizeFilePath(file: string): string {
  return file.replace(/\\/g, "/");
}

function stripExtension(file: string): string {
  return file.replace(/\.(?:tera|tsx?|jsx?|js)$/i, "");
}

function segmentToPath(segment: string): string {
  if (segment === "index") {
    return "";
  }
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return `:${segment.slice(1, -1)}`;
  }
  return segment;
}

function sortSegments(a: string, b: string): number {
  const isIndexA = a === "";
  const isIndexB = b === "";
  if (isIndexA !== isIndexB) return isIndexA ? -1 : 1;

  const isDynamicA = a.startsWith(":");
  const isDynamicB = b.startsWith(":");
  if (isDynamicA !== isDynamicB) return isDynamicA ? 1 : -1;

  return a.localeCompare(b);
}

interface RouteNode {
  name: string;
  children: Map<string, RouteNode>;
  routeFile?: string;
  layoutFile?: string;
}

export interface RouteConfigInput {
  filePath: string;
  path?: string;
  layout?: string;
  middleware?: string | string[];
  prerender?: boolean;
  hydrate?: string;
  edge?: boolean;
}

function createNode(name: string): RouteNode {
  return {
    name,
    children: new Map(),
    routeFile: undefined,
    layoutFile: undefined
  };
}

function stripRouteRoot(file: string): string {
  const normalized = normalizeFilePath(file);
  const match = normalized.match(/^(.*\/)(pages|routes)\/(.*)$/);
  if (!match) {
    return normalized;
  }
  return match[3];
}

function buildRouteTree(files: string[]): RouteNode {
  const root = createNode("");

  for (const rawFile of files) {
    const file = normalizeFilePath(rawFile);
    const routeSource = stripRouteRoot(file);
    const parts = routeSource.split("/");
    const fileName = parts.pop()!;
    const dir = parts;
    let node = root;

    for (const segment of dir) {
      if (!node.children.has(segment)) {
        node.children.set(segment, createNode(segment));
      }
      node = node.children.get(segment)!;
    }

    if (fileName.toLowerCase() === "layout.tsx" || fileName.toLowerCase() === "layout.tera") {
      node.layoutFile = file;
      continue;
    }

    if (!node.children.has(fileName)) {
      node.children.set(fileName, createNode(fileName));
    }

    node = node.children.get(fileName)!;
    node.routeFile = file;
  }

  return root;
}

function buildPathFromNode(ancestors: RouteNode[], node: RouteNode): string {
  const segments = [...ancestors, node]
    .filter((n) => n.name !== "")
    .map((n) => segmentToPath(stripExtension(n.name)));

  const path = segments
    .filter((segment) => segment !== "")
    .join("/");

  return path === "" ? "/" : `/${path}`;
}

function createImportPath(filePath: string): string {
  let normalized = normalizeFilePath(filePath);

  if (path.isAbsolute(normalized)) {
    const cwd = normalizeFilePath(process.cwd());
    normalized = path.posix.relative(cwd, normalized);
  }

  if (!normalized.startsWith(".") && !normalized.startsWith("/")) {
    normalized = `./${normalized}`;
  }

  if (normalized.startsWith("/")) {
    normalized = `.${normalized}`;
  }

  return normalized;
}

function createRouteFilePath(filePath: string): string {
  let normalized = normalizeFilePath(filePath);
  if (path.isAbsolute(normalized)) {
    const cwd = normalizeFilePath(process.cwd());
    normalized = path.posix.relative(cwd, normalized);
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

function normalizeConfigFilePath(filePath: string): string {
  const normalized = normalizeFilePath(path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath));
  return normalized;
}

function getManifestKeys(filePath: string): string[] {
  const relativePath = normalizeFilePath(path.relative(process.cwd(), filePath));
  const candidates = [relativePath];

  if (!relativePath.startsWith("./")) {
    candidates.push(`./${relativePath}`);
  }
  if (!relativePath.startsWith("/")) {
    candidates.push(`/${relativePath}`);
  }

  return candidates;
}

function getAssetPath(filePath: string, manifest?: Record<string, any>): string | undefined {
  if (!manifest) {
    return undefined;
  }

  for (const key of getManifestKeys(filePath)) {
    const entry = manifest[key];
    if (entry && typeof entry === "object") {
      return entry.file ?? entry.src;
    }
  }

  return undefined;
}

function generateRoutesFromNode(
  node: RouteNode,
  ancestors: RouteNode[] = [],
  inheritedLayout?: string,
  manifest?: Record<string, any>,
  routeConfigMap: Map<string, RouteConfigInput> = new Map()
): string[] {
  const entries: string[] = [];
  let routePath = buildPathFromNode(ancestors, node);
  const layoutImport = node.layoutFile ? createImportPath(node.layoutFile) : inheritedLayout;
  const override = node.routeFile ? routeConfigMap.get(normalizeConfigFilePath(node.routeFile)) : undefined;

  if (override?.path) {
    routePath = override.path;
  }

  if (node.routeFile) {
    const route: Record<string, string> = {
      path: routePath,
      filePath: createRouteFilePath(node.routeFile),
      component: `import(${JSON.stringify(createImportPath(node.routeFile))})`
    };

    const assetPath = getAssetPath(node.routeFile, manifest);
    if (assetPath) {
      route.asset = JSON.stringify(assetPath);
    }

    if (override?.layout) {
      route.layout = JSON.stringify(override.layout);
    } else if (layoutImport) {
      route.layout = `import(${JSON.stringify(layoutImport)})`;
    }

    if (override?.middleware) {
      route.middleware = JSON.stringify(
        Array.isArray(override.middleware) ? override.middleware : [override.middleware]
      );
    }
    if (override?.prerender !== undefined) {
      route.prerender = JSON.stringify(override.prerender);
    }
    if (override?.hydrate !== undefined) {
      route.hydrate = JSON.stringify(override.hydrate);
    }
    if (override?.edge !== undefined) {
      route.edge = JSON.stringify(override.edge);
    }

    entries.push(
      `{
        path: ${JSON.stringify(route.path)},
        filePath: ${JSON.stringify(route.filePath)},
        component: ${route.component}${route.layout ? `,
        layout: ${route.layout}` : ""}${route.asset ? `,
        asset: ${route.asset}` : ""}${route.middleware ? `,
        middleware: ${route.middleware}` : ""}${route.prerender ? `,
        prerender: ${route.prerender}` : ""}${route.hydrate ? `,
        hydrate: ${route.hydrate}` : ""}${route.edge ? `,
        edge: ${route.edge}` : ""}
      }`
    );
  }

  const children = Array.from(node.children.values()).sort((a, b) => {
    const aName = a.name === "index" ? "" : a.name;
    const bName = b.name === "index" ? "" : b.name;
    return sortSegments(aName, bName);
  });

  for (const child of children) {
    entries.push(...generateRoutesFromNode(child, [...ancestors, node], layoutImport, manifest, routeConfigMap));
  }

  return entries;
}

export function generateRouteConfig(files: string[]): string {
  return generateRouteConfigWithAssets(files);
}

export function generateRouteConfigWithAssets(
  files: string[],
  manifest?: Record<string, any>,
  routeConfigs: RouteConfigInput[] = []
): string {
  const tree = buildRouteTree(files);
  const configMap = new Map<string, RouteConfigInput>();

  for (const routeConfig of routeConfigs) {
    configMap.set(normalizeConfigFilePath(routeConfig.filePath), routeConfig);
  }

  const routeEntries = generateRoutesFromNode(tree, [], undefined, manifest, configMap);

  return `export const routes = [\n${routeEntries.join(",\n")}\n];\n`;
}
