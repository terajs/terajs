import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildNativeTarget } from "../src/nativeBuild.js";

const tempDirs: string[] = [];

async function createNativeWorkspace(): Promise<{
  cwd: string;
  sourceRoot: string;
  generatedBase: string;
  hostsBase: string;
}> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "terajs-native-build-"));
  tempDirs.push(cwd);

  const sourceRoot = path.join(cwd, "src", "shared");
  const generatedBase = path.join(cwd, ".terajs", "generated");
  const hostsBase = path.join(cwd, ".terajs", "hosts");

  await mkdir(path.join(sourceRoot, "pages"), { recursive: true });
  await mkdir(path.join(sourceRoot, "components"), { recursive: true });
  await writeFile(
    path.join(sourceRoot, "pages", "layout.tera"),
    `<template><main class="shell">Layout</main></template>\n`,
    "utf8"
  );
  await writeFile(
    path.join(sourceRoot, "pages", "index.tera"),
    `<template><section>Hello native build</section></template>\n`,
    "utf8"
  );
  await writeFile(
    path.join(sourceRoot, "components", "StatusPill.tera"),
    `<template><span>Status</span></template>\n`,
    "utf8"
  );

  return {
    cwd,
    sourceRoot,
    generatedBase,
    hostsBase
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dirPath) => rm(dirPath, { recursive: true, force: true })));
});

describe("native target build output", () => {
  it.each([
    ["android", "android-views"],
    ["ios", "uikit-views"]
  ] as const)("emits compiled modules and host metadata for %s", async (target, renderer) => {
    const workspace = await createNativeWorkspace();
    const generatedDir = path.join(workspace.generatedBase, target);
    const hostDir = path.join(workspace.hostsBase, target);

    const result = await buildNativeTarget(
      {
        target,
        kind: "native",
        sourceRoot: workspace.sourceRoot,
        generatedDir,
        hostDir
      },
      {
        cwd: workspace.cwd
      }
    );

    expect(result.moduleCount).toBe(3);
    expect(result.routeCount).toBe(1);

    const manifest = JSON.parse(
      await readFile(path.join(generatedDir, "terajs-target.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      moduleCount: number;
      routeCount: number;
      routesFile: string;
      modules: Array<{
        kind: string;
        filePath: string;
        outputPath: string;
        name: string;
        importedBindings: string[];
        exposedBindings: string[];
      }>;
    };

    expect(manifest.target).toBe(target);
    expect(manifest.renderer).toBe(renderer);
    expect(manifest.moduleCount).toBe(3);
    expect(manifest.routeCount).toBe(1);
    expect(manifest.routesFile).toBe("routes.json");
    expect(manifest.modules).toEqual([
      {
        kind: "component",
        filePath: "/src/shared/components/StatusPill.tera",
        outputPath: "modules/components/StatusPill.json",
        name: "StatusPill",
        importedBindings: [],
        exposedBindings: []
      },
      {
        kind: "page",
        filePath: "/src/shared/pages/index.tera",
        outputPath: "modules/pages/index.json",
        name: "index",
        importedBindings: [],
        exposedBindings: []
      },
      {
        kind: "layout",
        filePath: "/src/shared/pages/layout.tera",
        outputPath: "modules/pages/layout.json",
        name: "layout",
        importedBindings: [],
        exposedBindings: []
      }
    ]);

    const compiledPage = JSON.parse(
      await readFile(path.join(generatedDir, "modules", "pages", "index.json"), "utf8")
    ) as {
      kind: string;
      filePath: string;
      name: string;
      ir: { filePath?: string };
    };

    expect(compiledPage.kind).toBe("page");
    expect(compiledPage.filePath).toBe("/src/shared/pages/index.tera");
    expect(compiledPage.name).toBe("index");
    expect(compiledPage.ir.filePath).toBe("/src/shared/pages/index.tera");

    const routes = JSON.parse(
      await readFile(path.join(generatedDir, "routes.json"), "utf8")
    ) as Array<{
      id: string;
      path: string;
      filePath: string;
      layout?: string;
      mountTarget?: string;
      asset?: string;
      middleware: string[];
      prerender: boolean;
      hydrate: string;
      edge: boolean;
      meta: Record<string, unknown>;
      layouts: Array<{ id: string; filePath: string }>;
    }>;

    expect(routes).toEqual([
      {
        id: "index",
        path: "/",
        filePath: "/src/shared/pages/index.tera",
        layout: undefined,
        mountTarget: undefined,
        asset: undefined,
        middleware: [],
        prerender: true,
        hydrate: "eager",
        edge: false,
        meta: {},
        layouts: [
          {
            id: "root",
            filePath: "/src/shared/pages/layout.tera"
          }
        ]
      }
    ]);

    const hostManifest = JSON.parse(
      await readFile(path.join(hostDir, "terajs-host.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      generatedManifest: string;
      routesFile: string;
    };

    expect(hostManifest.target).toBe(target);
    expect(hostManifest.renderer).toBe(renderer);
    expect(hostManifest.generatedManifest).toBe(`../../generated/${target}/terajs-target.json`);
    expect(hostManifest.routesFile).toBe(`../../generated/${target}/routes.json`);

    const hostReadme = await readFile(path.join(hostDir, "README.md"), "utf8");
    expect(hostReadme).toContain(`tera build --target ${target}`);
    expect(hostReadme).toContain("compiled Terajs module artifacts");
  });
});