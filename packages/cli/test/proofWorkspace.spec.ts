import { afterEach, describe, expect, it } from "vitest";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getWorkspaceConfig } from "@terajs/app/vite";

import { runBuildCommand } from "../src/build.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const proofWorkspaceRoot = path.join(repoRoot, "proofs", "shared-workspace");

async function copyProofWorkspace(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "terajs-proof-workspace-"));
  tempDirs.push(tempRoot);

  const tempWorkspace = path.join(tempRoot, "shared-workspace");
  await cp(proofWorkspaceRoot, tempWorkspace, { recursive: true });
  return tempWorkspace;
}

afterEach(async () => {
  process.chdir(originalCwd);
  await Promise.all(tempDirs.splice(0).map((dirPath) => rm(dirPath, { recursive: true, force: true })));
});

describe("proof workspace", () => {
  it("keeps a separate universal workspace that the CLI can build for android", async () => {
    expect(path.relative(repoRoot, proofWorkspaceRoot).replace(/\\/g, "/")).toBe("proofs/shared-workspace");

    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    const workspace = getWorkspaceConfig();

    expect(workspace.mode).toBe("universal");
    expect(workspace.targets.selected).toEqual(["web", "android", "ios"]);
    expect(path.relative(tempWorkspace, workspace.sourceRoot).replace(/\\/g, "/")).toBe("src/shared");

    const result = await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    expect(result.targets).toEqual(["android"]);
    expect(result.results).toEqual([
      {
        target: "android",
        status: "built",
        detail: "Native android artifacts written to .terajs/generated/android (3 modules, 1 routes) with host metadata in .terajs/hosts/android."
      }
    ]);

    const generatedManifest = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "android", "terajs-target.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      moduleCount: number;
      routeCount: number;
      routesFile: string;
      sourceRoot: string;
      generatedDir: string;
      hostDir: string;
      hostManifestFile: string;
      modules: Array<{
        kind: string;
        filePath: string;
        outputPath: string;
        name: string;
        importedBindings: string[];
        exposedBindings: string[];
      }>;
    };

    expect(generatedManifest).toMatchObject({
      target: "android",
      renderer: "android-views",
      moduleCount: 3,
      routeCount: 1,
      routesFile: "routes.json",
      sourceRoot: "src/shared",
      generatedDir: ".terajs/generated/android",
      hostDir: ".terajs/hosts/android",
      hostManifestFile: "../../hosts/android/terajs-host.json"
    });
    expect(generatedManifest.modules).toEqual([
      {
        kind: "component",
        filePath: "/src/shared/components/ProofCallout.tera",
        outputPath: "modules/components/ProofCallout.json",
        name: "ProofCallout",
        importedBindings: [],
        exposedBindings: ["title", "body"]
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

    const hostManifest = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "hosts", "android", "terajs-host.json"), "utf8")
    ) as {
      target: string;
      renderer: string;
      sourceRoot: string;
      generatedManifest: string;
      routesFile: string;
    };

    expect(hostManifest).toMatchObject({
      target: "android",
      renderer: "android-views",
      sourceRoot: "src/shared",
      generatedManifest: "../../generated/android/terajs-target.json",
      routesFile: "../../generated/android/routes.json"
    });
  });
});