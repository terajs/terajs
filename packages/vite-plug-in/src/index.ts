/**
 * @file index.ts
 * @description
 * Vite plugin for Terajs SFC compilation + HMR.
 */

import fs from "node:fs";
import path from "node:path";
import { getAutoImportDirs } from "./autoImportDirs.js";
import {
  APP_DEVTOOLS_SUBPATH,
  APP_FACADE_PACKAGE,
  resolveAppFacadeSpecifier
} from "./appFacade.js";
import {
  APP_BOOTSTRAP_VIRTUAL_ID,
  BUILD_BOOTSTRAP_FILE,
  generateAppBootstrapModule,
  RESOLVED_APP_BOOTSTRAP_VIRTUAL_ID
} from "./bootstrapEntry.js";
import {
  getConfiguredRoutes,
  getDevtoolsConfig,
  getRouteDirs,
  getRouterConfig,
  getSyncHubConfig
} from "./config.js";
import { compileSfcToComponent } from "./compileSfcToComponent.js";
import {
  createDevtoolsIdeBridgeMiddleware,
} from "./devtoolsIdeBridgeManifest.js";
import { injectAppBootstrapScript } from "./htmlBootstrap.js";
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
const APP_VIRTUAL_ID = "virtual:terajs-app";
const RESOLVED_APP_VIRTUAL_ID = `\0${APP_VIRTUAL_ID}`;
const DEV_APP_MODULE_PATH = `/@id/__x00__${APP_VIRTUAL_ID}`;
const DEFAULT_SERVER_FUNCTION_ENDPOINT = "/_terajs/server";

export interface TerajsVitePluginOptions {
  serverFunctions?: false | {
    endpoint?: string;
    context?: ServerFunctionRequestHandlerOptions["context"];
  };
  devtools?: false | {
    enabled?: boolean;
    startOpen?: boolean;
    lazyMount?: boolean;
    position?: "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center";
    panelShortcut?: string;
    visibilityShortcut?: string;
    ai?: {
      enabled?: boolean;
      endpoint?: string;
      model?: string;
      timeoutMs?: number;
    };
  };
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function stripQueryAndHash(id: string): string {
  const queryIndex = id.indexOf("?");
  const hashIndex = id.indexOf("#");
  const cutIndex = queryIndex === -1
    ? hashIndex
    : hashIndex === -1
      ? queryIndex
      : Math.min(queryIndex, hashIndex);

  if (cutIndex === -1) {
    return id;
  }

  return id.slice(0, cutIndex);
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function createVirtualErrorModule(moduleId: string, error: unknown): string {
  const message = describeError(error);

  return [
    `const __terajsVirtualModuleId = ${JSON.stringify(moduleId)};`,
    `const __terajsVirtualModuleMessage = ${JSON.stringify(message)};`,
    `export const __TERAJS_VIRTUAL_MODULE_ERROR__ = {`,
    `  id: __terajsVirtualModuleId,`,
    `  message: __terajsVirtualModuleMessage`,
    `};`,
    `console.error('[terajs/vite] Failed to load module', __TERAJS_VIRTUAL_MODULE_ERROR__);`,
    `throw new Error('[terajs/vite] Failed to load ' + __terajsVirtualModuleId + ': ' + __terajsVirtualModuleMessage);`
  ].join("\n");
}

function toProjectImportPath(filePath: string): string {
  const relativePath = normalizePath(path.relative(process.cwd(), filePath));
  return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
}

function toViteFsSpecifier(filePath: string): string {
  const normalized = normalizePath(filePath);
  return normalized.startsWith("/")
    ? `/@fs${normalized}`
    : `/@fs/${normalized}`;
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

interface MiddlewareModuleEntry {
  key: string;
  global: boolean;
  filePath: string;
}

function isMiddlewareSourceFile(filePath: string): boolean {
  return /\.(?:[cm]?ts|[cm]?js)$/i.test(filePath) && !filePath.toLowerCase().endsWith(".d.ts");
}

function readMiddlewareFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readMiddlewareFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile() && isMiddlewareSourceFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function createMiddlewareModuleEntry(filePath: string, middlewareDir: string): MiddlewareModuleEntry {
  const relativePath = normalizePath(path.relative(middlewareDir, filePath));
  const withoutExtension = relativePath.replace(/\.(?:[cm]?ts|[cm]?js)$/i, "");
  const global = withoutExtension.endsWith(".global");
  const key = (global ? withoutExtension.slice(0, -".global".length) : withoutExtension).trim();

  return {
    key,
    global,
    filePath
  };
}

function getManifestAssetPath(
  filePath: string,
  manifest?: Record<string, any>
): string | undefined {
  if (!manifest) {
    return undefined;
  }

  const relativePath = normalizePath(path.relative(process.cwd(), filePath));
  const keys = [relativePath];
  if (!relativePath.startsWith("./")) {
    keys.push(`./${relativePath}`);
  }
  if (!relativePath.startsWith("/")) {
    keys.push(`/${relativePath}`);
  }

  for (const key of keys) {
    const entry = manifest[key];
    if (entry && typeof entry === "object") {
      const asset = entry.file ?? entry.src;
      if (typeof asset === "string") {
        return asset;
      }
    }
  }

  return undefined;
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
  const routerConfig = getRouterConfig();
  const configuredDevtools = getDevtoolsConfig();
  const devtoolsOptions = options.devtools;
  const devtoolsConfig = devtoolsOptions === false
    ? { ...configuredDevtools, enabled: false }
    : {
      ...configuredDevtools,
      ...(devtoolsOptions ?? {})
    };
  const syncHubConfig = getSyncHubConfig();
  const serverFunctionOptions = options.serverFunctions === false
    ? false
    : options.serverFunctions ?? {};

  let config: any;
  let manifest: Record<string, any> | undefined;

  function resolveRuntimeSpecifier(specifier: string): string {
    return resolveAppFacadeSpecifier(specifier, config?.command);
  }

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
      ...routeDirs.flatMap((dir) => {
        if (!fs.existsSync(dir)) {
          return [];
        }

        return readTeraFilesRecursively(dir);
      }),
      ...configuredRoutes.map((route) => route.filePath)
    ])).sort();

