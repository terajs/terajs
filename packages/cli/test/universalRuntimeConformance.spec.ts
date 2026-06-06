import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createContext, runInContext } from "node:vm";

import {
  createAndroidCommandConsumer,
  parseAndroidBridgeCommands,
  stringifyAndroidNativeEventPacket,
} from "../../renderer-android/src/index.js";
import {
  createUIKitCommandConsumer,
  parseUIKitBridgeCommands,
  stringifyUIKitNativeEventPacket,
} from "../../renderer-ios/src/index.js";
import { runBuildCommand } from "../src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "./proofWorkspaceTestHarness.js";

type NativeRoot = {
  children: NativeNode[];
  id: number;
  kind: "view";
  props: Record<string, unknown>;
  subscribedEvents: string[];
  viewType: string;
};

type NativeNode = NativeRoot | {
  kind: "text";
  value: string;
};

interface RuntimeHarness {
  dispatchNativeEvent(nodeId: number, name: string, payload?: unknown): void;
  emittedBatches: string[];
  root(): NativeRoot;
  start(runtimeEntry: string): Promise<void>;
}

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

function resolveWorkspaceAssetPath(workspaceRoot: string, assetPath: string): string {
  return path.join(workspaceRoot, ...assetPath.split("/").filter((segment) => segment.length > 0));
}

function collectTextValues(node: NativeNode): string[] {
  if (node.kind === "text") {
    const value = node.value.trim();
    return value.length > 0 ? [value] : [];
  }

  return node.children.flatMap((child) => collectTextValues(child));
}

function collectViews(node: NativeNode, viewType: string): NativeRoot[] {
  if (node.kind === "text") {
    return [];
  }

  const matches = node.viewType === viewType ? [node] : [];
  return matches.concat(node.children.flatMap((child) => collectViews(child, viewType)));
}

function findButtonByText(root: NativeRoot, viewType: string, label: string): NativeRoot {
  const match = collectViews(root, viewType).find((node) => collectTextValues(node).includes(label));
  if (!match) {
    throw new Error(`Missing ${viewType} with text "${label}".`);
  }

  return match;
}

function findStoryButtonByTarget(root: NativeRoot, viewType: string, targetId: string): NativeRoot {
  const match = collectViews(root, viewType).find((node) => node.props["data-story-target"] === targetId);
  if (!match) {
    throw new Error(`Missing story button with target "${targetId}".`);
  }

  return match;
}

function findTextInputByAction(root: NativeRoot, viewType: string, action: string): NativeRoot {
  const match = collectViews(root, viewType).find((node) => node.props["data-action"] === action);
  if (!match) {
    throw new Error(`Missing text input with action "${action}".`);
  }

  return match;
}

function collectStoryButtonTitles(root: NativeRoot, viewType: string): string[] {
  return collectViews(root, viewType)
    .filter((node) => typeof node.props["data-story-target"] === "string")
    .map((node) => String(node.props["data-story-title"] ?? ""));
}

function createAndroidRuntimeHarness(workspaceRoot: string): RuntimeHarness {
  const consumer = createAndroidCommandConsumer();
  const emittedBatches: string[] = [];
  let nativeEventHandler: ((payload: string) => void) | null = null;

  return {
    emittedBatches,
    root() {
      if (!consumer.root) {
        throw new Error("Android runtime has not mounted a root view.");
      }

      return consumer.root as NativeRoot;
    },
    async start(runtimeEntry: string): Promise<void> {
      const context = createContext({
        clearTimeout,
        console,
        queueMicrotask,
        setTimeout,
      }) as Record<string, unknown>;

      context.globalThis = context;
      context.__terajsNativeHost = {
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
      };

      runInContext(runtimeEntry, context, { filename: "android-live-runtime-entry.js" });
      await Promise.resolve(runInContext(
        "globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)",
        context,
        { filename: "android-live-runtime-entry-start.js" }
      ));
    },
    dispatchNativeEvent(nodeId: number, name: string, payload: unknown = { source: "native" }): void {
      if (!nativeEventHandler) {
        throw new Error("Android runtime did not register a native event handler.");
      }

      nativeEventHandler(stringifyAndroidNativeEventPacket({
        nodeId,
        name,
        payload,
      }));
    },
  };
}

function createUIKitRuntimeHarness(workspaceRoot: string): RuntimeHarness {
  const consumer = createUIKitCommandConsumer();
  const emittedBatches: string[] = [];
  let nativeEventHandler: ((payload: string) => void) | null = null;

  return {
    emittedBatches,
    root() {
      if (!consumer.root) {
        throw new Error("UIKit runtime has not mounted a root view.");
      }

      return consumer.root as NativeRoot;
    },
    async start(runtimeEntry: string): Promise<void> {
      const context = createContext({
        clearTimeout,
        console,
        queueMicrotask,
        setTimeout,
      }) as Record<string, unknown>;

      context.globalThis = context;
      context.__terajsNativeHost = {
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
      };

      runInContext(runtimeEntry, context, { filename: "uikit-live-runtime-entry.js" });
      await Promise.resolve(runInContext(
        "globalThis.__terajsNativeRuntime.start(globalThis.__terajsNativeHost)",
        context,
        { filename: "uikit-live-runtime-entry-start.js" }
      ));
    },
    dispatchNativeEvent(nodeId: number, name: string, payload: unknown = { source: "native" }): void {
      if (!nativeEventHandler) {
        throw new Error("UIKit runtime did not register a native event handler.");
      }

      nativeEventHandler(stringifyUIKitNativeEventPacket({
        nodeId,
        name,
        payload,
      }));
    },
  };
}

