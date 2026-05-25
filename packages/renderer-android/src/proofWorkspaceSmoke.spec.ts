import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { IRModule } from "@terajs/compiler";
import { clearDebugHistory, normalizeSharedDebugEvent, readDebugHistory } from "@terajs/shared";

import type { AndroidNativeNode, AndroidNativeViewNode } from "./consumer.js";
import {
  createAndroidGeneratedRouteTransport,
  parseAndroidBridgeCommands,
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
});