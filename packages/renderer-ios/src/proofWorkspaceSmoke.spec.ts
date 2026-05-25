import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { IRModule } from "@terajs/compiler";

import type { UIKitNativeNode, UIKitNativeViewNode } from "./consumer.js";
import {
  createUIKitGeneratedRouteTransport,
  parseUIKitBridgeCommands,
  type UIKitGeneratedCompiledModule,
  type UIKitGeneratedRouteRecord,
} from "./index.js";
import { runBuildCommand } from "../../cli/src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "../../cli/test/proofWorkspaceTestHarness.js";

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

function collectTextValues(node: UIKitNativeNode): string[] {
  if (node.kind === "text") {
    const value = node.value.trim();
    return value.length > 0 ? [value] : [];
  }

  return node.children.flatMap((child) => collectTextValues(child));
}

function collectViews(node: UIKitNativeNode, viewType: string): UIKitNativeViewNode[] {
  if (node.kind === "text") {
    return [];
  }

  const matches = node.viewType === viewType ? [node] : [];
  return matches.concat(node.children.flatMap((child) => collectViews(child, viewType)));
}

function findButtonByText(root: UIKitNativeViewNode, label: string): UIKitNativeViewNode {
  const match = collectViews(root, "UIButton").find((node) => collectTextValues(node).includes(label));
  if (!match) {
    throw new Error(`Missing UIKit button with text \"${label}\".`);
  }

  return match;
}

async function loadGeneratedRuntimeInputs(tempWorkspace: string): Promise<{
  modules: UIKitGeneratedCompiledModule[];
  routes: UIKitGeneratedRouteRecord[];
}> {
  const generatedDir = path.join(tempWorkspace, ".terajs", "generated", "ios");
  const generatedManifest = JSON.parse(
    await readFile(path.join(generatedDir, "terajs-target.json"), "utf8")
  ) as {
    modules: Array<{
      kind: UIKitGeneratedCompiledModule["kind"];
      filePath: string;
      outputPath: string;
      name: string;
      importedBindings: string[];
      exposedBindings: string[];
    }>;
  };
  const routes = JSON.parse(
    await readFile(path.join(generatedDir, "routes.json"), "utf8")
  ) as UIKitGeneratedRouteRecord[];
  const modules = await Promise.all(generatedManifest.modules.map(async (moduleRecord) => {
    const compiledModule = JSON.parse(
      await readFile(path.join(generatedDir, moduleRecord.outputPath), "utf8")
    ) as {
      setupCode: string;
      ir: IRModule;
    };

    return {
      ...moduleRecord,
      setupCode: compiledModule.setupCode,
      ir: compiledModule.ir,
    };
  }));

  return { modules, routes };
}

describe("renderer-ios proof workspace smoke", () => {
  it("mounts generated proof route output through the UIKit wire runtime and rerenders after native events", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });

    const { modules, routes } = await loadGeneratedRuntimeInputs(tempWorkspace);
    const { route, transport } = createUIKitGeneratedRouteTransport({
      modules,
      routes,
      initialPath: "/",
    });

    expect(route.path).toBe("/");
    const initialBatch = transport.drainCommandBatchPayload();
    expect(initialBatch).not.toBeNull();
    expect(parseUIKitBridgeCommands(initialBatch!)).not.toHaveLength(0);

    const initialTexts = collectTextValues(transport.session.root);
    expect(initialTexts).toEqual(expect.arrayContaining([
      "Shared queue",
      "Selected slice",
      "Web host proof"
    ]));

    const toggleQueueButton = findButtonByText(transport.session.root, "Hide queue");
    expect(toggleQueueButton.subscribedEvents).toContain("tap");

    transport.dispatchNativeEventPacket({
      nodeId: toggleQueueButton.id,
      name: "tap",
      payload: { source: "native" }
    });
    await Promise.resolve();

    const updateBatch = transport.drainCommandBatchPayload();
    expect(updateBatch).not.toBeNull();
    expect(parseUIKitBridgeCommands(updateBatch!)).not.toHaveLength(0);

    expect(collectTextValues(transport.session.root)).toEqual(expect.arrayContaining([
      "Queue hidden while the selected proof stays mounted for the active host target."
    ]));
  });
});