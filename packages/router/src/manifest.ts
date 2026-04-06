import { Debug } from "@terajs/shared";
import { parseSFC, type ParsedSFC } from "@terajs/sfc";
import {
  buildRouteFromSFC,
  type RouteDefinition,
  type RouteLayoutDefinition
} from "./builder";

export interface RouteSourceInput {
  filePath: string;
  source?: string;
  parsedSFC?: ParsedSFC;
  component?: () => Promise<unknown>;
}

function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function createComponentLoader(filePath: string): () => Promise<unknown> {
  return () => import(/* @vite-ignore */ filePath);
}

function getRouteRootInfo(filePath: string): {
  root: string;
  relativePath: string;
} {
  const normalized = normalizeFilePath(filePath);
  const match = normalized.match(/^(.*\/)(pages|routes)\/(.*)$/);

  if (!match) {
    return {
      root: "",
      relativePath: normalized
    };
  }

  return {
    root: `${match[1]}${match[2]}`,
    relativePath: match[3]
  };
}

function getRelativeDirectory(filePath: string): string {
  const { relativePath } = getRouteRootInfo(filePath);
  const normalized = normalizeFilePath(relativePath);
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? "" : normalized.slice(0, lastSlash);
}

function isLayoutFile(filePath: string): boolean {
  return /(^|\/)layout\.nbl$/i.test(normalizeFilePath(filePath));
}

function toLayoutId(filePath: string): string {
  const relativeDirectory = getRelativeDirectory(filePath);
  return relativeDirectory || "root";
}

function resolveLayouts(
  pageFilePath: string,
  layoutsByDirectory: Map<string, RouteLayoutDefinition>
): RouteLayoutDefinition[] {
  const relativeDirectory = getRelativeDirectory(pageFilePath);
  const segments = relativeDirectory ? relativeDirectory.split("/") : [];
  const layouts: RouteLayoutDefinition[] = [];

  for (let index = 0; index <= segments.length; index += 1) {
    const key = index === 0 ? "" : segments.slice(0, index).join("/");
    const layout = layoutsByDirectory.get(key);
    if (layout) {
      layouts.push(layout);
    }
  }

  return layouts;
}

function parseRouteSource(input: RouteSourceInput): ParsedSFC {
  if (input.parsedSFC) {
    return input.parsedSFC;
  }

  if (typeof input.source !== "string") {
    throw new Error(`Route source is missing SFC content for ${input.filePath}`);
  }

  return parseSFC(input.source, input.filePath);
}

export function buildRouteManifest(inputs: RouteSourceInput[]): RouteDefinition[] {
  const normalizedInputs = [...inputs].sort((left, right) =>
    normalizeFilePath(left.filePath).localeCompare(normalizeFilePath(right.filePath))
  );

  const layoutsByDirectory = new Map<string, RouteLayoutDefinition>();

  for (const input of normalizedInputs) {
    if (!isLayoutFile(input.filePath)) {
      continue;
    }

    layoutsByDirectory.set(getRelativeDirectory(input.filePath), {
      id: toLayoutId(input.filePath),
      filePath: input.filePath,
      component: input.component ?? createComponentLoader(input.filePath)
    });
  }

  const manifest = normalizedInputs
    .filter((input) => !isLayoutFile(input.filePath))
    .map((input) => {
      const parsedSFC = parseRouteSource(input);
      const route = buildRouteFromSFC(parsedSFC);

      return {
        ...route,
        component: input.component ?? route.component,
        layouts: resolveLayouts(input.filePath, layoutsByDirectory)
      };
    });

  const pathOwners = new Map<string, string>();
  for (const route of manifest) {
    const existing = pathOwners.get(route.path);
    if (existing) {
      Debug.emit("route:warn", {
        message: `Duplicate route path detected for ${route.path}`,
        path: route.path,
        firstFile: existing,
        duplicateFile: route.filePath
      });
      continue;
    }

    pathOwners.set(route.path, route.filePath);
  }

  return manifest;
}