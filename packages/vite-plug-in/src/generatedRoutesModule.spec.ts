import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseSFC } from "@terajs/sfc";
import { generateRoutesModuleSource } from "./generatedRoutesModule";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

describe("generateRoutesModuleSource", () => {
  let tempDir: string | null = null;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("applies route precedence as SFC route block, then configured route, then inferred route", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "terajs-generated-routes-"));
    const listFile = path.join(tempDir, "src/pages/migrations/index.tera");
    const parentFile = path.join(tempDir, "src/pages/migrations/[id]/index.tera");
    const childFile = path.join(tempDir, "src/pages/migrations/[id]/connect.tera");

    await mkdir(path.dirname(listFile), { recursive: true });
    await mkdir(path.dirname(parentFile), { recursive: true });
    await writeFile(listFile, "<template><MigrationQueue /></template>");
    await writeFile(parentFile, `
<template><MigrationShell><RouterView /></MigrationShell></template>
<script>export default () => null</script>
<route>
  middleware: auth
</route>
`);
    await writeFile(childFile, "<template><MigrationConnect /></template>");

    expect(parseSFC(await readFile(parentFile, "utf8"), parentFile).routeOverride?.middleware).toBe("auth");

    const code = generateRoutesModuleSource({
      routeFiles: [listFile, parentFile, childFile],
      configuredRoutes: [
        {
          filePath: parentFile,
          path: "/migrations/:id",
          middleware: ["configured-parent"],
          children: [
            {
              filePath: childFile,
              path: "connect",
              middleware: ["child-config"]
            }
          ]
        }
      ],
      normalizePath,
      toProjectImportPath: (filePath) => `/${normalizePath(path.relative(tempDir!, filePath))}`,
      getManifestAssetPath: () => undefined
    });

    expect(code).toContain('path: "/migrations"');
    expect(code).toMatch(/path: "\/migrations\/:id",[\s\S]*?middleware: \["auth"\],[\s\S]*?children: \[/);
    expect(code).toMatch(/path: "connect",[\s\S]*?middleware: \["child-config"\]/);
    expect(code).not.toContain("configured-parent");
    expect(code).not.toContain('path: "/migrations/:id/connect"');
  });
});
