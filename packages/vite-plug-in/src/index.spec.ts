import { describe, it, expect, vi, beforeAll } from "vitest";
import type { HmrContext, Plugin } from "vite";
import { server } from "@terajs/runtime";
import { setRuntimeMode } from "@terajs/reactivity";
import fs from "fs";
import path from "node:path";
import { Readable } from "node:stream";

vi.mock("./config", () => ({
  __esModule: true,
  getAutoImportDirs: () => [path.resolve(process.cwd(), "packages/devtools/src/components")],
  getRouteDirs: () => [path.resolve(process.cwd(), "src/routes")],
  getConfiguredRoutes: () => [],
  getDevtoolsConfig: () => ({
    enabled: true,
    startOpen: false,
    position: "bottom-center",
    panelShortcut: "Alt+Shift+D",
    visibilityShortcut: "Alt+Shift+H",
    ai: {
      enabled: true,
      endpoint: "",
      model: "terajs-assistant",
      timeoutMs: 12000
    }
  }),
  getSyncHubConfig: () => null,
  getRouterConfig: () => ({
    rootTarget: "app",
    middlewareDir: path.resolve(process.cwd(), "src/middleware"),
    keepPreviousDuringLoading: true,
    applyMeta: true
  })
}));

vi.mock("@terajs/shared", () => ({
  __esModule: true,
  Debug: { emit: vi.fn() }
}));

vi.mock("./compileSfcToComponent", () => ({
  __esModule: true,
  compileSfcToComponent: vi.fn(() => "export default function Comp() {}")
}));

let terajsPlugin: typeof import("./index").default;
let compileSfcToComponent: typeof import("./compileSfcToComponent").compileSfcToComponent;
let Debug: typeof import("@terajs/shared").Debug;

beforeAll(async () => {
  const pluginModule = await import("./index");
  terajsPlugin = pluginModule.default;

  const compileModule = await import("./compileSfcToComponent");
  compileSfcToComponent = compileModule.compileSfcToComponent;

  const sharedModule = await import("@terajs/shared");
  Debug = sharedModule.Debug;
});