async function loadRuntimeEntry(workspaceRoot: string, target: "android" | "ios"): Promise<string> {
  return readFile(
    path.join(workspaceRoot, ".terajs", "generated", target, "runtime", "live-runtime-entry.js"),
    "utf8"
  );
}

function visibleProofState(root: NativeRoot, storyButtonViewType: string): Record<string, unknown> {
  const texts = collectTextValues(root);

  return {
    hasHostNoteFilterInactive: texts.includes("Feed note filter inactive."),
    hasQueueHiddenMessage: texts.includes("Feed hidden while the selected social proof stays mounted for the active host target."),
    hasDomTargetProof: texts.includes("Production DOM proof"),
    storyButtons: collectStoryButtonTitles(root, storyButtonViewType),
  };
}

describe("universal native runtime conformance", () => {
  it("keeps emitted Android and iOS live runtime behavior aligned for shared proof interactions", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android", "ios"] }, { cwd: tempWorkspace });

    const [androidRuntimeEntry, iosRuntimeEntry] = await Promise.all([
      loadRuntimeEntry(tempWorkspace, "android"),
      loadRuntimeEntry(tempWorkspace, "ios"),
    ]);
    const android = createAndroidRuntimeHarness(tempWorkspace);
    const ios = createUIKitRuntimeHarness(tempWorkspace);

    await Promise.all([
      android.start(androidRuntimeEntry),
      ios.start(iosRuntimeEntry),
    ]);

    expect(visibleProofState(android.root(), "Button")).toEqual(visibleProofState(ios.root(), "UIButton"));

    const androidFilter = findTextInputByAction(android.root(), "EditText", "host-note-filter");
    const iosFilter = findTextInputByAction(ios.root(), "UITextField", "host-note-filter");
    android.dispatchNativeEvent(androidFilter.id, "input", { text: "Android" });
    ios.dispatchNativeEvent(iosFilter.id, "input", { value: "Android" });

    expect(collectTextValues(android.root())).toContain('Filtering feed note by "Android".');
    expect(collectTextValues(ios.root())).toContain('Filtering feed note by "Android".');

    const androidStory = findStoryButtonByTarget(android.root(), "Button", "charlie");
    const iosStory = findStoryButtonByTarget(ios.root(), "UIButton", "charlie");
    android.dispatchNativeEvent(androidStory.id, "press");
    ios.dispatchNativeEvent(iosStory.id, "tap");

    const androidPromote = findButtonByText(android.root(), "Button", "Pin selected");
    const iosPromote = findButtonByText(ios.root(), "UIButton", "Pin selected");
    android.dispatchNativeEvent(androidPromote.id, "press");
    ios.dispatchNativeEvent(iosPromote.id, "tap");

    expect(visibleProofState(android.root(), "Button")).toEqual(visibleProofState(ios.root(), "UIButton"));
    expect(collectStoryButtonTitles(android.root(), "Button")).toEqual([
      "Phone mirror is scrolling through six real posts, not a placeholder splash screen.",
      "The DOM build is live. Same Terajs route, same feed cards, production bundle ready.",
      "Android artifacts just landed: route manifest, modules, bootstrap commands, live runtime.",
      "Like, Reply, and Share controls stay in the card so the native view tree has real buttons.",
      "One source root builds deliberately: DOM first, Android next, iOS source smoke later.",
      "Final reveal: desktop preview on the left, Android device on the right, same feed copy.",
    ]);
    expect(collectStoryButtonTitles(ios.root(), "UIButton")).toEqual([
      "Phone mirror is scrolling through six real posts, not a placeholder splash screen.",
      "The DOM build is live. Same Terajs route, same feed cards, production bundle ready.",
      "Android artifacts just landed: route manifest, modules, bootstrap commands, live runtime.",
      "Like, Reply, and Share controls stay in the card so the native view tree has real buttons.",
      "One source root builds deliberately: DOM first, Android next, iOS source smoke later.",
      "Final reveal: desktop preview on the left, Android device on the right, same feed copy.",
    ]);

    const androidToggleQueue = findButtonByText(android.root(), "Button", "Hide feed");
    const iosToggleQueue = findButtonByText(ios.root(), "UIButton", "Hide feed");
    android.dispatchNativeEvent(androidToggleQueue.id, "press");
    ios.dispatchNativeEvent(iosToggleQueue.id, "tap");

    expect(visibleProofState(android.root(), "Button")).toEqual(visibleProofState(ios.root(), "UIButton"));
  });
});
