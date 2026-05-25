import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createContext, runInContext } from "node:vm";

import type { IRModule } from "@terajs/compiler";

import type { UIKitNativeNode, UIKitNativeViewNode } from "./consumer.js";
import {
  createUIKitCommandConsumer,
  createUIKitGeneratedRouteTransport,
  parseUIKitBridgeCommands,
  stringifyUIKitNativeEventPacket,
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

function findStoryButtonByTarget(root: UIKitNativeViewNode, targetId: string): UIKitNativeViewNode {
  const match = collectViews(root, "UIButton").find((node) => node.props["data-story-target"] === targetId);
  if (!match) {
    throw new Error(`Missing UIKit proof story button with target \"${targetId}\".`);
  }

  return match;
}

function collectStoryButtonTitles(root: UIKitNativeViewNode): string[] {
  return collectViews(root, "UIButton")
    .filter((node) => typeof node.props["data-story-target"] === "string")
    .map((node) => collectTextValues(node)[0] ?? "");
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

function resolveWorkspaceAssetPath(workspaceRoot: string, assetPath: string): string {
  return path.join(workspaceRoot, ...assetPath.split("/").filter((segment) => segment.length > 0));
}

function createGeneratedRuntimeHarness(workspaceRoot: string) {
  const consumer = createUIKitCommandConsumer();
  const emittedBatches: string[] = [];
  let nativeEventHandler: ((payload: string) => void) | null = null;

  return {
    consumer,
    emittedBatches,
    host: {
      runtimeDescriptorPath: ".terajs/generated/ios/runtime/generated-route-runtime.json",
      readTextAsset(assetPath: string): string {
        return readFileSync(resolveWorkspaceAssetPath(workspaceRoot, assetPath), "utf8");
      },
      emitCommandBatch(payload: string): void {
        emittedBatches.push(payload);
        consumer.applyCommands(parseUIKitBridgeCommands(payload));
      },
      onNativeEvent(handler: (payload: string) => void): void {
        nativeEventHandler = handler;
      },
      setNativeEventHandler(handler: (payload: string) => void): void {
        nativeEventHandler = handler;
      },
    },
    dispatchNativeEvent(nodeId: number, name: string): void {
      if (!nativeEventHandler) {
        throw new Error("Generated UIKit runtime did not register a native event handler.");
      }

      nativeEventHandler(stringifyUIKitNativeEventPacket({
        nodeId,
        name,
        payload: { source: "native" },
      }));
    },
  };
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

  it("evaluates the emitted UIKit live runtime bundle against the proof workspace host loop", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"),
      "utf8"
    );
    const harness = createGeneratedRuntimeHarness(tempWorkspace);
    const context = createContext({
      clearTimeout,
      console,
      queueMicrotask,
      setTimeout,
    }) as Record<string, unknown>;

    context.globalThis = context;
    context.__terajsNativeHost = harness.host;

    runInContext(runtimeEntry, context, {
      filename: "live-runtime-entry.js",
    });
    await runInContext("globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)", context, {
      filename: "live-runtime-entry-start.js",
    });

    expect(harness.emittedBatches.length).toBeGreaterThan(0);
    expect(harness.consumer.root).not.toBeNull();
    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      "Shared queue",
      "Selected slice",
      "Web host proof"
    ]));

    const toggleQueueButton = findButtonByText(harness.consumer.root!, "Hide queue");
    expect(toggleQueueButton.subscribedEvents).toContain("tap");

    const batchCountBeforeEvent = harness.emittedBatches.length;
    harness.dispatchNativeEvent(toggleQueueButton.id, "tap");

    expect(harness.emittedBatches.length).toBeGreaterThan(batchCountBeforeEvent);
    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      "Queue hidden while the selected proof stays mounted for the active host target."
    ]));
  });

  it("preserves keyed queue identity through the emitted UIKit live runtime bundle", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"),
      "utf8"
    );
    const harness = createGeneratedRuntimeHarness(tempWorkspace);
    const context = createContext({
      clearTimeout,
      console,
      queueMicrotask,
      setTimeout,
    }) as Record<string, unknown>;

    context.globalThis = context;
    context.__terajsNativeHost = harness.host;

    runInContext(runtimeEntry, context, {
      filename: "live-runtime-entry.js",
    });
    await runInContext("globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)", context, {
      filename: "live-runtime-entry-start.js",
    });

    expect(harness.consumer.root).not.toBeNull();
    expect(collectStoryButtonTitles(harness.consumer.root!)).toEqual([
      "Web shell parity",
      "Android command fidelity",
      "iOS bridge readiness",
    ]);

    const selectedAndroidStory = findStoryButtonByTarget(harness.consumer.root!, "bravo");
    harness.dispatchNativeEvent(selectedAndroidStory.id, "tap");

    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      "Android host proof",
      "Android command fidelity",
    ]));

    const promoteSelectedButton = findButtonByText(harness.consumer.root!, "Promote selected");
    harness.dispatchNativeEvent(promoteSelectedButton.id, "tap");

    expect(collectStoryButtonTitles(harness.consumer.root!)).toEqual([
      "Android command fidelity",
      "Web shell parity",
      "iOS bridge readiness",
    ]);
    expect(findStoryButtonByTarget(harness.consumer.root!, "bravo").id).toBe(selectedAndroidStory.id);
  });
});