import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";

import type { AndroidNativeNode, AndroidNativeViewNode } from "./consumer.js";
import {
  createAndroidCommandConsumer,
  stringifyAndroidNativeEventPacket,
} from "./index.js";
import { runBuildCommand } from "../../cli/src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "../../cli/test/proofWorkspaceTestHarness.js";
import { afterEach, describe, expect, it } from "vitest";

const fixtureRoot = path.join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "android",
  "src",
  "test",
  "resources",
  "proof-runtime-generated"
);

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

function resolveFixturePath(relativePath: string): string {
  return path.join(fixtureRoot, ...relativePath.split("/"));
}

function normalizeGeneratedManifest(text: string) {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  delete parsed.generatedAt;
  return parsed;
}

function normalizeTextNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n");
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

function findTextInputByAction(root: AndroidNativeViewNode, action: string): AndroidNativeViewNode {
  const match = collectViews(root, "EditText").find((node) => node.props["data-action"] === action);
  if (!match) {
    throw new Error(`Missing Android text input with action "${action}".`);
  }

  return match;
}

function resolveGeneratedWorkspaceAssetPath(workspaceRoot: string, assetPath: string): string {
  return path.join(workspaceRoot, ...assetPath.split("/").filter((segment) => segment.length > 0));
}

function resolveFixtureAssetPath(assetPath: string): string {
  const normalizedPath = assetPath.replace(/\\/g, "/");
  const relativePath = normalizedPath.startsWith(".terajs/generated/android/")
    ? normalizedPath.slice(".terajs/generated/android/".length)
    : normalizedPath;

  return resolveFixturePath(relativePath);
}

function createGeneratedRuntimeHarness(readTextAsset: (assetPath: string) => string) {
  const consumer = createAndroidCommandConsumer();
  const emittedBatches: string[] = [];
  let nativeEventHandler: ((payload: string) => void) | null = null;

  return {
    consumer,
    emittedBatches,
    host: {
      runtimeDescriptorPath: ".terajs/generated/android/runtime/generated-route-runtime.json",
      readTextAsset,
      emitCommandBatch(payload: string): void {
        emittedBatches.push(payload);
        consumer.applyCommands(JSON.parse(payload) as ReturnType<typeof JSON.parse>);
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

async function startGeneratedRuntime(
  runtimeEntryPath: string,
  readTextAsset: (assetPath: string) => string
) {
  const runtimeEntry = await readFile(runtimeEntryPath, "utf8");
  const harness = createGeneratedRuntimeHarness(readTextAsset);
  const context = createContext({
    clearTimeout,
    console,
    queueMicrotask,
    setTimeout,
  }) as Record<string, unknown>;

  context.globalThis = context;
  context.__terajsNativeHost = harness.host;

  runInContext(runtimeEntry, context, {
    filename: path.basename(runtimeEntryPath),
  });
  runInContext("globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)", context, {
    filename: `${path.basename(runtimeEntryPath)}:start`,
  });

  return harness;
}

describe("renderer-android proof runtime fixture", () => {
  it("keeps the checked-in Android real-runtime fixture in sync with the current proof workspace output", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const generatedRoot = path.join(tempWorkspace, ".terajs", "generated", "android");
    const fixtureManifestText = await readFile(resolveFixturePath("terajs-target.json"), "utf8");
    const generatedManifestText = await readFile(path.join(generatedRoot, "terajs-target.json"), "utf8");

    expect(normalizeGeneratedManifest(fixtureManifestText)).toEqual(
      normalizeGeneratedManifest(generatedManifestText)
    );

    expect(normalizeTextNewlines(await readFile(resolveFixturePath("routes.json"), "utf8"))).toBe(
      normalizeTextNewlines(await readFile(path.join(generatedRoot, "routes.json"), "utf8"))
    );
    expect(normalizeTextNewlines(await readFile(resolveFixturePath("runtime/generated-route-runtime.json"), "utf8"))).toBe(
      normalizeTextNewlines(await readFile(path.join(generatedRoot, "runtime", "generated-route-runtime.json"), "utf8"))
    );

    const fixtureManifest = JSON.parse(fixtureManifestText) as {
      modules?: Array<{ outputPath: string }>;
    };
    const moduleOutputPaths = (fixtureManifest.modules ?? []).map((record) => record.outputPath);

    expect(moduleOutputPaths.length).toBeGreaterThan(0);

    for (const outputPath of moduleOutputPaths) {
      expect(normalizeTextNewlines(await readFile(resolveFixturePath(outputPath), "utf8"))).toBe(
        normalizeTextNewlines(await readFile(path.join(generatedRoot, ...outputPath.split("/")), "utf8"))
      );
    }

    const freshHarness = await startGeneratedRuntime(
      path.join(generatedRoot, "runtime", "live-runtime-entry.js"),
      (assetPath) => readFileSync(resolveGeneratedWorkspaceAssetPath(tempWorkspace, assetPath), "utf8")
    );
    const fixtureHarness = await startGeneratedRuntime(
      resolveFixturePath("runtime/live-runtime-entry.js"),
      (assetPath) => readFileSync(resolveFixtureAssetPath(assetPath), "utf8")
    );

    expect(freshHarness.emittedBatches.length).toBeGreaterThan(0);
    expect(fixtureHarness.emittedBatches.length).toBeGreaterThan(0);
    expect(freshHarness.consumer.root).not.toBeNull();
    expect(fixtureHarness.consumer.root).not.toBeNull();
    expect(collectTextValues(fixtureHarness.consumer.root!)).toEqual(
      collectTextValues(freshHarness.consumer.root!)
    );

    const freshInput = findTextInputByAction(freshHarness.consumer.root!, "host-note-filter");
    const fixtureInput = findTextInputByAction(fixtureHarness.consumer.root!, "host-note-filter");

    freshHarness.dispatchNativeEvent(freshInput.id, "textInput", { text: "Android" });
    fixtureHarness.dispatchNativeEvent(fixtureInput.id, "textInput", { text: "Android" });
    await Promise.resolve();

    expect(collectTextValues(fixtureHarness.consumer.root!)).toEqual(
      collectTextValues(freshHarness.consumer.root!)
    );
    expect(collectTextValues(fixtureHarness.consumer.root!)).toContain(
      'Filtering feed note by "Android".'
    );
  });
});
