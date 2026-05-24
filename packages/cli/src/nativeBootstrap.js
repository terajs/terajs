import path from "node:path";
const NOOP = () => { };
function importRuntimeModule(specifier) {
    return import(specifier);
}
function resolveRepoModuleHref(relativePath) {
    return new URL(relativePath, import.meta.url).href;
}
function normalizeComponentProps(input) {
    if (!input || typeof input !== "object") {
        return {};
    }
    const next = { ...input };
    delete next.children;
    delete next.slots;
    return next;
}
function normalizeSlots(input) {
    const slots = {};
    if (input && typeof input === "object" && input.slots && typeof input.slots === "object") {
        for (const key of Object.keys(input.slots)) {
            const value = input.slots[key];
            slots[key] = typeof value === "function" ? value : () => value;
        }
    }
    if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "children") && input.children != null) {
        const value = input.children;
        slots.default = typeof value === "function" ? value : () => value;
    }
    return slots;
}
function pickBindings(names, source) {
    const next = {};
    for (const name of names) {
        if (Object.prototype.hasOwnProperty.call(source, name)) {
            next[name] = source[name];
        }
    }
    return next;
}
function extractImportStatements(setupCode) {
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
function extractImportBindings(clause) {
    const bindings = new Set();
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
function resolveTerajsImportPath(moduleFilePath, importSource) {
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
function extractLocalTerajsImportMap(setupCode, moduleFilePath) {
    const resolved = new Map();
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
function extractExecutableSetupCode(setupCode) {
    const setupStart = setupCode.indexOf("function __ssfc");
    return setupStart >= 0 ? setupCode.slice(setupStart) : setupCode;
}
function createBuildTimeSetupExecutor(runtime, setupCode) {
    const executableSetupCode = extractExecutableSetupCode(setupCode);
    const argNames = Object.keys(runtime);
    const argValues = argNames.map((name) => runtime[name]);
    const factory = new Function(...argNames, `${executableSetupCode}\nreturn __ssfc;`);
    return factory(...argValues);
}
async function loadAndroidBootstrapRuntime() {
    const rendererAndroidPackage = "@terajs/renderer-android";
    const rendererPackage = "@terajs/renderer";
    const rendererAndroidSourceHref = resolveRepoModuleHref("../../renderer-android/src/index.js");
    const rendererSourceHref = resolveRepoModuleHref("../../renderer/src/index.js");
    const androidModule = await import(rendererAndroidPackage)
        .catch(() => importRuntimeModule(rendererAndroidSourceHref));
    const rendererModule = await import(rendererPackage)
        .catch(() => importRuntimeModule(rendererSourceHref));
    return {
        createAndroidCommandBridge: androidModule.createAndroidCommandBridge,
        createHostBindings: rendererModule.createHostBindings,
        createHostIRRenderer: rendererModule.createHostIRRenderer,
        stringifyAndroidBridgeCommands: androidModule.stringifyAndroidBridgeCommands
    };
}
async function loadBuildTimeSetupRuntime() {
    const reactivityPackage = "@terajs/reactivity";
    const reactivitySourceHref = resolveRepoModuleHref("../../reactivity/src/index.js");
    const reactivityModule = await import(reactivityPackage)
        .catch(() => importRuntimeModule(reactivitySourceHref));
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
export async function createAndroidRouteBootstrapCommandBatch(options) {
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
    const setupExecutorCache = new Map();
    function getSetupExecutor(module) {
        const cached = setupExecutorCache.get(module.filePath);
        if (cached) {
            return cached;
        }
        const next = createBuildTimeSetupExecutor(setupRuntime, module.setupCode);
        setupExecutorCache.set(module.filePath, next);
        return next;
    }
    function renderCompiledModule(module, input) {
        const props = normalizeComponentProps(input);
        const slots = normalizeSlots(input);
        const emit = () => { };
        const bindings = getSetupExecutor(module)({ props, slots, emit }) ?? {};
        const registry = {
            ...pickBindings(module.exposedBindings, bindings)
        };
        for (const [bindingName, importFilePath] of extractLocalTerajsImportMap(module.setupCode, module.filePath)) {
            const importedModule = modulesByFilePath.get(importFilePath);
            if (!importedModule) {
                continue;
            }
            registry[bindingName] = (componentInput) => renderCompiledModule(importedModule, componentInput);
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