    const routeSources = routeFiles.map((filePath) => {
      const importPath = toProjectImportPath(filePath);
      const assetPath = getManifestAssetPath(filePath, manifest);
      return `  {
    filePath: ${JSON.stringify(importPath)},
    source: ${JSON.stringify(fs.readFileSync(filePath, "utf8"))},
    component: () => import(${JSON.stringify(importPath)})${assetPath ? `,
    asset: ${JSON.stringify(assetPath)}` : ""}
  }`;
    });

    const routeConfigs = configuredRoutes.map((routeConfig) => `  {
    filePath: ${JSON.stringify(toProjectImportPath(routeConfig.filePath))},
    ${routeConfig.path ? `path: ${JSON.stringify(routeConfig.path)},` : ""}
    ${routeConfig.layout ? `layout: ${JSON.stringify(routeConfig.layout)},` : ""}
    ${routeConfig.mountTarget ? `mountTarget: ${JSON.stringify(routeConfig.mountTarget)},` : ""}
    ${routeConfig.middleware ? `middleware: ${JSON.stringify(routeConfig.middleware)},` : ""}
    ${typeof routeConfig.prerender === "boolean" ? `prerender: ${JSON.stringify(routeConfig.prerender)},` : ""}
    ${routeConfig.hydrate ? `hydrate: ${JSON.stringify(routeConfig.hydrate)},` : ""}
    ${typeof routeConfig.edge === "boolean" ? `edge: ${JSON.stringify(routeConfig.edge)},` : ""}
  }`);

    const runtimeSpecifier = resolveRuntimeSpecifier(APP_FACADE_PACKAGE);

