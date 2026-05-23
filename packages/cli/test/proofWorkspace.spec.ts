import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";

import { getWorkspaceConfig } from "@terajs/app/vite";

import { runBuildCommand } from "../src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "./proofWorkspaceTestHarness.js";

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

describe("proof workspace", () => {
  it("materializes a universal workspace fixture that the CLI can build for web", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    const workspace = getWorkspaceConfig();

    expect(workspace.mode).toBe("universal");
    expect(workspace.targets.selected).toEqual(["web", "android", "ios"]);
    expect(path.relative(tempWorkspace, workspace.sourceRoot).replace(/\\/g, "/")).toBe("src/shared");

    const result = await runBuildCommand({ target: ["web"] }, {
      cwd: tempWorkspace,
      viteBuild
    });

    expect(result.targets).toEqual(["web"]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      target: "web",
      status: "built",
      detail: "Production web bundle written to dist."
    });

    const manifest = JSON.parse(
      await readFile(path.join(tempWorkspace, "dist", ".vite", "manifest.json"), "utf8")
    ) as Record<string, unknown>;

    expect(manifest).toBeTruthy();
    expect(Object.keys(manifest).length).toBeGreaterThan(0);
    await expect(readFile(path.join(tempWorkspace, "dist", "index.html"), "utf8")).resolves.toContain("<script");
  });

  it("materializes a universal workspace fixture that the CLI can build for android", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    const workspace = getWorkspaceConfig();

    expect(workspace.mode).toBe("universal");
    expect(workspace.targets.selected).toEqual(["web", "android", "ios"]);
    expect(path.relative(tempWorkspace, workspace.sourceRoot).replace(/\\/g, "/")).toBe("src/shared");

    const result = await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    expect(result.targets).toEqual(["android"]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      target: "android",
      status: "built"
    });
    expect(result.results[0]?.detail).toContain(".terajs/generated/android");
    expect(result.results[0]?.detail).toContain(".terajs/hosts/android");

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
      routesFile: "routes.json",
      sourceRoot: "src/shared",
      generatedDir: ".terajs/generated/android",
      hostDir: ".terajs/hosts/android",
      hostManifestFile: "../../hosts/android/terajs-host.json"
    });
    expect(generatedManifest.moduleCount).toBeGreaterThanOrEqual(3);
    expect(generatedManifest.routeCount).toBeGreaterThanOrEqual(1);
    expect(generatedManifest.modules).toEqual(expect.arrayContaining([
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
    ]));

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