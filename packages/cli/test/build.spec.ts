import { describe, expect, it, vi } from "vitest";

import {
  buildWebTarget,
  collectBuildTarget,
  createBuildPlan,
  parseBuildTargets,
  resolveBuildTargets,
  runBuildCommand
} from "../src/build.js";
import type { TerajsWorkspaceConfig } from "@terajs/app/vite";

function createWorkspaceConfig(overrides: Partial<TerajsWorkspaceConfig> = {}): TerajsWorkspaceConfig {
  return {
    mode: "universal",
    sourceRoot: "C:/workspace/src/shared",
    targets: {
      selected: ["web", "android", "ios"],
      web: {
        outputDir: "C:/workspace/dist"
      },
      android: {
        generatedDir: "C:/workspace/.terajs/generated/android",
        hostDir: "C:/workspace/.terajs/hosts/android"
      },
      ios: {
        generatedDir: "C:/workspace/.terajs/generated/ios",
        hostDir: "C:/workspace/.terajs/hosts/ios"
      }
    },
    ...overrides
  };
}

describe("cli build planning", () => {
  it("collects repeated and comma-separated target values", () => {
    expect(collectBuildTarget("web, android", ["ios"])).toEqual(["ios", "web", "android"]);
  });

  it("normalizes requested targets into deterministic build order", () => {
    expect(parseBuildTargets(["ios", "web", "web"])).toEqual(["web", "ios"]);
  });

  it("defaults to workspace-selected targets when the CLI does not override them", () => {
    const workspace = createWorkspaceConfig();

    expect(resolveBuildTargets(workspace)).toEqual(["web", "android", "ios"]);
  });

  it("rejects targets that are not enabled in workspace.targets.selected", () => {
    const workspace = createWorkspaceConfig({
      mode: "web",
      targets: {
        selected: ["web"],
        web: { outputDir: "C:/workspace/dist" },
        android: {
          generatedDir: "C:/workspace/.terajs/generated/android",
          hostDir: "C:/workspace/.terajs/hosts/android"
        },
        ios: {
          generatedDir: "C:/workspace/.terajs/generated/ios",
          hostDir: "C:/workspace/.terajs/hosts/ios"
        }
      }
    });

    expect(() => resolveBuildTargets(workspace, ["android"])).toThrow('Target "android" is not enabled');
  });

  it("creates a mixed build plan with web output and pending native targets", () => {
    const workspace = createWorkspaceConfig();

    expect(createBuildPlan(workspace)).toEqual([
      {
        target: "web",
        kind: "web",
        outputDir: "C:/workspace/dist"
      },
      {
        target: "android",
        kind: "pending-native",
        generatedDir: "C:/workspace/.terajs/generated/android",
        hostDir: "C:/workspace/.terajs/hosts/android"
      },
      {
        target: "ios",
        kind: "pending-native",
        generatedDir: "C:/workspace/.terajs/generated/ios",
        hostDir: "C:/workspace/.terajs/hosts/ios"
      }
    ]);
  });
});

describe("cli web build execution", () => {
  it("uses the project Vite config when one exists", async () => {
    const viteBuild = vi.fn(async () => undefined);

    const result = await buildWebTarget(
      {
        target: "web",
        kind: "web",
        outputDir: "C:/workspace/dist/web"
      },
      {
        cwd: "C:/workspace",
        viteBuild,
        hasFile: (filePath) => filePath.endsWith("vite.config.ts")
      }
    );

    expect(viteBuild).toHaveBeenCalledWith({
      root: "C:/workspace",
      build: {
        outDir: "dist/web",
        manifest: true
      }
    });
    expect(result.detail).toContain("dist/web");
  });

  it("falls back to the app-facing Vite plugin when no project config exists", async () => {
    const viteBuild = vi.fn(async () => undefined);
    const pluginFactory = vi.fn(() => ({ name: "terajs" }));

    await buildWebTarget(
      {
        target: "web",
        kind: "web",
        outputDir: "C:/workspace/dist"
      },
      {
        cwd: "C:/workspace",
        viteBuild,
        hasFile: () => false,
        pluginFactory: pluginFactory as any
      }
    );

    expect(pluginFactory).toHaveBeenCalledTimes(1);
    expect(viteBuild).toHaveBeenCalledWith({
      root: "C:/workspace",
      build: {
        outDir: "dist",
        manifest: true
      },
      plugins: [{ name: "terajs" }]
    });
  });

  it("reports pending native targets but still completes when web builds", async () => {
    const result = await runBuildCommand(
      {},
      {
        cwd: "C:/workspace",
        getWorkspaceConfig: () => createWorkspaceConfig(),
        hasFile: () => true,
        viteBuild: vi.fn(async () => undefined)
      }
    );

    expect(result.targets).toEqual(["web", "android", "ios"]);
    expect(result.results).toEqual([
      {
        target: "web",
        status: "built",
        detail: "Production web bundle written to dist."
      },
      {
        target: "android",
        status: "pending",
        detail: "Native builder not implemented yet. Reserved output remains .terajs/generated/android with host shell at .terajs/hosts/android."
      },
      {
        target: "ios",
        status: "pending",
        detail: "Native builder not implemented yet. Reserved output remains .terajs/generated/ios with host shell at .terajs/hosts/ios."
      }
    ]);
  });

  it("fails when only unimplemented native targets are requested", async () => {
    await expect(() => runBuildCommand(
      { target: ["android"] },
      {
        cwd: "C:/workspace",
        getWorkspaceConfig: () => createWorkspaceConfig(),
        hasFile: () => true,
        viteBuild: vi.fn(async () => undefined)
      }
    )).rejects.toThrow('None of the requested targets are implemented yet. Requested: android.');
  });
});