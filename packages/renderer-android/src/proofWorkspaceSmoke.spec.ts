import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createContext, runInContext } from "node:vm";

import type { IRModule } from "@terajs/compiler";
import { clearDebugHistory, normalizeSharedDebugEvent, readDebugHistory } from "@terajs/shared";

import type { AndroidNativeNode, AndroidNativeViewNode } from "./consumer.js";
import {
  createAndroidCommandConsumer,
  createAndroidGeneratedRouteTransport,
  parseAndroidBridgeCommands,
  stringifyAndroidNativeEventPacket,
  type AndroidGeneratedCompiledModule,
  type AndroidGeneratedRouteRecord,
} from "./index.js";
import { runBuildCommand } from "../../cli/src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "../../cli/test/proofWorkspaceTestHarness.js";

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

function collectTextValues(node: AndroidNativeNode): string[] {
  if (node.kind === "text") {
    const value = node.value.trim();
    return value.length > 0 ? [value] : [];
  }

  return node.children.flatMap((child) => collectTextValues(child));
}

function collectViews(node: AndroidNativeNode, viewType: string): AndroidNativeViewNode[] {
  if (node.kind === "text") {
    return [];
  }

  const matches = node.viewType === viewType ? [node] : [];
  return matches.concat(node.children.flatMap((child) => collectViews(child, viewType)));
}

function findButtonByText(root: AndroidNativeViewNode, label: string): AndroidNativeViewNode {
  const match = collectViews(root, "Button").find((node) => collectTextValues(node).includes(label));
  if (!match) {
    throw new Error(`Missing Android button with text \"${label}\".`);
  }

  return match;
}

function findStoryButtonByTarget(root: AndroidNativeViewNode, targetId: string): AndroidNativeViewNode {
  const match = collectViews(root, "Button").find((node) => node.props["data-story-target"] === targetId);
  if (!match) {
    throw new Error(`Missing Android proof story button with target \"${targetId}\".`);
  }

  return match;
}

function findTextInputByAction(root: AndroidNativeViewNode, action: string): AndroidNativeViewNode {
  const match = collectViews(root, "EditText").find((node) => node.props["data-action"] === action);
  if (!match) {
    throw new Error(`Missing Android text input with action \"${action}\".`);
  }

  return match;
}

function collectStoryButtonTitles(root: AndroidNativeViewNode): string[] {
  return collectViews(root, "Button")
    .filter((node) => typeof node.props["data-story-target"] === "string")
    .map((node) => collectTextValues(node)[0] ?? "");
}

async function loadGeneratedRuntimeInputs(tempWorkspace: string): Promise<{
  modules: AndroidGeneratedCompiledModule[];
  routes: AndroidGeneratedRouteRecord[];
}> {
  const generatedDir = path.join(tempWorkspace, ".terajs", "generated", "android");
  const generatedManifest = JSON.parse(
    await readFile(path.join(generatedDir, "terajs-target.json"), "utf8")
  ) as {
    modules: Array<{
      kind: AndroidGeneratedCompiledModule["kind"];
      filePath: string;
      outputPath: string;
      name: string;
      importedBindings: string[];
      exposedBindings: string[];
    }>;
  };
  const routes = JSON.parse(
    await readFile(path.join(generatedDir, "routes.json"), "utf8")
  ) as AndroidGeneratedRouteRecord[];
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
  const consumer = createAndroidCommandConsumer();
  const emittedBatches: string[] = [];
  let nativeEventHandler: ((payload: string) => void) | null = null;

  return {
    consumer,
    emittedBatches,
    host: {
      runtimeDescriptorPath: ".terajs/generated/android/runtime/generated-route-runtime.json",
      readTextAsset(assetPath: string): string {
        return readFileSync(resolveWorkspaceAssetPath(workspaceRoot, assetPath), "utf8");
      },
      emitCommandBatch(payload: string): void {
        emittedBatches.push(payload);
        consumer.applyCommands(parseAndroidBridgeCommands(payload));
      },
      onNativeEvent(handler: (payload: string) => void): void {
        nativeEventHandler = handler;
      },
      setNativeEventHandler(handler: (payload: string) => void): void {
        nativeEventHandler = handler;
      },
    },
    dispatchNativeEvent(nodeId: number, name: string, payload: unknown = { source: "native" }): void {
      if (!nativeEventHandler) {
        throw new Error("Generated Android runtime did not register a native event handler.");
      }

      nativeEventHandler(stringifyAndroidNativeEventPacket({
        nodeId,
        name,
        payload,
      }));
    },
  };
}

