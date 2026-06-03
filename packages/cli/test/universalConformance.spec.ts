import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { runBuildCommand } from "../src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "./proofWorkspaceTestHarness.js";

interface GeneratedManifest {
  renderer: string;
  target: string;
  modules: Array<{
    kind: string;
    filePath: string;
    importedBindings: string[];
    exposedBindings: string[];
    name: string;
    outputPath: string;
  }>;
}

interface GeneratedRouteRecord {
  asset?: string;
  component: string;
  path: string;
}

interface RuntimeDescriptor {
  entryScriptFile: string;
  generatedManifestFile: string;
  initialRoutePath: string;
  kind: string;
  routesFile: string;
}

interface GeneratedModuleFile {
  ir: unknown;
  setupCode: string;
}

interface GeneratedTargetSnapshot {
  manifest: GeneratedManifest;
  moduleFiles: Record<string, GeneratedModuleFile>;
  routes: GeneratedRouteRecord[];
  runtimeDescriptor: RuntimeDescriptor;
}

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

function comparableModules(manifest: GeneratedManifest): Array<Record<string, unknown>> {
  return manifest.modules
    .map((moduleRecord) => ({
      exposedBindings: moduleRecord.exposedBindings,
      filePath: moduleRecord.filePath,
      importedBindings: moduleRecord.importedBindings,
      kind: moduleRecord.kind,
      name: moduleRecord.name,
    }))
    .sort((left, right) => `${left.kind}:${left.name}`.localeCompare(`${right.kind}:${right.name}`));
}

function comparableRoutes(routes: GeneratedRouteRecord[]): Array<Record<string, unknown>> {
  return routes
    .map((route) => ({
      asset: route.asset,
      component: route.component,
      path: route.path,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

async function readGeneratedTargetSnapshot(workspaceRoot: string, target: "android" | "ios"): Promise<GeneratedTargetSnapshot> {
  const generatedRoot = path.join(workspaceRoot, ".terajs", "generated", target);

  const [manifest, routes, runtimeDescriptor] = await Promise.all([
    readFile(path.join(generatedRoot, "terajs-target.json"), "utf8").then((text) => JSON.parse(text) as GeneratedManifest),
    readFile(path.join(generatedRoot, "routes.json"), "utf8").then((text) => JSON.parse(text) as GeneratedRouteRecord[]),
    readFile(path.join(generatedRoot, "runtime", "generated-route-runtime.json"), "utf8")
      .then((text) => JSON.parse(text) as RuntimeDescriptor),
  ]);
  const moduleFiles = Object.fromEntries(await Promise.all(manifest.modules.map(async (moduleRecord) => [
    moduleRecord.outputPath,
    JSON.parse(await readFile(path.join(generatedRoot, moduleRecord.outputPath), "utf8")) as GeneratedModuleFile,
  ])));

  return {
    manifest,
    moduleFiles,
    routes,
    runtimeDescriptor,
  };
}

describe("universal native conformance matrix", () => {
  it("keeps Android and iOS generated proof artifacts aligned across shared source", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android", "ios"] }, { cwd: tempWorkspace });

    const android = await readGeneratedTargetSnapshot(tempWorkspace, "android");
    const ios = await readGeneratedTargetSnapshot(tempWorkspace, "ios");

    expect(android.manifest).toMatchObject({
      target: "android",
      renderer: "android-views",
    });
    expect(ios.manifest).toMatchObject({
      target: "ios",
      renderer: "uikit-views",
    });
    expect(comparableModules(android.manifest)).toEqual(comparableModules(ios.manifest));
    expect(comparableRoutes(android.routes)).toEqual(comparableRoutes(ios.routes));
    expect(android.runtimeDescriptor).toEqual(ios.runtimeDescriptor);
    expect(android.moduleFiles).toEqual(ios.moduleFiles);
    expect(android.moduleFiles["modules/components/ProofStateBoard.json"].setupCode).toContain("hostNoteFilter");
    expect(android.moduleFiles["modules/components/ProofStateBoard.json"].setupCode).toContain("promoteSelected");
  });
});
