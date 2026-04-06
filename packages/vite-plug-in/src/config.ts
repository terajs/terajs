import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { RouteConfigInput } from "@terajs/router-manifest";

const require = createRequire(import.meta.url);

interface TerajsUserConfig {
  autoImportDirs?: string[];
  routeDirs?: string[];
  routes?: Array<{
    file?: string;
    filePath?: string;
    path?: string;
    layout?: string;
    middleware?: string | string[];
    prerender?: boolean;
    hydrate?: RouteConfigInput["hydrate"];
    edge?: boolean;
  }>;
}

function readTerajsConfig(): TerajsUserConfig {
  const cwd = process.cwd();
  const configPath = path.resolve(cwd, "terajs.config.js");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  return (require(configPath) as TerajsUserConfig | undefined) ?? {};
}

export function getTerajsConfig(): TerajsUserConfig {
  return readTerajsConfig();
}

export function getAutoImportDirs(): string[] {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const defaultDirs = [path.resolve(cwd, "packages/devtools/src/components")];
  const configuredDirs = Array.isArray(config.autoImportDirs) ? config.autoImportDirs : [];

  if (configuredDirs.length === 0) {
    return defaultDirs;
  }

  return configuredDirs.map((dir) => path.resolve(cwd, dir));
}

export function getRouteDirs(): string[] {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const configuredDirs = Array.isArray(config.routeDirs) ? config.routeDirs : [];
  const defaultDirs = ["src/routes", "src/pages"];
  const dirs = configuredDirs.length > 0 ? configuredDirs : defaultDirs;

  return dirs
    .map((dir) => path.resolve(cwd, dir))
    .filter((dir, index, values) => fs.existsSync(dir) && values.indexOf(dir) === index);
}

export function getConfiguredRoutes(): RouteConfigInput[] {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const routes = Array.isArray(config.routes) ? config.routes : [];
  const configuredRoutes: RouteConfigInput[] = [];

  for (const route of routes) {
    if (route === null || typeof route !== "object") {
      continue;
    }

      const file = typeof route.file === "string"
        ? route.file
        : typeof route.filePath === "string"
        ? route.filePath
        : null;

      if (!file) {
        continue;
      }

      configuredRoutes.push({
        filePath: path.resolve(cwd, file),
        path: typeof route.path === "string" ? route.path : undefined,
        layout: typeof route.layout === "string" ? route.layout : undefined,
        middleware: Array.isArray(route.middleware)
          ? route.middleware.filter((value): value is string => typeof value === "string")
          : typeof route.middleware === "string"
          ? route.middleware
          : undefined,
        prerender: typeof route.prerender === "boolean" ? route.prerender : undefined,
        hydrate: typeof route.hydrate === "string" ? route.hydrate : undefined,
        edge: typeof route.edge === "boolean" ? route.edge : undefined
      });
  }

  return configuredRoutes;
}