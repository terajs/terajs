import path from "node:path";

interface ModuleGraphServer {
  moduleGraph: {
    getModuleById(id: string): any;
    invalidateModule(mod: any): void;
  };
}

interface ReloadServer {
  ws?: { send?(payload: { type: string }): void };
}

interface RestartServer extends ReloadServer {
  restart?: () => Promise<void> | void;
}

const TERA_CONFIG_FILE_NAMES = new Set([
  "terajs.config.cjs",
  "terajs.config.js",
  "terajs.config.ts"
]);

export function invalidateVirtualModule(server: ModuleGraphServer, id: string): void {
  const module = server.moduleGraph.getModuleById(id);
  if (module) {
    server.moduleGraph.invalidateModule(module);
  }
}

export function isWithinConfiguredDir(filePath: string, dirPath: string): boolean {
  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const normalizedDirPath = dirPath.replace(/\\/g, "/");
  return normalizedFilePath === normalizedDirPath || normalizedFilePath.startsWith(`${normalizedDirPath}/`);
}

export function triggerFullReload(server: ReloadServer): void {
  server.ws?.send?.({ type: "full-reload" });
}

export function restartForTerajsConfigChange(
  server: RestartServer,
  filePath: string,
  rootDir: string
): boolean {
  const resolvedFile = path.resolve(filePath);
  if (
    path.dirname(resolvedFile) !== path.resolve(rootDir) ||
    !TERA_CONFIG_FILE_NAMES.has(path.basename(resolvedFile))
  ) {
    return false;
  }

  if (typeof server.restart !== "function") {
    triggerFullReload(server);
    return true;
  }

  try {
    const restart = server.restart();
    if (restart && typeof restart.catch === "function") {
      void restart.catch((error) => {
        console.error("[terajs/vite] Failed to restart after a config change", error);
      });
    }
  } catch (error) {
    console.error("[terajs/vite] Failed to restart after a config change", error);
  }

  return true;
}
