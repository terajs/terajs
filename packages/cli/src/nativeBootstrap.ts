import path from "node:path";

import type { IRModule } from "@terajs/compiler";

export interface NativeBootstrapCompiledModule {
  kind: "page" | "layout" | "component" | "module";
  filePath: string;
  name: string;
  setupCode: string;
  importedBindings: string[];
  exposedBindings: string[];
  ir: IRModule;
}

export interface NativeBootstrapRouteRecord {
  id: string;
  path: string;
  filePath: string;
  layouts: Array<{
    id: string;
    filePath: string;
  }>;
}

type BuildTimeSetupRuntime = {
  createResource: (...args: unknown[]) => unknown;
  computed: (...args: unknown[]) => unknown;
  onCleanup: (...args: unknown[]) => void;
  onMounted: (...args: unknown[]) => void;
  onUnmounted: (...args: unknown[]) => void;
  reactive: (...args: unknown[]) => unknown;
  ref: (...args: unknown[]) => unknown;
  signal: (...args: unknown[]) => unknown;
  watch: (...args: unknown[]) => unknown;
  watchEffect: (...args: unknown[]) => unknown;
};

interface AndroidBootstrapRuntime {
  createAndroidCommandBridge: () => {
    drainCommands(): unknown[];
    host: any;
    root: any;
  };
  createHostBindings: (host: any) => any;
  createHostIRRenderer: (runtime: { host: any; bindings: any }) => {
    renderIRModule(ir: IRModule, ctx: any): any;
  };
  stringifyAndroidBridgeCommands: (commands: unknown[]) => string;
}

const NOOP = () => {};

function normalizeComponentProps(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") {
    return {};
  }

  const next = { ...(input as Record<string, unknown>) };
  delete next.children;
  delete next.slots;
  return next;
}

function normalizeSlots(input: unknown): Record<string, () => unknown> {
  const slots: Record<string, () => unknown> = {};

  if (input && typeof input === "object" && (input as Record<string, unknown>).slots && typeof (input as Record<string, unknown>).slots === "object") {
    for (const key of Object.keys((input as { slots: Record<string, unknown> }).slots)) {
      const value = (input as { slots: Record<string, unknown> }).slots[key];
      slots[key] = typeof value === "function" ? value as () => unknown : () => value;
    }
  }

  if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "children") && (input as Record<string, unknown>).children != null) {
    const value = (input as Record<string, unknown>).children;
    slots.default = typeof value === "function" ? value as () => unknown : () => value;
  }

  return slots;
}

function pickBindings(names: string[], source: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};

  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(source, name)) {
      next[name] = source[name];
    }
  }

  return next;
}

function extractImportStatements(setupCode: string): Array<{ clause: string; source: string }> {
  const setupStart = setupCode.indexOf("function __ssfc");
  const importsBlock = setupStart >= 0 ? setupCode.slice(0, setupStart) : "";
  const statements = importsBlock.match(/import[\s\S]*?(?:from\s+["'][^"']+["'];?|["'][^"']+["'];?)/g) ?? [];

  return statements.flatMap((statement) => {
    const fromMatch = statement.match(/^import\s+([\s\S]+?)\s+from\s+["']([^"']+)["'];?$/);
    if (!fromMatch) {
      return [];
    }

    return [{
      clause: fromMatch[1].trim(),
      source: fromMatch[2]
    }];
  });
}

function extractImportBindings(clause: string): string[] {
  const bindings = new Set<string>();
  const normalized = clause.replace(/\s+/g, " ").trim();

  const namespaceMatch = normalized.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (namespaceMatch) {
    bindings.add(namespaceMatch[1]);
  }

  const namedMatch = normalized.match(/\{([^}]+)\}/);
  if (namedMatch) {
    for (const entry of namedMatch[1].split(",")) {
      const trimmed = entry.trim();
      if (!trimmed) {
        continue;
      }

      const aliasMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (aliasMatch) {
        bindings.add(aliasMatch[2]);
        continue;
      }

      bindings.add(trimmed);
    }
  }

  const defaultClause = normalized
    .replace(/\{[^}]+\}/, "")
    .replace(/\*\s+as\s+[A-Za-z_$][\w$]*/, "")
    .replace(/,/g, " ")
    .trim();

  if (/^[A-Za-z_$][\w$]*$/.test(defaultClause)) {
    bindings.add(defaultClause);
  }

  return [...bindings];
}

function resolveTerajsImportPath(moduleFilePath: string, importSource: string): string | null {
  if (!importSource.endsWith(".tera")) {
    return null;
  }

  if (importSource.startsWith(".")) {
    return path.posix.normalize(path.posix.resolve(path.posix.dirname(moduleFilePath), importSource));
  }

  return importSource.startsWith("/")
    ? path.posix.normalize(importSource)
    : path.posix.normalize(path.posix.join(path.posix.dirname(moduleFilePath), importSource));
}

function extractLocalTerajsImportMap(setupCode: string, moduleFilePath: string): Map<string, string> {
  const resolved = new Map<string, string>();

  for (const entry of extractImportStatements(setupCode)) {
    const resolvedPath = resolveTerajsImportPath(moduleFilePath, entry.source);
    if (!resolvedPath) {
      continue;
    }

    for (const binding of extractImportBindings(entry.clause)) {
      resolved.set(binding, resolvedPath);
    }
  }

  return resolved;
}

function extractExecutableSetupCode(setupCode: string): string {
  const setupStart = setupCode.indexOf("function __ssfc");
  return setupStart >= 0 ? setupCode.slice(setupStart) : setupCode;
}

