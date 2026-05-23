import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";
import { clearDebugHistory, normalizeSharedDebugEvent, readDebugHistory } from "@terajs/shared";

import type { AndroidNativeNode, AndroidNativeViewNode } from "./consumer.js";
import { createAndroidWireTransport } from "./index.js";
import { runBuildCommand } from "../../cli/src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "../../cli/test/proofWorkspaceTestHarness.js";

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

function executeCompiledSetup(setupCode: string): Record<string, unknown> {
  const createSetup = new Function(
    "signal",
    `${setupCode}\nreturn __ssfc;`
  ) as (signalFactory: typeof signal) => (ctx: {
    props: Record<string, unknown>;
    slots: Record<string, unknown>;
    emit: (...args: unknown[]) => void;
  }) => Record<string, unknown>;

  const setup = createSetup(signal);
  return setup({
    props: {},
    slots: {},
    emit: () => {}
  });
}

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

describe("renderer-android proof workspace smoke", () => {
  it("mounts generated proof output through the Android host session", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    clearDebugHistory();
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const generatedModule = JSON.parse(
      await readFile(
        path.join(tempWorkspace, ".terajs", "generated", "android", "modules", "components", "ProofStateBoard.json"),
        "utf8"
      )
    ) as {
      ir: IRModule;
      setupCode: string;
    };

    const bindings = executeCompiledSetup(generatedModule.setupCode);
    const transport = createAndroidWireTransport();
    transport.session.mountIRModule(generatedModule.ir, bindings);
    expect(transport.drainCommandBatchPayload()).not.toBeNull();

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