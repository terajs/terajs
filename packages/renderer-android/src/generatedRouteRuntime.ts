import type { IRModule } from "@terajs/compiler";
import { computed, reactive, ref, signal, watch, watchEffect } from "@terajs/reactivity";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";

import { createAndroidWireTransport, type AndroidWireTransport } from "./wireTransport.js";

export interface AndroidGeneratedCompiledModule {
  kind: "page" | "layout" | "component" | "module";
  filePath: string;
  name: string;
  setupCode: string;
  importedBindings: string[];
  exposedBindings: string[];
  ir: IRModule;
}

export interface AndroidGeneratedRouteRecord {
  id: string;
  path: string;
  filePath: string;
  layouts: Array<{
    id: string;
    filePath: string;
  }>;
}

export interface CreateAndroidGeneratedRouteTransportOptions {
  modules: AndroidGeneratedCompiledModule[];
  routes: AndroidGeneratedRouteRecord[];
  initialPath?: string;
  transport?: AndroidWireTransport;
}

export interface AndroidGeneratedRouteTransport {
  route: AndroidGeneratedRouteRecord;
  transport: AndroidWireTransport;
}

type GeneratedSetupRuntime = Record<string, unknown>;

const NOOP = () => {};

const GENERATED_SETUP_RUNTIME: GeneratedSetupRuntime = {
  createResource: NOOP,
  computed,
  onCleanup: NOOP,
  onMounted: NOOP,
  onUnmounted: NOOP,
  reactive,
  ref,
  signal,
  watch,
  watchEffect,
};

function normalizePosixPath(input: string): string {
  const absolute = input.startsWith("/");
  const segments: string[] = [];

  for (const part of input.split("/")) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      const previous = segments[segments.length - 1];
      if (previous && previous !== "..") {
        segments.pop();
      } else if (!absolute) {
        segments.push(part);
      }
      continue;
    }

    segments.push(part);
  }

  if (absolute) {
    return segments.length > 0 ? `/${segments.join("/")}` : "/";
  }

  return segments.join("/") || ".";
}

function dirnamePosix(filePath: string): string {
  const normalized = normalizePosixPath(filePath);
  if (normalized === "/") {
    return "/";
  }

  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash < 0) {
    return ".";
  }

  if (lastSlash === 0) {
    return "/";
  }

  return normalized.slice(0, lastSlash);
}

function resolvePosixPath(fromDir: string, targetPath: string): string {
  return normalizePosixPath(targetPath.startsWith("/") ? targetPath : `${fromDir}/${targetPath}`);
}

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

  if (
    input
    && typeof input === "object"
    && (input as Record<string, unknown>).slots
    && typeof (input as Record<string, unknown>).slots === "object"
  ) {
    for (const key of Object.keys((input as { slots: Record<string, unknown> }).slots)) {
      const value = (input as { slots: Record<string, unknown> }).slots[key];
      slots[key] = typeof value === "function" ? value as () => unknown : () => value;
    }
  }

  if (
    input
    && typeof input === "object"
    && Object.prototype.hasOwnProperty.call(input, "children")
    && (input as Record<string, unknown>).children != null
  ) {
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
      source: fromMatch[2],
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

  return resolvePosixPath(dirnamePosix(moduleFilePath), importSource);
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

function createGeneratedSetupExecutor(runtime: GeneratedSetupRuntime, setupCode: string): (ctx: {
  emit: (...args: unknown[]) => void;
  props: Record<string, unknown>;
  slots: Record<string, () => unknown>;
}) => Record<string, unknown> {
  const executableSetupCode = extractExecutableSetupCode(setupCode);
  const argNames = Object.keys(runtime);
  const argValues = argNames.map((name) => runtime[name as keyof GeneratedSetupRuntime]);
  const factory = new Function(...argNames, `${executableSetupCode}\nreturn __ssfc;`) as (...args: unknown[]) => (ctx: {
    emit: (...args: unknown[]) => void;
    props: Record<string, unknown>;
    slots: Record<string, () => unknown>;
  }) => Record<string, unknown>;

  return factory(...argValues);
}

export function createAndroidGeneratedRouteTransport(
  options: CreateAndroidGeneratedRouteTransportOptions,
): AndroidGeneratedRouteTransport {
  const route = options.routes.find((candidate) => candidate.path === (options.initialPath ?? "/"))
    ?? options.routes[0];
  if (!route) {
    throw new Error("Android generated route transport requires at least one route.");
  }

  const pageModule = options.modules.find((module) => module.filePath === route.filePath);
  if (!pageModule) {
    throw new Error(`Missing Android generated page module for route ${route.path}.`);
  }

  const transport = options.transport ?? createAndroidWireTransport();
  const renderer = createHostIRRenderer({
    host: transport.session.bridge.host,
    bindings: createHostBindings(transport.session.bridge.host),
  });
  const modulesByFilePath = new Map(options.modules.map((module) => [module.filePath, module]));
  const setupExecutorCache = new Map<string, ReturnType<typeof createGeneratedSetupExecutor>>();

  function getSetupExecutor(module: AndroidGeneratedCompiledModule) {
    const cached = setupExecutorCache.get(module.filePath);
    if (cached) {
      return cached;
    }

    const next = createGeneratedSetupExecutor(GENERATED_SETUP_RUNTIME, module.setupCode);
    setupExecutorCache.set(module.filePath, next);
    return next;
  }

  function createNamedComponentRegistry(): Record<string, unknown> {
    const registry: Record<string, unknown> = {};

    for (const candidate of options.modules) {
      if (candidate.kind !== "component" || !candidate.name) {
        continue;
      }

      registry[candidate.name] = (componentInput?: unknown) => renderGeneratedModule(candidate, componentInput);
    }

    return registry;
  }

  function renderGeneratedModule(module: AndroidGeneratedCompiledModule, input?: unknown): unknown {
    const props = normalizeComponentProps(input);
    const slots = normalizeSlots(input);
    const emit = () => {};
    const bindings = getSetupExecutor(module)({ props, slots, emit }) ?? {};
    const registry: Record<string, unknown> = {
      ...createNamedComponentRegistry(),
      ...pickBindings(module.exposedBindings, bindings),
    };

    for (const [bindingName, importFilePath] of extractLocalTerajsImportMap(module.setupCode, module.filePath)) {
      const importedModule = modulesByFilePath.get(importFilePath);
      if (!importedModule) {
        continue;
      }

      registry[bindingName] = (componentInput?: unknown) => renderGeneratedModule(importedModule, componentInput);
    }

    return renderer.renderIRModule(module.ir, {
      ...bindings,
      props,
      slots,
      emit,
      __components: registry,
    });
  }

  let rootNode = renderGeneratedModule(pageModule) as Parameters<typeof transport.session.bridge.host.insert>[1];

  for (let index = route.layouts.length - 1; index >= 0; index -= 1) {
    const layout = modulesByFilePath.get(route.layouts[index].filePath);
    if (!layout) {
      continue;
    }

    const layoutContent = rootNode;
    rootNode = renderGeneratedModule(layout, {
      children: () => layoutContent,
      slots: {
        default: () => layoutContent,
      },
    }) as typeof layoutContent;
  }

  transport.session.bridge.host.insert(transport.session.bridge.root, rootNode);

  return {
    route,
    transport,
  };
}