    return [
      `import { buildRouteManifest } from '${runtimeSpecifier}';`,
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

  function resolveMiddlewareModules(): {
    modules: MiddlewareModuleEntry[];
    globalKeys: string[];
  } {
    const middlewareDir = routerConfig.middlewareDir;
    if (!fs.existsSync(middlewareDir)) {
      return {
        modules: [],
        globalKeys: []
      };
    }

    const discovered = readMiddlewareFilesRecursively(middlewareDir)
      .sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)))
      .map((filePath) => createMiddlewareModuleEntry(filePath, middlewareDir));

    const modules: MiddlewareModuleEntry[] = [];
    const keys = new Map<string, string>();

    for (const entry of discovered) {
      if (!entry.key) {
        throw new Error(`Invalid middleware file name: ${entry.filePath}`);
      }

      const existing = keys.get(entry.key);
      if (existing) {
        throw new Error(
          `Duplicate middleware key '${entry.key}' found in ${existing} and ${entry.filePath}`
        );
      }

      keys.set(entry.key, entry.filePath);
      modules.push(entry);
    }

    return {
      modules,
      globalKeys: modules.filter((entry) => entry.global).map((entry) => entry.key)
    };
  }

  function generateAppModule() {
    const middlewareModules = resolveMiddlewareModules();
    const middlewareImports = middlewareModules.modules.map(
      (entry, index) => `import * as middlewareModule${index} from '${toProjectImportPath(entry.filePath)}';`
    );
    const middlewareEntries = middlewareModules.modules.map(
      (entry, index) => `  ${JSON.stringify(entry.key)}: resolveMiddlewareGuard(${JSON.stringify(entry.key)}, middlewareModule${index})`
    );
    const hubFactoryMap: Record<string, { importName: string; moduleName: string }> = {
      signalr: {
        importName: "createSignalRHubTransport",
        moduleName: "@terajs/hub-signalr"
      },
      "socket.io": {
        importName: "createSocketIoHubTransport",
        moduleName: "@terajs/hub-socketio"
      },
      websockets: {
        importName: "createWebSocketHubTransport",
        moduleName: "@terajs/hub-websockets"
      }
    };
    const selectedHubFactory = syncHubConfig
      ? hubFactoryMap[syncHubConfig.type]
      : null;

    if (syncHubConfig && !selectedHubFactory) {
      throw new Error(`Unsupported sync.hub.type: ${syncHubConfig.type}`);
    }

    const hubImports = selectedHubFactory
      ? [`import { ${selectedHubFactory.importName} } from '${selectedHubFactory.moduleName}';`]
      : [];
    const hubBootstrap = selectedHubFactory
      ? [
        `async function initializeHubTransport() {`,
        `  if (!HUB_CONFIG) {`,
        `    return;`,
        `  }`,
        `  hubTransport = await ${selectedHubFactory.importName}({`,
        `    url: HUB_CONFIG.url,`,
        `    autoConnect: HUB_CONFIG.autoConnect,`,
        `    retryPolicy: HUB_CONFIG.retryPolicy`,
        `  });`,
        `  hubTransport.subscribe((message) => {`,
        `    if (message.type === 'invalidate' && Array.isArray(message.keys) && message.keys.length > 0) {`,
        `      void invalidateResources(message.keys);`,
        `    }`,
        `  });`,
        `  setServerFunctionTransport(hubTransport);`,
        `}`
      ]
      : [
        `async function initializeHubTransport() {`,
        `  return;`,
        `}`
      ];

    const resolvedDevtoolsConfig = {
      enabled: (config?.command ?? "serve") !== "build" && devtoolsConfig.enabled,
      startOpen: devtoolsConfig.startOpen,
      lazyMount: devtoolsConfig.lazyMount,
      position: devtoolsConfig.position,
      panelShortcut: devtoolsConfig.panelShortcut,
      visibilityShortcut: devtoolsConfig.visibilityShortcut,
      ai: {
        enabled: devtoolsConfig.ai.enabled,
        endpoint: devtoolsConfig.ai.endpoint,
        model: devtoolsConfig.ai.model,
        timeoutMs: devtoolsConfig.ai.timeoutMs
      }
    };

    const shouldEmitDevtoolsBootstrap = resolvedDevtoolsConfig.enabled;
    const devtoolsBootstrap = shouldEmitDevtoolsBootstrap
      ? [
        `async function initializeDevtoolsOverlay() {`,
        `  if (!DEVTOOLS_CONFIG.enabled || typeof document === 'undefined') {`,
        `    return;`,
        `  }`,
        `  try {`,
        `    const { mountDevtoolsOverlay } = await import('${resolveRuntimeSpecifier(APP_DEVTOOLS_SUBPATH)}');`,
        `    const existingDevtoolsHost = document.getElementById('terajs-overlay-container');`,
        `    if (globalThis.__TERAJS_DEVTOOLS_MOUNTED__ && !existingDevtoolsHost) {`,
        `      globalThis.__TERAJS_DEVTOOLS_MOUNTED__ = false;`,
        `    }`,
        `    if (globalThis.__TERAJS_DEVTOOLS_MOUNTED__ && existingDevtoolsHost) {`,
        `      return;`,
        `    }`,
        `    if (typeof mountDevtoolsOverlay === 'function') {`,
        `      mountDevtoolsOverlay({`,
        `        startOpen: DEVTOOLS_CONFIG.startOpen,`,
        `        lazyMount: DEVTOOLS_CONFIG.lazyMount,`,
        `        position: DEVTOOLS_CONFIG.position,`,
        `        panelShortcut: DEVTOOLS_CONFIG.panelShortcut,`,
        `        visibilityShortcut: DEVTOOLS_CONFIG.visibilityShortcut,`,
        `        ai: {`,
        `          enabled: DEVTOOLS_CONFIG.ai?.enabled,`,
        `          endpoint: DEVTOOLS_CONFIG.ai?.endpoint,`,
        `          model: DEVTOOLS_CONFIG.ai?.model,`,
        `          timeoutMs: DEVTOOLS_CONFIG.ai?.timeoutMs`,
        `        }`,
        `      });`,
        `      globalThis.__TERAJS_DEVTOOLS_MOUNTED__ = true;`,
        `    }`,
        `  } catch (error) {`,
        `    console.warn('[terajs] Devtools overlay unavailable in this environment.', error);`,
        `  }`,
        `}`
      ]
      : [];

    const runtimeSpecifier = resolveRuntimeSpecifier(APP_FACADE_PACKAGE);

    return [
      `import { createBrowserHistory, createRouter } from '${runtimeSpecifier}';`,
      `import { createRouteView, mount } from '${runtimeSpecifier}';`,
      `import { component, invalidateResources, onCleanup, onMounted, setServerFunctionTransport } from '${runtimeSpecifier}';`,
      `import { routes } from '${ROUTES_VIRTUAL_ID}';`,
      ...middlewareImports,
      ...hubImports,
      `const ROOT_TARGET_ID = ${JSON.stringify(routerConfig.rootTarget)};`,
      `const GLOBAL_MIDDLEWARE = ${JSON.stringify(middlewareModules.globalKeys)};`,
      `const HUB_CONFIG = ${JSON.stringify(syncHubConfig)};`,
      `const DEVTOOLS_CONFIG = ${JSON.stringify(resolvedDevtoolsConfig)};`,
      `const MOUNT_TARGET_PATTERN = /^[A-Za-z][\\w:-]*$/;`,
      `let hubTransport = null;`,
      `let appMounted = false;`,
      `function resolveMiddlewareGuard(name, moduleRecord) {`,
      `  const candidate = moduleRecord.default ?? moduleRecord.middleware;`,
      `  if (typeof candidate !== 'function') {`,
      `    throw new Error(\`Router middleware "\${name}" must export a default function (or named "middleware").\`);`,
      `  }`,
      `  return candidate;`,
      `}`,
      `const middleware = {`,
      middlewareEntries.join(",\n"),
      `};`,
      `function applyGlobalMiddleware(routeList) {`,
      `  if (GLOBAL_MIDDLEWARE.length === 0) {`,
      `    return routeList;`,
      `  }`,
      `  return routeList.map((route) => {`,
      `    const routeMiddleware = Array.isArray(route.middleware) ? route.middleware : [];`,
      `    const merged = Array.from(new Set([...GLOBAL_MIDDLEWARE, ...routeMiddleware]));`,
      `    if (merged.length === routeMiddleware.length && merged.every((value, index) => value === routeMiddleware[index])) {`,
      `      return route;`,
      `    }`,
      `    return { ...route, middleware: merged };`,
      `  });`,
      `}`,
      `function normalizeMountTargetId(value) {`,
      `  if (typeof value !== 'string') {`,
      `    return ROOT_TARGET_ID;`,
      `  }`,
      `  const trimmed = value.trim();`,
      `  if (!MOUNT_TARGET_PATTERN.test(trimmed)) {`,
      `    return ROOT_TARGET_ID;`,
      `  }`,
      `  return trimmed;`,
      `}`,
      `function ensureMountTarget(targetId) {`,
      `  if (typeof document === 'undefined') {`,
      `    return null;`,
      `  }`,
      `  const existing = document.getElementById(targetId);`,
      `  if (existing) {`,
      `    return existing;`,
      `  }`,
      `  const root = document.createElement('div');`,
      `  root.id = targetId;`,
      `  (document.body ?? document.documentElement).appendChild(root);`,
      `  return root;`,
      `}`,
      `function resolveMatchTargetId(match) {`,
      `  const routeTarget = match?.route?.mountTarget;`,
      `  return normalizeMountTargetId(routeTarget);`,
      `}`,
      ...hubBootstrap,
      ...devtoolsBootstrap,
      `const routed = applyGlobalMiddleware(routes);`,
      `export const router = createRouter(routed, { history: createBrowserHistory(), middleware });`,
      `const routeView = createRouteView(router, {`,
      `  autoStart: false,`,
      `  keepPreviousDuringLoading: ${routerConfig.keepPreviousDuringLoading},`,
      `  applyMeta: ${routerConfig.applyMeta}`,
      `});`,
      `const routeViewNode = routeView();`,
      `const App = component({ name: 'TerajsAppShell' }, () => {`,
      `  onMounted(() => {`,
      `    if (typeof document === 'undefined') {`,
      `      return;`,
      `    }`,
      `    let activeTargetId = null;`,
      `    const moveRouteView = (match) => {`,
      `      if (!(routeViewNode instanceof Node)) {`,
      `        return;`,
      `      }`,
      `      const targetId = resolveMatchTargetId(match);`,
      `      if (targetId === activeTargetId) {`,
      `        return;`,
      `      }`,
      `      const target = ensureMountTarget(targetId);`,
      `      if (!target) {`,
      `        return;`,
      `      }`,
      `      target.replaceChildren(routeViewNode);`,
      `      activeTargetId = targetId;`,
      `    };`,
      `    const onClick = (event) => {`,
      `      const target = event.target;`,
      `      const link = target instanceof Element ? target.closest('a[href]') : null;`,
      `      if (!link) {`,
      `        return;`,
      `      }`,
      `      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {`,
      `        return;`,
      `      }`,
      `      if (link.target === '_blank' || link.hasAttribute('download')) {`,
      `        return;`,
      `      }`,
      `      const href = link.getAttribute('href');`,
      `      if (!href || !href.startsWith('/')) {`,
      `        return;`,
      `      }`,
      `      event.preventDefault();`,
      `      void router.navigate(href);`,
      `    };`,
      `    void initializeHubTransport().catch((error) => {`,
      `      console.error('[terajs] sync.hub initialization failed', error);`,
      `    });`,
      ...(shouldEmitDevtoolsBootstrap ? [`    void initializeDevtoolsOverlay();`] : []),
      `    const unsubscribe = router.subscribe((match) => {`,
      `      moveRouteView(match);`,
      `    });`,
      `    moveRouteView(router.getCurrentRoute());`,
      `    void router.start().then(() => {`,
      `      moveRouteView(router.getCurrentRoute());`,
      `    });`,
      `    document.addEventListener('click', onClick);`,
      `    onCleanup(() => {`,
      `      unsubscribe();`,
      `      if (hubTransport && typeof hubTransport.disconnect === 'function') {`,
      `        void hubTransport.disconnect();`,
      `      }`,
      `      document.removeEventListener('click', onClick);`,
      `    });`,
      `  });`,
      `  return () => routeViewNode;`,
      `});`,
      `export function bootstrapTerajsApp() {`,
      `  if (typeof document === 'undefined' || appMounted) {`,
      `    return;`,
      `  }`,
      `  mount(App, { defaultId: ROOT_TARGET_ID });`,
      `  appMounted = true;`,
      `}`,
      `export default App;`
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

    buildStart() {
      if ((config?.command ?? "serve") !== "build") {
        return;
      }

      this.emitFile({
        type: "chunk",
        id: APP_BOOTSTRAP_VIRTUAL_ID,
        fileName: BUILD_BOOTSTRAP_FILE,
        name: "terajs-bootstrap"
      });
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
      const rootDir = config?.root ?? process.cwd();
      server.middlewares.use(createDevtoolsIdeBridgeMiddleware(rootDir));

      if (serverFunctionOptions === false) {
        return;
      }

      server.middlewares.use(createServerFunctionMiddleware(serverFunctionOptions));
    },

    transformIndexHtml(html) {
      if (typeof html !== "string") {
        return html;
      }

      return injectAppBootstrapScript(html, {
        command: config?.command,
        base: config?.base
      });
    },

    resolveId(id) {
      if (id === AUTO_IMPORT_VIRTUAL_ID) return RESOLVED_AUTO_IMPORT_VIRTUAL_ID;
      if (id === ROUTES_VIRTUAL_ID) return RESOLVED_ROUTES_VIRTUAL_ID;
      if (id === APP_VIRTUAL_ID) return RESOLVED_APP_VIRTUAL_ID;
      if (id === APP_BOOTSTRAP_VIRTUAL_ID) return RESOLVED_APP_BOOTSTRAP_VIRTUAL_ID;
      return null;
    },

    load(id) {
      const normalizedId = stripQueryAndHash(id);

      if (normalizedId === RESOLVED_AUTO_IMPORT_VIRTUAL_ID) {
        try {
          return generateAutoImports();
        } catch (error) {
          return createVirtualErrorModule(normalizedId, error);
        }
      }
      if (normalizedId === RESOLVED_ROUTES_VIRTUAL_ID) {
        try {
          if (config?.command === "build" && !manifest) {
            const rootDir = config?.root ?? process.cwd();
            const outDir = config?.build?.outDir ?? "dist";
            manifest = readBuildManifest(rootDir, outDir);
          }

          return generateRoutesModule();
        } catch (error) {
          return createVirtualErrorModule(normalizedId, error);
        }
      }
      if (normalizedId === RESOLVED_APP_BOOTSTRAP_VIRTUAL_ID) {
        try {
          return generateAppBootstrapModule(APP_VIRTUAL_ID);
        } catch (error) {
          return createVirtualErrorModule(normalizedId, error);
        }
      }
      if (normalizedId === RESOLVED_APP_VIRTUAL_ID) {
        try {
          return generateAppModule();
        } catch (error) {
          return createVirtualErrorModule(normalizedId, error);
        }
      }
      if (!normalizedId.endsWith(".tera")) return null;

      try {
        const code = fs.readFileSync(normalizedId, "utf8");
        const sfc = parseSFC(code, normalizedId);

        Debug.emit("sfc:load", { scope: normalizedId });

        // Inject auto-imports at the top of every SFC
        const autoImport = `import * as TerajsAutoImports from '${AUTO_IMPORT_VIRTUAL_ID}';\n`;
        let compiled = compileSfcToComponent(sfc);
        compiled = autoImport + compiled;
        return compiled;
      } catch (error) {
        return createVirtualErrorModule(normalizedId, error);
      }
    },

    handleHotUpdate(ctx) {
      const normalizedFile = normalizePath(ctx.file);
      const normalizedMiddlewareDir = normalizePath(routerConfig.middlewareDir);

      if (
        isMiddlewareSourceFile(normalizedFile) &&
        normalizedFile.startsWith(normalizedMiddlewareDir)
      ) {
        invalidateVirtualModule(ctx.server, RESOLVED_APP_VIRTUAL_ID);
        return;
      }

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

      if (normalizedFile.endsWith(".tera")) {
        if (routeDirs.some((dir) => normalizedFile.startsWith(normalizePath(dir)))) {
          invalidateVirtualModule(ctx.server, RESOLVED_ROUTES_VIRTUAL_ID);
          invalidateVirtualModule(ctx.server, RESOLVED_APP_VIRTUAL_ID);
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