describe("renderer-android proof workspace smoke", () => {
  it("mounts generated proof route output through the Android wire runtime and rerenders after native events", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    clearDebugHistory();
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const { modules, routes } = await loadGeneratedRuntimeInputs(tempWorkspace);
    const { route, transport } = createAndroidGeneratedRouteTransport({
      modules,
      routes,
      initialPath: "/",
    });

    expect(route.path).toBe("/");
    const initialBatch = transport.drainCommandBatchPayload();
    expect(initialBatch).not.toBeNull();
    expect(parseAndroidBridgeCommands(initialBatch!)).not.toHaveLength(0);

    const initialTexts = collectTextValues(transport.session.root);
    expect(initialTexts).toEqual(expect.arrayContaining([
      "Shared queue",
      "Selected slice",
      "Web host proof"
    ]));

    const toggleQueueButton = findButtonByText(transport.session.root, "Hide queue");
    expect(toggleQueueButton.subscribedEvents).toContain("press");

    transport.dispatchNativeEventPacket({
      nodeId: toggleQueueButton.id,
      name: "press",
      payload: { source: "native" }
    });
    await Promise.resolve();

    const updateBatch = transport.drainCommandBatchPayload();
    expect(updateBatch).not.toBeNull();
    expect(parseAndroidBridgeCommands(updateBatch!)).not.toHaveLength(0);

    expect(collectTextValues(transport.session.root)).toEqual(expect.arrayContaining([
      "Queue hidden while the selected proof stays mounted for the active host target."
    ]));

    const bridgeEvents = readDebugHistory().flatMap((event) => {
      const normalized = normalizeSharedDebugEvent(event);
      return normalized && normalized.type.startsWith("bridge:") ? [normalized] : [];
    });

    expect(bridgeEvents.find((event) => event.type === "bridge:commands")?.payload).toMatchObject({
      target: "android",
      direction: "js-to-host",
      commandCount: expect.any(Number)
    });
    expect(bridgeEvents.find((event) => event.type === "bridge:event")?.payload).toMatchObject({
      target: "android",
      direction: "host-to-js",
      eventName: "press",
      nodeId: toggleQueueButton.id
    });
  });

  it("evaluates the emitted Android live runtime bundle against the proof workspace host loop", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"),
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
    runInContext("globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)", context, {
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
    expect(toggleQueueButton.subscribedEvents).toContain("press");

    const batchCountBeforeEvent = harness.emittedBatches.length;
    harness.dispatchNativeEvent(toggleQueueButton.id, "press");

    expect(harness.emittedBatches.length).toBeGreaterThan(batchCountBeforeEvent);
    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      "Queue hidden while the selected proof stays mounted for the active host target."
    ]));
  });

  it("updates the host note filter through the emitted Android live runtime bundle", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"),
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
    runInContext("globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)", context, {
      filename: "live-runtime-entry-start.js",
    });

    expect(harness.consumer.root).not.toBeNull();
    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      "Host note filter inactive."
    ]));

    const filterInput = findTextInputByAction(harness.consumer.root!, "host-note-filter");
    expect(filterInput.subscribedEvents).toContain("change");

    const batchCountBeforeEvent = harness.emittedBatches.length;
    harness.dispatchNativeEvent(filterInput.id, "input", { text: "Android" });

    expect(harness.emittedBatches.length).toBeGreaterThan(batchCountBeforeEvent);
    expect(filterInput.props.text).toBe("Android");
    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      'Filtering host note by "Android".'
    ]));
  });

  it("preserves keyed queue identity through the emitted Android live runtime bundle", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const runtimeEntry = await readFile(
      path.join(tempWorkspace, ".terajs", "generated", "android", "runtime", "live-runtime-entry.js"),
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
    runInContext("globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)", context, {
      filename: "live-runtime-entry-start.js",
    });

    expect(harness.consumer.root).not.toBeNull();
    expect(collectStoryButtonTitles(harness.consumer.root!)).toEqual([
      "Web shell parity",
      "Android command fidelity",
      "iOS bridge readiness",
    ]);

    const selectedAndroidStory = findStoryButtonByTarget(harness.consumer.root!, "bravo");
    harness.dispatchNativeEvent(selectedAndroidStory.id, "press");

    expect(collectTextValues(harness.consumer.root!)).toEqual(expect.arrayContaining([
      "Android host proof",
      "Android command fidelity",
    ]));

    const promoteSelectedButton = findButtonByText(harness.consumer.root!, "Promote selected");
    harness.dispatchNativeEvent(promoteSelectedButton.id, "press");

    expect(collectStoryButtonTitles(harness.consumer.root!)).toEqual([
      "Android command fidelity",
      "Web shell parity",
      "iOS bridge readiness",
    ]);
    expect(findStoryButtonByTarget(harness.consumer.root!, "bravo").id).toBe(selectedAndroidStory.id);
  });
});