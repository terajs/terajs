import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateRoutesModuleSource } from "./moduleSource.js";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function toProjectImportPath(filePath: string): string {
  const relative = normalizePath(path.relative(process.cwd(), filePath));
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function getManifestAssetPath(filePath: string, manifest?: Record<string, any>): string | undefined {
  if (!manifest) {
    return undefined;
  }

  const key = normalizePath(path.relative(process.cwd(), filePath));
  return manifest[key]?.file;
}

describe("generateRoutesModuleSource", () => {
  const originalCwd = process.cwd();
  let tempDir: string | null = null;

  afterEach(async () => {
    process.chdir(originalCwd);

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("preserves dynamic params, layouts, and emitted asset paths", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-route-module-"));
    process.chdir(tempDir);

    const layoutFile = path.join(tempDir, "src/pages/posts/layout.tera");
    const routeFile = path.join(tempDir, "src/pages/posts/[id].tera");

    await mkdir(path.dirname(layoutFile), { recursive: true });
    await writeFile(layoutFile, "<template><slot /></template>");
    await writeFile(routeFile, "<template><article>Post</article></template>");

    const source = generateRoutesModuleSource({
      routeFiles: [layoutFile, routeFile],
      configuredRoutes: [],
      manifest: {
        "src/pages/posts/[id].tera": { file: "assets/post-id.js" }
      },
      normalizePath,
      toProjectImportPath,
      getManifestAssetPath
    });

    expect(source).toContain('path: "/posts/:id"');
    expect(source).toContain('asset: "assets/post-id.js"');
    expect(source).toContain('filePath: "./src/pages/posts/layout.tera"');
    expect(source).toContain('component: () => import("./src/pages/posts/[id].tera")');
  });
});