function createBuildTimeSetupExecutor(runtime: BuildTimeSetupRuntime, setupCode: string): (ctx: {
  emit: (...args: unknown[]) => void;
  props: Record<string, unknown>;
  slots: Record<string, () => unknown>;
}) => Record<string, unknown> {
  const executableSetupCode = extractExecutableSetupCode(setupCode);
  const argNames = Object.keys(runtime);
  const argValues = argNames.map((name) => runtime[name as keyof BuildTimeSetupRuntime]);
  const factory = new Function(...argNames, `${executableSetupCode}\nreturn __ssfc;`) as (...args: unknown[]) => (ctx: {
    emit: (...args: unknown[]) => void;
    props: Record<string, unknown>;
    slots: Record<string, () => unknown>;
  }) => Record<string, unknown>;

  return factory(...argValues);
}

async function loadAndroidBootstrapRuntime(): Promise<AndroidBootstrapRuntime> {
  const rendererAndroidPackage = "@terajs/renderer-android";
  const rendererPackage = "@terajs/renderer";

  const androidModule = await import(rendererAndroidPackage)
    .catch(() => import("../../renderer-android/src/index.js"));
  const rendererModule = await import(rendererPackage)
    .catch(() => import("../../renderer/src/index.js"));

  return {
    createAndroidCommandBridge: androidModule.createAndroidCommandBridge,
    createHostBindings: rendererModule.createHostBindings,
    createHostIRRenderer: rendererModule.createHostIRRenderer,
    stringifyAndroidBridgeCommands: androidModule.stringifyAndroidBridgeCommands
  };
}

async function loadBuildTimeSetupRuntime(): Promise<BuildTimeSetupRuntime> {
  const reactivityPackage = "@terajs/reactivity";
  const reactivityModule = await import(reactivityPackage)
    .catch(() => import("../../reactivity/src/index.js"));

  return {
    createResource: typeof reactivityModule.createResource === "function" ? reactivityModule.createResource : NOOP,
    computed: typeof reactivityModule.computed === "function" ? reactivityModule.computed : NOOP,
    onCleanup: NOOP,
    onMounted: NOOP,
    onUnmounted: NOOP,
    reactive: typeof reactivityModule.reactive === "function" ? reactivityModule.reactive : NOOP,
    ref: typeof reactivityModule.ref === "function" ? reactivityModule.ref : NOOP,
    signal: typeof reactivityModule.signal === "function" ? reactivityModule.signal : NOOP,
    watch: typeof reactivityModule.watch === "function" ? reactivityModule.watch : NOOP,
    watchEffect: typeof reactivityModule.watchEffect === "function" ? reactivityModule.watchEffect : NOOP,
  };
}

export async function createAndroidRouteBootstrapCommandBatch(options: {
  modules: NativeBootstrapCompiledModule[];
  routes: NativeBootstrapRouteRecord[];
}): Promise<string | null> {
  const route = options.routes.find((candidate) => candidate.path === "/") ?? options.routes[0];
  if (!route) {
    return null;
  }

  const modulesByFilePath = new Map(options.modules.map((module) => [module.filePath, module]));
  const pageModule = modulesByFilePath.get(route.filePath);
  if (!pageModule) {
    return null;
  }

  const bootstrapRuntime = await loadAndroidBootstrapRuntime();
  const setupRuntime = await loadBuildTimeSetupRuntime();
  const bridge = bootstrapRuntime.createAndroidCommandBridge();
  const renderer = bootstrapRuntime.createHostIRRenderer({
    host: bridge.host,
    bindings: bootstrapRuntime.createHostBindings(bridge.host)
  });

  const setupExecutorCache = new Map<string, ReturnType<typeof createBuildTimeSetupExecutor>>();

  function getSetupExecutor(module: NativeBootstrapCompiledModule) {
    const cached = setupExecutorCache.get(module.filePath);
    if (cached) {
      return cached;
    }

    const next = createBuildTimeSetupExecutor(setupRuntime, module.setupCode);
    setupExecutorCache.set(module.filePath, next);
    return next;
  }

  function renderCompiledModule(module: NativeBootstrapCompiledModule, input?: unknown): any {
    const props = normalizeComponentProps(input);
    const slots = normalizeSlots(input);
    const emit = () => {};
    const bindings = getSetupExecutor(module)({ props, slots, emit }) ?? {};
    const registry: Record<string, unknown> = {
      ...pickBindings(module.exposedBindings, bindings)
    };

    for (const [bindingName, importFilePath] of extractLocalTerajsImportMap(module.setupCode, module.filePath)) {
      const importedModule = modulesByFilePath.get(importFilePath);
      if (!importedModule) {
        continue;
      }

      registry[bindingName] = (componentInput?: unknown) => renderCompiledModule(importedModule, componentInput);
    }

    return renderer.renderIRModule(module.ir, {
      ...bindings,
      props,
      slots,
      emit,
      __components: registry
    });
  }

  let rootNode = renderCompiledModule(pageModule);

  for (let index = route.layouts.length - 1; index >= 0; index -= 1) {
    const layout = modulesByFilePath.get(route.layouts[index].filePath);
    if (!layout) {
      continue;
    }

    const layoutContent = rootNode;
    rootNode = renderCompiledModule(layout, {
      children: () => layoutContent,
      slots: {
        default: () => layoutContent
      }
    });
  }

  bridge.host.insert(bridge.root, rootNode);
  const commands = bridge.drainCommands();
  return commands.length > 0 ? bootstrapRuntime.stringifyAndroidBridgeCommands(commands) : null;
}