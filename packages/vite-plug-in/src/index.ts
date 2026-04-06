/**
 * @file index.ts
 * @description
 * Vite plugin for Terajs SFC compilation + HMR.
 */

import fs from "node:fs";
import path from "node:path";
import { getAutoImportDirs } from "./autoImportDirs";
import { getConfiguredRoutes, getRouteDirs } from "./config";
import type { Plugin } from "vite";
import { parseSFC } from "@terajs/sfc";
import { sfcToComponent } from "@terajs/sfc";
import { Debug } from "@terajs/shared";

const AUTO_IMPORT_VIRTUAL_ID = "virtual:terajs-auto-imports";
const RESOLVED_AUTO_IMPORT_VIRTUAL_ID = `\0${AUTO_IMPORT_VIRTUAL_ID}`;
const ROUTES_VIRTUAL_ID = "virtual:terajs-routes";
const RESOLVED_ROUTES_VIRTUAL_ID = `\0${ROUTES_VIRTUAL_ID}`;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function toProjectImportPath(filePath: string): string {
  const relativePath = normalizePath(path.relative(process.cwd(), filePath));
  return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
}

function readNblFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readNblFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".nbl")) {
      files.push(fullPath);
    }
  }

  return files;
}

function terajsPlugin(): Plugin {
  // Support multiple auto-import roots
  const autoImportDirs = getAutoImportDirs();
  const routeDirs = getRouteDirs();
  const configuredRoutes = getConfiguredRoutes();

  function pascalCase(str: string) {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  function generateAutoImports() {
    let code = "";
    for (const dir of autoImportDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((fileName) => fileName.endsWith(".nbl"));
      for (const f of files) {
        const name = pascalCase(f.replace(/\.nbl$/, ""));
        const rel = "./" + f;
        code += `export { default as ${name} } from '${rel}';\n`;
      }
    }
    return code;
  }

  function generateRoutesModule() {
    const routeFiles = Array.from(new Set([
      ...routeDirs.flatMap((dir) => readNblFilesRecursively(dir)),
      ...configuredRoutes.map((route) => route.filePath)
    ])).sort();

    const routeSources = routeFiles.map((filePath) => {
      const importPath = toProjectImportPath(filePath);
      return `  {
    filePath: ${JSON.stringify(importPath)},
    source: ${JSON.stringify(fs.readFileSync(filePath, "utf8"))},
    component: () => import(${JSON.stringify(importPath)})
  }`;
    });

    const routeConfigs = configuredRoutes.map((routeConfig) => `  {
    filePath: ${JSON.stringify(toProjectImportPath(routeConfig.filePath))},
    ${routeConfig.path ? `path: ${JSON.stringify(routeConfig.path)},` : ""}
    ${routeConfig.layout ? `layout: ${JSON.stringify(routeConfig.layout)},` : ""}
    ${routeConfig.middleware ? `middleware: ${JSON.stringify(routeConfig.middleware)},` : ""}
    ${typeof routeConfig.prerender === "boolean" ? `prerender: ${JSON.stringify(routeConfig.prerender)},` : ""}
    ${routeConfig.hydrate ? `hydrate: ${JSON.stringify(routeConfig.hydrate)},` : ""}
    ${typeof routeConfig.edge === "boolean" ? `edge: ${JSON.stringify(routeConfig.edge)},` : ""}
  }`);

    return [
      `import { buildRouteManifest } from '@terajs/router-manifest';`,
      `const routeSources = [`,
      routeSources.join(",\n"),
      `];`,
      `const routeConfigs = [`,
      routeConfigs.join(",\n"),
      `];`,
      `export const routes = buildRouteManifest(routeSources, { routeConfigs });`,
      `export default routes;`
    ].join("\n");
  }

  function invalidateVirtualModule(server: { moduleGraph: { getModuleById(id: string): any; invalidateModule(mod: any): void; }; }, id: string) {
    const module = server.moduleGraph.getModuleById(id);
    if (module) {
      server.moduleGraph.invalidateModule(module);
    }
  }

  return {
    name: "terajs",
    enforce: "pre",

    resolveId(id) {
      if (id === AUTO_IMPORT_VIRTUAL_ID) return RESOLVED_AUTO_IMPORT_VIRTUAL_ID;
      if (id === ROUTES_VIRTUAL_ID) return RESOLVED_ROUTES_VIRTUAL_ID;
      if (id.endsWith(".nbl")) return id;
      return null;
    },

    load(id) {
      if (id === RESOLVED_AUTO_IMPORT_VIRTUAL_ID) {
        return generateAutoImports();
      }
      if (id === RESOLVED_ROUTES_VIRTUAL_ID) {
        return generateRoutesModule();
      }
      if (!id.endsWith(".nbl")) return null;

      const code = fs.readFileSync(id, "utf8");
      const sfc = parseSFC(code, id);

      Debug.emit("sfc:load", { scope: id });

      // Inject auto-imports at the top of every SFC
      const autoImport = `import * as TerajsAutoImports from '${AUTO_IMPORT_VIRTUAL_ID}';\n`;
      let compiled = sfcToComponent(sfc);
      compiled = autoImport + compiled;
      return compiled;
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith(".nbl")) return;

      const code = fs.readFileSync(ctx.file, "utf8");
      const sfc = parseSFC(code, ctx.file);

      Debug.emit("sfc:hmr", { scope: ctx.file });

      // Inject auto-imports at the top of every SFC
      const autoImport = `import * as TerajsAutoImports from '${AUTO_IMPORT_VIRTUAL_ID}';\n`;
      let newModule = sfcToComponent(sfc);
      newModule = autoImport + newModule;

      // Replace the module in Vite's graph
      const mod = ctx.server.moduleGraph.getModuleById(ctx.file)!;
      ctx.server.moduleGraph.invalidateModule(mod);

      const normalizedFile = normalizePath(ctx.file);
      if (normalizedFile.endsWith(".nbl")) {
        if (routeDirs.some((dir) => normalizedFile.startsWith(normalizePath(dir)))) {
          invalidateVirtualModule(ctx.server, RESOLVED_ROUTES_VIRTUAL_ID);
        }

        if (autoImportDirs.some((dir) => normalizedFile.startsWith(normalizePath(dir)))) {
          invalidateVirtualModule(ctx.server, RESOLVED_AUTO_IMPORT_VIRTUAL_ID);
        }
      }

      // Send updated code to the client
      ctx.read = () => newModule;

      // Tell Vite which modules should be reloaded
      return [mod];
    }
  };
}

export default terajsPlugin;
