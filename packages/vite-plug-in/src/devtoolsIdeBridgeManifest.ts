import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_DEVTOOLS_IDE_BRIDGE_ENDPOINT = "/_terajs/devtools/bridge";

const DEVTOOLS_IDE_BRIDGE_MANIFEST_RELATIVE_PATH = path.join("node_modules", ".cache", "terajs", "devtools-bridge.json");
const DEVTOOLS_IDE_BRIDGE_MANIFEST_PATH_ENV = "TERAJS_DEVTOOLS_BRIDGE_MANIFEST_PATH";

function resolveDevtoolsIdeBridgeManifestPath(rootDir: string): string {
  return path.resolve(rootDir, DEVTOOLS_IDE_BRIDGE_MANIFEST_RELATIVE_PATH);
}

function resolveGlobalDevtoolsIdeBridgeManifestPath(): string {
  const overridePath = process.env[DEVTOOLS_IDE_BRIDGE_MANIFEST_PATH_ENV]?.trim();
  if (overridePath) {
    return path.resolve(overridePath);
  }

  if (process.platform === "win32") {
    const baseDir = process.env.LOCALAPPDATA?.trim() || path.join(os.homedir(), "AppData", "Local");
    return path.join(baseDir, "terajs", "devtools-bridge.json");
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches", "terajs", "devtools-bridge.json");
  }

  const xdgCacheHome = process.env.XDG_CACHE_HOME?.trim();
  return path.join(xdgCacheHome && xdgCacheHome.length > 0 ? xdgCacheHome : path.join(os.homedir(), ".cache"), "terajs", "devtools-bridge.json");
}

function resolveDevtoolsIdeBridgeManifestCandidatePaths(rootDir: string): string[] {
  const localPath = resolveDevtoolsIdeBridgeManifestPath(rootDir);
  const globalPath = resolveGlobalDevtoolsIdeBridgeManifestPath();
  return localPath === globalPath ? [localPath] : [localPath, globalPath];
}

function readDevtoolsIdeBridgeManifest(rootDir: string): string | null {
  for (const manifestPath of resolveDevtoolsIdeBridgeManifestCandidatePaths(rootDir)) {
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    try {
      const rawText = fs.readFileSync(manifestPath, "utf8");
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      if (parsed.version !== 1 || typeof parsed.session !== "string" || typeof parsed.ai !== "string") {
        continue;
      }

      const reveal = typeof parsed.reveal === "string" ? parsed.reveal : null;

      return JSON.stringify({
        version: 1,
        session: parsed.session,
        ai: parsed.ai,
        ...(reveal ? { reveal } : {}),
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now()
      });
    } catch {
      continue;
    }
  }

  return null;
}

export function createDevtoolsIdeBridgeMiddleware(rootDir: string) {
  return (req: any, res: any, next: () => void) => {
    const requestUrl = typeof req.url === "string" ? req.url.split("?")[0] : "";
    if (requestUrl !== DEFAULT_DEVTOOLS_IDE_BRIDGE_ENDPOINT || (req.method !== "GET" && req.method !== "HEAD")) {
      next();
      return;
    }

    const manifestJson = readDevtoolsIdeBridgeManifest(rootDir);
    res.setHeader("Cache-Control", "no-store");

    if (!manifestJson) {
      res.statusCode = 204;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(manifestJson);
  };
}