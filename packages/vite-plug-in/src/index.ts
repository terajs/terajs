/**
 * @file index.ts
 * @description
 * Vite plugin for Terajs SFC compilation + HMR.
 */

import fs from "node:fs";
import path from "node:path";
import { getAutoImportDirs } from "./autoImportDirs.js";
import { getConfiguredRoutes, getRouteDirs } from "./config.js";
import { compileSfcToComponent } from "./compileSfcToComponent.js";
import { generateRouteConfigWithAssets } from "./routesScanner.js";
import type { Plugin } from "vite";
import { parseSFC } from "@terajs/sfc";
import { Debug } from "@terajs/shared";
import {
  createServerFunctionRequestHandler,
  type ServerFunctionRequestHandlerOptions
} from "@terajs/runtime";

const AUTO_IMPORT_VIRTUAL_ID = "virtual:terajs-auto-imports";
const RESOLVED_AUTO_IMPORT_VIRTUAL_ID = `\0${AUTO_IMPORT_VIRTUAL_ID}`;
const ROUTES_VIRTUAL_ID = "virtual:terajs-routes";
const RESOLVED_ROUTES_VIRTUAL_ID = `\0${ROUTES_VIRTUAL_ID}`;
const DEFAULT_SERVER_FUNCTION_ENDPOINT = "/_terajs/server";

export interface TerajsVitePluginOptions {
  serverFunctions?: false | {
    endpoint?: string;
    context?: ServerFunctionRequestHandlerOptions["context"];
  };
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function toProjectImportPath(filePath: string): string {
  const relativePath = normalizePath(path.relative(process.cwd(), filePath));
  return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
}

function readTeraFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readTeraFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tera")) {
      files.push(fullPath);
    }
  }

  return files;
}

function readBuildManifest(root: string, outDir: string): Record<string, any> | undefined {
  const manifestPath = path.resolve(root, outDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return undefined;
  }
}

async function readRequestBody(stream: NodeJS.ReadableStream): Promise<string | undefined> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks).toString("utf8");
}

function toRequestUrl(req: { url?: string; headers: { host?: string | string[] } }): string {
  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  return new URL(req.url ?? "/", `http://${host ?? "localhost"}`).toString();
}

async function toWebRequest(req: {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
} & NodeJS.ReadableStream): Promise<Request> {
  const method = req.method ?? "GET";
  const body = method === "GET" || method === "HEAD"
    ? undefined
    : await readRequestBody(req);

  return new Request(toRequestUrl(req), {
    method,
    headers: req.headers as HeadersInit,
    body
  });
}

async function sendWebResponse(
  res: {
    statusCode?: number;
    setHeader(name: string, value: string | string[]): void;
    end(chunk?: any): void;
  },
  response: Response
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

function createServerFunctionMiddleware(options: Exclude<TerajsVitePluginOptions["serverFunctions"], false | undefined>) {
  const endpoint = options.endpoint ?? DEFAULT_SERVER_FUNCTION_ENDPOINT;
  const handler = createServerFunctionRequestHandler({
    context: options.context
  });

  return async (
    req: {
      method?: string;
      url?: string;
      headers: Record<string, string | string[] | undefined>;
    } & NodeJS.ReadableStream,
    res: {
      statusCode?: number;
      setHeader(name: string, value: string | string[]): void;
      end(chunk?: any): void;
    },
    next: () => void
  ): Promise<void> => {
    const pathname = new URL(toRequestUrl(req)).pathname;
    if (pathname !== endpoint) {
      next();
      return;
    }

    const request = await toWebRequest(req);
    const response = await handler(request);
    await sendWebResponse(res, response);
  };
}

function terajsPlugin(options: TerajsVitePluginOptions = {}): Plugin {
  // Support multiple auto-import roots
  const autoImportDirs = getAutoImportDirs();
  const routeDirs = getRouteDirs();
  const configuredRoutes = getConfiguredRoutes();
  const serverFunctionOptions = options.serverFunctions === false
    ? false
    : options.serverFunctions ?? {};

  let config: any;
  let manifest: Record<string, any> | undefined;

  function pascalCase(str: string) {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  function generateAutoImports() {
    let code = "";
    for (const dir of autoImportDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((fileName) => fileName.endsWith(".tera"));
      for (const f of files) {
        const name = pascalCase(f.replace(/\.tera$/, ""));
        const importPath = toProjectImportPath(path.join(dir, f));
        code += `export { default as ${name} } from '${importPath}';\n`;
      }
    }
    return code;
  }

  function generateRoutesModule() {
    const routeFiles = Array.from(new Set([
      ...routeDirs.flatMap((dir) => readTeraFilesRecursively(dir)),
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

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async writeBundle() {
      if (!config?.build?.manifest) {
        return;
      }

      const rootDir = config?.root ?? process.cwd();
      const outDir = config?.build?.outDir ?? "dist";
      manifest = readBuildManifest(rootDir, outDir);
    },

    configureServer(server) {
      if (serverFunctionOptions === false) {
        return;
      }

      server.middlewares.use(createServerFunctionMiddleware(serverFunctionOptions));
    },

    resolveId(id) {
      if (id === AUTO_IMPORT_VIRTUAL_ID) return RESOLVED_AUTO_IMPORT_VIRTUAL_ID;
      if (id === ROUTES_VIRTUAL_ID) return RESOLVED_ROUTES_VIRTUAL_ID;
      return null;
    },

    load(id) {
      if (id === RESOLVED_AUTO_IMPORT_VIRTUAL_ID) {
        return generateAutoImports();
      }
      if (id === RESOLVED_ROUTES_VIRTUAL_ID) {
        const routeFiles = Array.from(new Set([
          ...routeDirs.flatMap((dir) => readTeraFilesRecursively(dir)),
          ...configuredRoutes.map((route) => route.filePath)
        ])).sort();

        if (config?.command === "build" && !manifest) {
          const rootDir = config?.root ?? process.cwd();
          const outDir = config?.build?.outDir ?? "dist";
          manifest = readBuildManifest(rootDir, outDir);
        }

        return generateRouteConfigWithAssets(routeFiles, manifest, configuredRoutes);
      }
      if (!id.endsWith(".tera")) return null;

      const code = fs.readFileSync(id, "utf8");
      const sfc = parseSFC(code, id);

      Debug.emit("sfc:load", { scope: id });

      // Inject auto-imports at the top of every SFC
      const autoImport = `import * as TerajsAutoImports from '${AUTO_IMPORT_VIRTUAL_ID}';\n`;
      let compiled = compileSfcToComponent(sfc);
      compiled = autoImport + compiled;
      return compiled;
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith(".tera")) return;

      const code = fs.readFileSync(ctx.file, "utf8");
      const sfc = parseSFC(code, ctx.file);

      Debug.emit("sfc:hmr", { scope: ctx.file });

      // Inject auto-imports at the top of every SFC
      const autoImport = `import * as TerajsAutoImports from '${AUTO_IMPORT_VIRTUAL_ID}';\n`;
      let newModule = compileSfcToComponent(sfc);
      newModule = autoImport + newModule;

      // Replace the module in Vite's graph
      const mod = ctx.server.moduleGraph.getModuleById(ctx.file)!;
      ctx.server.moduleGraph.invalidateModule(mod);

      const normalizedFile = normalizePath(ctx.file);
      if (normalizedFile.endsWith(".tera")) {
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
