import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import type { UIKitNativeNode, UIKitNativeViewNode } from "./consumer.js";
import { createUIKitHostSession } from "./index.js";
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

describe("renderer-ios proof workspace smoke", () => {
  it("mounts generated proof output through the UIKit host session", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });

    const generatedModule = JSON.parse(
      await readFile(
        path.join(tempWorkspace, ".terajs", "generated", "ios", "modules", "components", "ProofStateBoard.json"),
        "utf8"
      )
    ) as {
      ir: IRModule;
      setupCode: string;
    };

    const bindings = executeCompiledSetup(generatedModule.setupCode);
    const session = createUIKitHostSession();
    session.mountIRModule(generatedModule.ir, bindings);

    const initialTexts = collectTextValues(session.root);
    expect(initialTexts).toEqual(expect.arrayContaining([
      "Shared queue",
      "Selected slice",
      "Web host proof"
    ]));

    const toggleQueueButton = findButtonByText(session.root, "Hide queue");
    expect(toggleQueueButton.subscribedEvents).toContain("tap");

    session.dispatchNativeEvent(toggleQueueButton.id, "tap", { source: "native" });
    await Promise.resolve();

    expect(collectTextValues(session.root)).toEqual(expect.arrayContaining([
      "Queue hidden while the selected proof stays mounted for the active host target."
    ]));
  });
});