describe("Terajs Vite Plugin (integration)", () => {
  function createResponseCollector() {
    const headers = new Map<string, string | string[]>();
    let statusCode = 200;
    let body = Buffer.alloc(0);

    return {
      headers,
      get statusCode() {
        return statusCode;
      },
      set statusCode(value: number) {
        statusCode = value;
      },
      setHeader(name: string, value: string | string[]) {
        headers.set(name, value);
      },
      end(chunk?: any) {
        body = chunk ? Buffer.from(chunk) : Buffer.alloc(0);
      },
      readJson() {
        return JSON.parse(body.toString("utf8"));
      }
    };
  }

  function requireHook<TArgs extends unknown[], TResult>(
    hook: Plugin["load"] | Plugin["resolveId"] | Plugin["handleHotUpdate"]
  ): (...args: TArgs) => TResult {
    if (typeof hook === "function") {
      return hook as unknown as (...args: TArgs) => TResult;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as unknown as (...args: TArgs) => TResult;
    }

    throw new Error("Expected Vite plugin hook to be defined.");
  }

  function requireServerHook(hook: Plugin["configureServer"]): (server: any) => void {
    if (typeof hook === "function") {
      return hook as (server: any) => void;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as (server: any) => void;
    }

    throw new Error("Expected Vite configureServer hook to be defined.");
  }

  function requireIndexHtmlTransform(
    hook: Plugin["transformIndexHtml"]
  ): (html: string | { raw: string }, ctx?: unknown) => unknown {
    if (typeof hook === "function") {
      return hook as unknown as (html: string | { raw: string }, ctx?: unknown) => unknown;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as unknown as (html: string | { raw: string }, ctx?: unknown) => unknown;
    }

    throw new Error("Expected transformIndexHtml hook to be defined.");
  }

  function requireBuildStart(hook: Plugin["buildStart"]): (this: any) => void {
    if (typeof hook === "function") {
      return hook as (this: any) => void;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as (this: any) => void;
    }

    throw new Error("Expected buildStart hook to be defined.");
  }

  it("mounts a dev middleware for server function requests", async () => {
    setRuntimeMode("server");
    const getGreeting = server(async (name: string) => `hello ${name}`, { id: "getGreeting" });
    expect(getGreeting.id).toBe("getGreeting");

    const plugin = terajsPlugin();
    const use = vi.fn();
    const configureServer = requireServerHook(plugin.configureServer);

    configureServer({
      middlewares: { use }
    } as any);

    expect(use).toHaveBeenCalledTimes(2);

    const middleware = use.mock.calls[1][0] as (req: any, res: any, next: () => void) => Promise<void>;
    const req = Readable.from([JSON.stringify({ id: "getGreeting", args: ["Ada"] })]) as any;
    req.method = "POST";
    req.url = "/_terajs/server";
    req.headers = {
      host: "localhost:5173",
      "content-type": "application/json"
    };

    const res = createResponseCollector();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(res.readJson()).toEqual({
      ok: true,
      result: "hello Ada",
      invalidated: []
    });
  });

  it("passes through non-server-function requests", async () => {
    const plugin = terajsPlugin();
    const use = vi.fn();
    const configureServer = requireServerHook(plugin.configureServer);

    configureServer({
      middlewares: { use }
    } as any);

    const middleware = use.mock.calls[1][0] as (req: any, res: any, next: () => void) => Promise<void>;
    const req = Readable.from([]) as any;
    req.method = "GET";
    req.url = "/app";
    req.headers = { host: "localhost:5173" };

    const res = createResponseCollector();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("serves the devtools IDE bridge manifest from a same-origin dev route", async () => {
    const plugin = terajsPlugin();
    const use = vi.fn();
    const configureServer = requireServerHook(plugin.configureServer);
    const existsSpy = vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      return String(input).includes("node_modules") && String(input).includes("devtools-bridge.json");
    });
    const readSpy = vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      if (String(input).includes("devtools-bridge.json")) {
        return JSON.stringify({
          version: 1,
          session: "http://127.0.0.1:4040/live/token",
          ai: "http://127.0.0.1:4040/ai/token",
          reveal: "http://127.0.0.1:4040/reveal/token",
          updatedAt: 1713120000000
        });
      }

      return "";
    });

    configureServer({
      middlewares: { use }
    } as any);

    const middleware = use.mock.calls[0][0] as (req: any, res: any, next: () => void) => void;
    const req = Readable.from([]) as any;
    req.method = "GET";
    req.url = "/_terajs/devtools/bridge";
    req.headers = { host: "localhost:5173" };

    const res = createResponseCollector();
    const next = vi.fn();
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
    expect(res.readJson()).toEqual({
      version: 1,
      session: "http://127.0.0.1:4040/live/token",
      ai: "http://127.0.0.1:4040/ai/token",
      reveal: "http://127.0.0.1:4040/reveal/token",
      updatedAt: 1713120000000
    });

    existsSpy.mockRestore();
    readSpy.mockRestore();
  });

  it("falls back to a user-local devtools IDE bridge manifest when the workspace cache is missing", async () => {
    const plugin = terajsPlugin();
    const use = vi.fn();
    const configureServer = requireServerHook(plugin.configureServer);
    const previousManifestOverride = process.env.TERAJS_DEVTOOLS_BRIDGE_MANIFEST_PATH;
    const globalManifestPath = path.resolve(process.cwd(), ".tmp-devtools-bridge.json");

    process.env.TERAJS_DEVTOOLS_BRIDGE_MANIFEST_PATH = globalManifestPath;

    const existsSpy = vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      return String(input) === globalManifestPath;
    });
    const readSpy = vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      if (String(input) === globalManifestPath) {
        return JSON.stringify({
          version: 1,
          session: "http://127.0.0.1:5050/live/token",
          ai: "http://127.0.0.1:5050/ai/token",
          reveal: "http://127.0.0.1:5050/reveal/token",
          updatedAt: 1713120000001
        });
      }

      return "";
    });

    try {
      configureServer({
        middlewares: { use }
      } as any);

      const middleware = use.mock.calls[0][0] as (req: any, res: any, next: () => void) => void;
      const req = Readable.from([]) as any;
      req.method = "GET";
      req.url = "/_terajs/devtools/bridge";
      req.headers = { host: "localhost:5173" };

      const res = createResponseCollector();
      const next = vi.fn();
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
      expect(res.readJson()).toEqual({
        version: 1,
        session: "http://127.0.0.1:5050/live/token",
        ai: "http://127.0.0.1:5050/ai/token",
        reveal: "http://127.0.0.1:5050/reveal/token",
        updatedAt: 1713120000001
      });
    } finally {
      if (previousManifestOverride === undefined) {
        delete process.env.TERAJS_DEVTOOLS_BRIDGE_MANIFEST_PATH;
      } else {
        process.env.TERAJS_DEVTOOLS_BRIDGE_MANIFEST_PATH = previousManifestOverride;
      }
      existsSpy.mockRestore();
      readSpy.mockRestore();
    }
  });

  it("emits sfc:load when loading a .tera file", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    load("Component.tera");
    expect(compileSfcToComponent).toHaveBeenCalled();
    expect(Debug.emit).toHaveBeenCalledWith("sfc:load", {
      scope: "Component.tera"
    });
  });

  it("emits sfc:hmr on handleHotUpdate()", () => {
    const plugin = terajsPlugin();
    const handleHotUpdate = requireHook<[HmrContext], unknown>(plugin.handleHotUpdate);
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    const ctx = {
      file: "Component.tera",
      server: {
        moduleGraph: {
          getModuleById: vi.fn(() => ({ id: "Component.tera" })),
          invalidateModule: vi.fn()
        }
      }
    } as unknown as HmrContext;
    handleHotUpdate(ctx);
    expect(Debug.emit).toHaveBeenCalledWith("sfc:hmr", {
      scope: "Component.tera"
    });
  });

  it("generates a virtual route manifest module", () => {
    const routesDir = path.resolve(process.cwd(), "src/routes");
    const productDir = path.join(routesDir, "products");

    vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      const value = String(input);
      return value === routesDir || value === productDir;
    });

    vi.spyOn(fs, "readdirSync").mockImplementation((input, options) => {
      const value = String(input);
      if (options && typeof options === "object" && "withFileTypes" in options && options.withFileTypes) {
        if (value === routesDir) {
          return [
            { name: "layout.tera", isDirectory: () => false, isFile: () => true },
            { name: "index.tera", isDirectory: () => false, isFile: () => true },
            { name: "products", isDirectory: () => true, isFile: () => false }
          ] as any;
        }

        if (value === productDir) {
          return [
            { name: "[id].tera", isDirectory: () => false, isFile: () => true }
          ] as any;
        }
      }

      return [] as any;
    });

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("layout.tera")) return "<template><slot /></template>";
      if (value.endsWith("index.tera")) return "<template><Home /></template>";
      if (value.endsWith("[id].tera")) return "<template><Product /></template>";
      return "<template />";
    });

    const plugin = terajsPlugin();
  const resolveId = requireHook<[string], unknown>(plugin.resolveId);
  const load = requireHook<[string], unknown>(plugin.load);
  const resolved = resolveId("virtual:terajs-routes");
  const code = load("\0virtual:terajs-routes");

    expect(resolved).toBe("\0virtual:terajs-routes");
    expect(typeof code).toBe("string");
    expect(code).toContain("buildRouteManifest(routeSources, { routeConfigs })");
    expect(code).toContain('filePath: "/src/routes/index.tera"');
    expect(code).toContain('filePath: "/src/routes/products/[id].tera"');
  });

  it("resolves hashed asset paths from the build manifest in build mode", async () => {
    const routesDir = path.resolve(process.cwd(), "src/routes");
    const productDir = path.join(routesDir, "products");
    const manifestPath = path.resolve(process.cwd(), "dist", "manifest.json");

    vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      const value = String(input);
      return value === routesDir || value === productDir || value === manifestPath;
    });

    vi.spyOn(fs, "readdirSync").mockImplementation((input, options) => {
      const value = String(input);
      if (options && typeof options === "object" && "withFileTypes" in options && options.withFileTypes) {
        if (value === routesDir) {
          return [
            { name: "index.tera", isDirectory: () => false, isFile: () => true }
          ] as any;
        }
      }
      return [] as any;
    });

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("index.tera")) return "<template><Home /></template>";
      if (value === manifestPath) {
        return JSON.stringify({
          "src/routes/index.tera": { file: "assets/index-123.js" }
        });
      }
      return "<template />";
    });

    const plugin = terajsPlugin();
    const configResolved = plugin.configResolved as ((config: any) => void);
    configResolved({ command: "build", root: process.cwd(), build: { outDir: "dist", manifest: true } });
    await (plugin.writeBundle as (() => Promise<void>))();

    const load = requireHook<[string], unknown>(plugin.load);
    const code = load("\0virtual:terajs-routes");

    expect(typeof code).toBe("string");
    expect(code).toContain('asset: "assets/index-123.js"');
  });

  it("passes config-defined route overrides into the virtual route module", async () => {
    const configModule = await import("./config");
    vi.spyOn(configModule, "getConfiguredRoutes").mockReturnValue([
      {
        filePath: path.resolve(process.cwd(), "src/routes/docs.tera"),
        path: "/learn",
        mountTarget: "docs-root",
        middleware: ["docs"],
        prerender: false
      }
    ] as any);

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("docs.tera")) return "<template><Docs /></template>";
      return "<template />";
    });

    const plugin = terajsPlugin();
  const load = requireHook<[string], unknown>(plugin.load);
  const code = load("\0virtual:terajs-routes");

    expect(typeof code).toBe("string");
    expect(code).toContain('path: "/learn"');
    expect(code).toContain('mountTarget: "docs-root"');
    expect(code).toContain('middleware: ["docs"]');
    expect(code).toContain('prerender: false');
  });

  it("generates middleware imports and global middleware list in virtual app module", async () => {
    const configModule = await import("./config");
    const middlewareDir = path.resolve(process.cwd(), "src/middleware");
    const adminDir = path.join(middlewareDir, "admin");

    vi.spyOn(configModule, "getRouterConfig").mockReturnValue({
      rootTarget: "app",
      middlewareDir,
      keepPreviousDuringLoading: true,
      applyMeta: true
    });

    vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      const value = String(input);
      return value === middlewareDir || value === adminDir;
    });

    vi.spyOn(fs, "readdirSync").mockImplementation((input, options) => {
      const value = String(input);
      if (options && typeof options === "object" && "withFileTypes" in options && options.withFileTypes) {
        if (value === middlewareDir) {
          return [
            { name: "auth.ts", isDirectory: () => false, isFile: () => true },
            { name: "trace.global.ts", isDirectory: () => false, isFile: () => true },
            { name: "admin", isDirectory: () => true, isFile: () => false }
          ] as any;
        }

        if (value === adminDir) {
          return [
            { name: "audit.ts", isDirectory: () => false, isFile: () => true }
          ] as any;
        }
      }

      return [] as any;
    });

    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("import * as middlewareModule0");
    expect(code).toContain('"admin/audit": resolveMiddlewareGuard("admin/audit"');
    expect(code).toContain('"auth": resolveMiddlewareGuard("auth"');
    expect(code).toContain('"trace": resolveMiddlewareGuard("trace"');
    expect(code).toContain('const GLOBAL_MIDDLEWARE = ["trace"]');
  });

  it("generates signalr hub bootstrap code when sync.hub is configured", async () => {
    const configModule = await import("./config");
    const syncSpy = vi.spyOn(configModule, "getSyncHubConfig").mockReturnValue({
      type: "signalr",
      url: "https://api.myapp.com/chat-hub",
      autoConnect: true,
      retryPolicy: "exponential"
    });

    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("createSignalRHubTransport");
    expect(code).toContain('const HUB_CONFIG = {"type":"signalr","url":"https://api.myapp.com/chat-hub","autoConnect":true,"retryPolicy":"exponential"}');
    expect(code).toContain("setServerFunctionTransport(hubTransport)");
    expect(code).toContain("invalidateResources(message.keys)");

    syncSpy.mockRestore();
  });

  it("generates socket.io hub bootstrap code when sync.hub is configured", async () => {
    const configModule = await import("./config");
    const syncSpy = vi.spyOn(configModule, "getSyncHubConfig").mockReturnValue({
      type: "socket.io",
      url: "https://api.myapp.com/socket-hub",
      autoConnect: true,
      retryPolicy: "exponential"
    });

    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("createSocketIoHubTransport");
    expect(code).toContain("@terajs/hub-socketio");
    expect(code).toContain('const HUB_CONFIG = {"type":"socket.io","url":"https://api.myapp.com/socket-hub","autoConnect":true,"retryPolicy":"exponential"}');
    expect(code).toContain("setServerFunctionTransport(hubTransport)");
    expect(code).toContain("invalidateResources(message.keys)");

    syncSpy.mockRestore();
  });

  it("generates websockets hub bootstrap code when sync.hub is configured", async () => {
    const configModule = await import("./config");
    const syncSpy = vi.spyOn(configModule, "getSyncHubConfig").mockReturnValue({
      type: "websockets",
      url: "wss://api.myapp.com/realtime",
      autoConnect: true,
      retryPolicy: "exponential"
    });

    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("createWebSocketHubTransport");
    expect(code).toContain("@terajs/hub-websockets");
    expect(code).toContain('const HUB_CONFIG = {"type":"websockets","url":"wss://api.myapp.com/realtime","autoConnect":true,"retryPolicy":"exponential"}');
    expect(code).toContain("setServerFunctionTransport(hubTransport)");
    expect(code).toContain("invalidateResources(message.keys)");

    syncSpy.mockRestore();
  });

  it("generates a virtual app module with router defaults", () => {
    const plugin = terajsPlugin();
    const resolveId = requireHook<[string], unknown>(plugin.resolveId);
    const load = requireHook<[string], unknown>(plugin.load);

    const resolved = resolveId("virtual:terajs-app");
    const code = load("\0virtual:terajs-app");

    expect(resolved).toBe("\0virtual:terajs-app");
    expect(typeof code).toBe("string");
    expect(code).toContain("createBrowserHistory");
    expect(code).toContain("createRouteView");
    expect(code).toContain('const ROOT_TARGET_ID = "app"');
    expect(code).toContain("autoStart: false");
    expect(code).toContain("keepPreviousDuringLoading: true");
    expect(code).toContain("document.addEventListener('click'");
    expect(code).toContain("initializeDevtoolsOverlay");
    expect(code).toContain("export function bootstrapTerajsApp()");
  });

  it("generates a dedicated bootstrap virtual module", () => {
    const plugin = terajsPlugin();
    const resolveId = requireHook<[string], unknown>(plugin.resolveId);
    const load = requireHook<[string], unknown>(plugin.load);

    const resolved = resolveId("virtual:terajs-bootstrap");
    const code = load("\0virtual:terajs-bootstrap");

    expect(resolved).toBe("\0virtual:terajs-bootstrap");
    expect(typeof code).toBe("string");
    expect(code).toContain('import { bootstrapTerajsApp } from "virtual:terajs-app";');
    expect(code).toContain("bootstrapTerajsApp();");
  });

  it("resolves app facade runtime imports to /@fs specifiers in dev mode", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);

    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("/@fs/");
    expect(code).toContain("mountDevtoolsOverlay");
    expect(code).toContain("autoAttachVsCodeDevtoolsBridge");
    expect(code).toContain("document.getElementById('terajs-overlay-container')");
    expect(code).toContain("globalThis.__TERAJS_DEVTOOLS_MOUNTED__ = false");
    expect(code).toContain("/_terajs/devtools/bridge");
  });

  it("keeps bare app facade imports in build mode virtual modules", () => {
    const plugin = terajsPlugin();
    const configResolved = plugin.configResolved as ((config: any) => void);
    const load = requireHook<[string], unknown>(plugin.load);

    configResolved({ command: "build" });
    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("from '@terajs/app';");
    expect(code).not.toContain("import('@terajs/app/devtools')");
    expect(code).not.toContain("initializeDevtoolsOverlay");
    expect(code).not.toContain("mountDevtoolsOverlay");
    expect(code).not.toContain("autoAttachVsCodeDevtoolsBridge");
  });

  it("loads virtual app module when the id carries query suffixes", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);

    const code = load("\0virtual:terajs-app?t=171");

    expect(typeof code).toBe("string");
    expect(code).toContain("export function bootstrapTerajsApp()");
  });

  it("loads bootstrap virtual module when the id carries query suffixes", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);

    const code = load("\0virtual:terajs-bootstrap?t=171");

    expect(typeof code).toBe("string");
    expect(code).toContain("bootstrapTerajsApp();");
  });

  it("returns a JavaScript error module when virtual app generation fails", async () => {
    const configModule = await import("./config");
    const syncSpy = vi.spyOn(configModule, "getSyncHubConfig").mockReturnValue({
      type: "invalid-transport",
      url: "https://example.invalid/hub"
    } as any);

    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const code = load("\0virtual:terajs-app");

    expect(typeof code).toBe("string");
    expect(code).toContain("__TERAJS_VIRTUAL_MODULE_ERROR__");
    expect(code).toContain("Unsupported sync.hub.type: invalid-transport");

    syncSpy.mockRestore();
  });

  it("returns a JavaScript error module when loading a .tera file fails", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const readSpy = vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      if (String(input).endsWith("Broken.tera")) {
        throw new Error("ENOENT: missing Broken.tera");
      }

      return "<template />";
    });

    const code = load("Broken.tera?import");

    expect(typeof code).toBe("string");
    expect(code).toContain("__TERAJS_VIRTUAL_MODULE_ERROR__");
    expect(code).toContain("ENOENT: missing Broken.tera");

    readSpy.mockRestore();
  });

  it("generates routes module even when route directories are missing", async () => {
    const configModule = await import("./config");
    const routesSpy = vi.spyOn(configModule, "getConfiguredRoutes").mockReturnValue([] as any);
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);

    const code = load("\0virtual:terajs-routes");

    expect(typeof code).toBe("string");
    expect(code).toContain("const routeSources = [");
    expect(code).toContain("buildRouteManifest(routeSources, { routeConfigs })");

    existsSpy.mockRestore();
    routesSpy.mockRestore();
  });

  it("injects a bootstrap module when index.html has no module script", () => {
    const plugin = terajsPlugin();
    const transform = requireIndexHtmlTransform(plugin.transformIndexHtml);

    const html = transform(`<!doctype html>
<html lang="en">
  <head></head>
  <body>
    <div id="app"></div>
  </body>
</html>`);

    expect(typeof html).toBe("string");
    expect(html).toContain('src="/@id/__x00__virtual:terajs-bootstrap"');
  });

  it("injects bootstrap when only the Vite client module script exists", () => {
    const plugin = terajsPlugin();
    const transform = requireIndexHtmlTransform(plugin.transformIndexHtml);

    const html = transform(`<!doctype html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`);

    expect(typeof html).toBe("string");
    expect(html).toContain('src="/@id/__x00__virtual:terajs-bootstrap"');
  });

  it("injects bootstrap when helper module scripts are marked as bootstrap-ignored", () => {
    const plugin = terajsPlugin();
    const transform = requireIndexHtmlTransform(plugin.transformIndexHtml);

    const html = transform(`<!doctype html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>
    <script type="module" src="/src/devtools-ai-hook.ts" data-terajs-ignore-bootstrap="true"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`);

    expect(typeof html).toBe("string");
    expect(html).toContain('src="/@id/__x00__virtual:terajs-bootstrap"');
  });

  it("injects fixed bootstrap asset path in build mode", () => {
    const plugin = terajsPlugin();
    const configResolved = plugin.configResolved as ((config: any) => void);
    const transform = requireIndexHtmlTransform(plugin.transformIndexHtml);

    configResolved({ command: "build", base: "/" });
    const html = transform(`<!doctype html>
<html lang="en">
  <head></head>
  <body>
    <div id="app"></div>
  </body>
</html>`);

    expect(typeof html).toBe("string");
    expect(html).toContain('src="/assets/terajs-bootstrap.js"');
  });

  it("emits a fixed-name bootstrap chunk in build mode", () => {
    const plugin = terajsPlugin();
    const configResolved = plugin.configResolved as ((config: any) => void);
    const buildStart = requireBuildStart(plugin.buildStart);

    configResolved({ command: "build", base: "/" });

    let emitted = 0;
    buildStart.call({
      emitFile(input: any) {
        emitted += 1;
        expect(input).toEqual({
          type: "chunk",
          id: "virtual:terajs-bootstrap",
          fileName: "assets/terajs-bootstrap.js",
          name: "terajs-bootstrap"
        });
        return "bootstrap-ref";
      }
    });

    expect(emitted).toBe(1);
  });

  it("does not inject bootstrap when a module script already exists", () => {
    const plugin = terajsPlugin();
    const transform = requireIndexHtmlTransform(plugin.transformIndexHtml);

    const html = transform(`<!doctype html>
<html lang="en">
  <head></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`);

    expect(typeof html).toBe("string");
    expect(html).not.toContain("bootstrapTerajsApp");
  });

  it("passes through non-string html payloads without throwing", () => {
    const plugin = terajsPlugin();
    const transform = requireIndexHtmlTransform(plugin.transformIndexHtml);

    const payload = {
      raw: "html"
    } as any;

    const result = transform(payload);
    expect(result).toBe(payload);
  });
});
