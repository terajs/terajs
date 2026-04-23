import type { AICodeReference } from "./aiDebugContext.js";
import type { SafeDocumentContext, SafeDocumentContextSummary, SafeDocumentDiagnostic } from "./documentContext.js";

export const DEVTOOLS_BRIDGE_READY_EVENT = "terajs:devtools:bridge:ready";
export const DEVTOOLS_BRIDGE_UPDATE_EVENT = "terajs:devtools:bridge:update";
export const DEVTOOLS_BRIDGE_DISPOSE_EVENT = "terajs:devtools:bridge:dispose";

export type DevtoolsBridgeTabName =
  | "Components"
  | "AI Diagnostics"
  | "Signals"
  | "Meta"
  | "Issues"
  | "Logs"
  | "Timeline"
  | "Router"
  | "Queue"
  | "Performance"
  | "Sanity Check"
  | "Settings";

export interface DevtoolsBridgeSnapshot {
  instanceId: string;
  hostKind: "overlay" | "embedded" | "root";
  hostId: string | null;
  activeTab: DevtoolsBridgeTabName;
  theme: "dark" | "light";
  eventCount: number;
  mountedComponentCount: number;
  selectedComponentKey: string | null;
  selectedMetaKey: string | null;
  componentSearchQuery: string;
  componentInspectorQuery: string;
  ai: {
    status: "idle" | "loading" | "ready" | "error";
    likelyCause: string | null;
    error: string | null;
    summary: string | null;
    likelyCauses: string[];
    nextChecks: string[];
    suggestedFixes: string[];
    promptAvailable: boolean;
    responseAvailable: boolean;
    assistantEnabled: boolean;
    assistantEndpoint: string | null;
    assistantModel: string;
    assistantTimeoutMs: number;
  };
  layout: {
    position: string;
    panelSize: string;
    persistPreferences: boolean;
  };
  codeReferences: AICodeReference[];
  document: SafeDocumentContextSummary | null;
  documentDiagnostics: SafeDocumentDiagnostic[];
  recentEvents: Array<{
    type: string;
    timestamp: number;
    level?: "info" | "warn" | "error";
  }>;
}

export interface DevtoolsBridgeInstanceSummary {
  instanceId: string;
  hostKind: DevtoolsBridgeSnapshot["hostKind"];
  hostId: string | null;
  activeTab: DevtoolsBridgeTabName;
  theme: DevtoolsBridgeSnapshot["theme"];
  eventCount: number;
  aiStatus: DevtoolsBridgeSnapshot["ai"]["status"];
}

export interface DevtoolsBridgeEventRecord {
  type: string;
  timestamp: number;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
  payload?: Record<string, unknown>;
}

export interface DevtoolsBridgeSessionExport {
  snapshot: DevtoolsBridgeSnapshot;
  codeReferences: AICodeReference[];
  document: SafeDocumentContext | null;
  documentDiagnostics: SafeDocumentDiagnostic[];
  events: DevtoolsBridgeEventRecord[];
}

export type DevtoolsBridgeSessionMode = "full" | "update";

export type DevtoolsBridgeEventPhase = "ready" | "update" | "dispose";

export interface DevtoolsBridgeEventDetail extends DevtoolsBridgeInstanceSummary {
  phase: DevtoolsBridgeEventPhase;
  selectedComponentKey: string | null;
  selectedMetaKey: string | null;
}

export interface DevtoolsGlobalBridge {
  readonly version: 1;
  listInstances(): DevtoolsBridgeInstanceSummary[];
  getSnapshot(instanceId?: string): DevtoolsBridgeSnapshot | null;
  exportSession(instanceId?: string, mode?: DevtoolsBridgeSessionMode): DevtoolsBridgeSessionExport | null;
  setActiveInstance(instanceId: string): boolean;
  focusTab(tab: DevtoolsBridgeTabName, instanceId?: string): boolean;
  selectComponent(scope: string, instance: number, instanceId?: string): boolean;
  reveal(instanceId?: string): boolean;
}

interface DevtoolsBridgeSnapshotInput {
  activeTab: DevtoolsBridgeTabName;
  theme: DevtoolsBridgeSnapshot["theme"];
  eventCount: number;
  mountedComponentCount: number;
  selectedComponentKey: string | null;
  selectedMetaKey: string | null;
  componentSearchQuery: string;
  componentInspectorQuery: string;
  ai: DevtoolsBridgeSnapshot["ai"];
  layout: DevtoolsBridgeSnapshot["layout"];
  codeReferences: DevtoolsBridgeSnapshot["codeReferences"];
  document: DevtoolsBridgeSnapshot["document"];
  documentDiagnostics: DevtoolsBridgeSnapshot["documentDiagnostics"];
  recentEvents: DevtoolsBridgeSnapshot["recentEvents"];
}

interface DevtoolsBridgeRegistrationOptions {
  root: HTMLElement;
  getSnapshot(): DevtoolsBridgeSnapshotInput;
  getSessionExport(mode?: DevtoolsBridgeSessionMode): Omit<DevtoolsBridgeSessionExport, "snapshot">;
  focusTab(tab: DevtoolsBridgeTabName): boolean;
  selectComponent(scope: string, instance: number): boolean;
  reveal(): boolean;
}

interface RegisteredDevtoolsBridge {
  instanceId: string;
  hostKind: DevtoolsBridgeSnapshot["hostKind"];
  hostId: string | null;
  readyDispatched: boolean;
  getSnapshot(): DevtoolsBridgeSnapshot;
  getSessionExport(mode?: DevtoolsBridgeSessionMode): DevtoolsBridgeSessionExport;
  focusTab(tab: DevtoolsBridgeTabName): boolean;
  selectComponent(scope: string, instance: number): boolean;
  reveal(): boolean;
}

export interface RegisteredDevtoolsBridgeHandle {
  instanceId: string;
  sync(): void;
  dispose(): void;
}

export interface WaitForDevtoolsBridgeOptions {
  instanceId?: string;
  timeoutMs?: number;
}

export interface SubscribeToDevtoolsBridgeOptions {
  instanceId?: string;
  includeInitialSnapshot?: boolean;
}

declare global {
  interface Window {
    __TERAJS_DEVTOOLS_BRIDGE__?: DevtoolsGlobalBridge;
  }
}

const registeredBridges = new Map<string, RegisteredDevtoolsBridge>();
let activeBridgeInstanceId: string | null = null;
let nextBridgeId = 1;

function resolveHostInfo(root: HTMLElement): Pick<DevtoolsBridgeSnapshot, "hostKind" | "hostId"> {
  const rootNode = root.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    const host = rootNode.host;
    const hostId = host.id.length > 0 ? host.id : null;

    return {
      hostKind: hostId === "terajs-overlay-container" ? "overlay" : "embedded",
      hostId
    };
  }

  return {
    hostKind: "root",
    hostId: root.id.length > 0 ? root.id : null
  };
}

function buildBridgeSnapshot(entry: RegisteredDevtoolsBridge): DevtoolsBridgeSnapshot {
  return entry.getSnapshot();
}

function buildBridgeSummary(snapshot: DevtoolsBridgeSnapshot): DevtoolsBridgeInstanceSummary {
  return {
    instanceId: snapshot.instanceId,
    hostKind: snapshot.hostKind,
    hostId: snapshot.hostId,
    activeTab: snapshot.activeTab,
    theme: snapshot.theme,
    eventCount: snapshot.eventCount,
    aiStatus: snapshot.ai.status
  };
}

function buildBridgeEventDetail(
  snapshot: DevtoolsBridgeSnapshot,
  phase: DevtoolsBridgeEventPhase
): DevtoolsBridgeEventDetail {
  return {
    ...buildBridgeSummary(snapshot),
    phase,
    selectedComponentKey: snapshot.selectedComponentKey,
    selectedMetaKey: snapshot.selectedMetaKey
  };
}

function resolveBridgeEntry(instanceId?: string): RegisteredDevtoolsBridge | null {
  if (instanceId && registeredBridges.has(instanceId)) {
    return registeredBridges.get(instanceId) ?? null;
  }

  if (activeBridgeInstanceId && registeredBridges.has(activeBridgeInstanceId)) {
    return registeredBridges.get(activeBridgeInstanceId) ?? null;
  }

  const lastRegistered = Array.from(registeredBridges.values()).at(-1);
  return lastRegistered ?? null;
}

function dispatchBridgeEvent(
  name: string,
  phase: DevtoolsBridgeEventPhase,
  snapshot: DevtoolsBridgeSnapshot
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(name, {
    detail: buildBridgeEventDetail(snapshot, phase)
  }));
}

function ensureGlobalBridge(): void {
  if (typeof window === "undefined" || window.__TERAJS_DEVTOOLS_BRIDGE__) {
    return;
  }

  window.__TERAJS_DEVTOOLS_BRIDGE__ = {
    version: 1,
    listInstances() {
      return Array.from(registeredBridges.values()).map((entry) => buildBridgeSummary(buildBridgeSnapshot(entry)));
    },
    getSnapshot(instanceId) {
      const entry = resolveBridgeEntry(instanceId);
      return entry ? buildBridgeSnapshot(entry) : null;
    },
    exportSession(instanceId, mode = "full") {
      const entry = resolveBridgeEntry(instanceId);
      return entry ? entry.getSessionExport(mode) : null;
    },
    setActiveInstance(instanceId) {
      if (!registeredBridges.has(instanceId)) {
        return false;
      }

      activeBridgeInstanceId = instanceId;
      return true;
    },
    focusTab(tab, instanceId) {
      const entry = resolveBridgeEntry(instanceId);
      if (!entry) {
        return false;
      }

      activeBridgeInstanceId = entry.instanceId;
      entry.reveal();
      return entry.focusTab(tab);
    },
    selectComponent(scope, instance, instanceId) {
      const entry = resolveBridgeEntry(instanceId);
      if (!entry) {
        return false;
      }

      activeBridgeInstanceId = entry.instanceId;
      entry.reveal();
      return entry.selectComponent(scope, instance);
    },
    reveal(instanceId) {
      const entry = resolveBridgeEntry(instanceId);
      if (!entry) {
        return false;
      }

      activeBridgeInstanceId = entry.instanceId;
      return entry.reveal();
    }
  };
}

export function registerDevtoolsBridgeInstance(
  options: DevtoolsBridgeRegistrationOptions
): RegisteredDevtoolsBridgeHandle {
  const instanceId = `terajs-devtools-${nextBridgeId}`;
  nextBridgeId += 1;

  const hostInfo = resolveHostInfo(options.root);
  const entry: RegisteredDevtoolsBridge = {
    instanceId,
    hostKind: hostInfo.hostKind,
    hostId: hostInfo.hostId,
    readyDispatched: false,
    getSnapshot() {
      const snapshot = options.getSnapshot();
      return {
        instanceId,
        hostKind: hostInfo.hostKind,
        hostId: hostInfo.hostId,
        ...snapshot
      };
    },
    getSessionExport(mode = "full") {
      return {
        snapshot: buildBridgeSnapshot(entry),
        ...options.getSessionExport(mode)
      };
    },
    focusTab: options.focusTab,
    selectComponent: options.selectComponent,
    reveal: options.reveal
  };

  registeredBridges.set(instanceId, entry);
  activeBridgeInstanceId = instanceId;
  ensureGlobalBridge();

  return {
    instanceId,
    sync() {
      activeBridgeInstanceId = instanceId;
      const snapshot = buildBridgeSnapshot(entry);
      const phase: DevtoolsBridgeEventPhase = entry.readyDispatched ? "update" : "ready";
      dispatchBridgeEvent(
        phase === "ready" ? DEVTOOLS_BRIDGE_READY_EVENT : DEVTOOLS_BRIDGE_UPDATE_EVENT,
        phase,
        snapshot
      );
      entry.readyDispatched = true;
    },
    dispose() {
      const snapshot = buildBridgeSnapshot(entry);
      registeredBridges.delete(instanceId);

      if (activeBridgeInstanceId === instanceId) {
        activeBridgeInstanceId = Array.from(registeredBridges.keys()).at(-1) ?? null;
      }

      dispatchBridgeEvent(DEVTOOLS_BRIDGE_DISPOSE_EVENT, "dispose", snapshot);
    }
  };
}

function readBridgeSnapshot(instanceId?: string): DevtoolsBridgeSnapshot | null {
  return getDevtoolsBridge()?.getSnapshot(instanceId) ?? null;
}

/**
 * Reads the live browser bridge when DevTools has mounted in the current page.
 */
export function getDevtoolsBridge(): DevtoolsGlobalBridge | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.__TERAJS_DEVTOOLS_BRIDGE__ ?? null;
}

/**
 * Reads a structured DevTools session export without scraping the overlay DOM.
 */
export function readDevtoolsBridgeSession(instanceId?: string): DevtoolsBridgeSessionExport | null {
  return getDevtoolsBridge()?.exportSession(instanceId, "full") ?? null;
}

/**
 * Waits for a browser-mounted DevTools instance to register its bridge.
 */
export function waitForDevtoolsBridge(
  options: WaitForDevtoolsBridgeOptions = {}
): Promise<DevtoolsGlobalBridge> {
  const { instanceId, timeoutMs = 5000 } = options;
  const existingBridge = getDevtoolsBridge();

  if (existingBridge && (!instanceId || existingBridge.getSnapshot(instanceId))) {
    return Promise.resolve(existingBridge);
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Terajs DevTools bridge is only available in a browser environment."));
  }

  return new Promise((resolve, reject) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleBridgeEvent);
      window.removeEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleBridgeEvent);

      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
    };

    const tryResolve = (): boolean => {
      const bridge = getDevtoolsBridge();
      if (!bridge) {
        return false;
      }

      if (instanceId && !bridge.getSnapshot(instanceId)) {
        return false;
      }

      cleanup();
      resolve(bridge);
      return true;
    };

    const handleBridgeEvent = () => {
      tryResolve();
    };

    if (tryResolve()) {
      return;
    }

    window.addEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleBridgeEvent);
    window.addEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleBridgeEvent);

    if (timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting for the Terajs DevTools bridge after ${timeoutMs}ms.`));
      }, timeoutMs);
    }
  });
}

/**
 * Subscribes to bridge lifecycle events using the same contract an IDE or test harness would consume.
 */
export function subscribeToDevtoolsBridge(
  listener: (detail: DevtoolsBridgeEventDetail, snapshot: DevtoolsBridgeSnapshot | null) => void,
  options: SubscribeToDevtoolsBridgeOptions = {}
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const { instanceId, includeInitialSnapshot = true } = options;

  const handleBridgeEvent = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const bridgeDetail = detail as DevtoolsBridgeEventDetail;
    if (instanceId && bridgeDetail.instanceId !== instanceId) {
      return;
    }

    const snapshot = bridgeDetail.phase === "dispose"
      ? null
      : readBridgeSnapshot(bridgeDetail.instanceId);

    listener(bridgeDetail, snapshot);
  };

  window.addEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleBridgeEvent);
  window.addEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleBridgeEvent);
  window.addEventListener(DEVTOOLS_BRIDGE_DISPOSE_EVENT, handleBridgeEvent);

  if (includeInitialSnapshot) {
    const snapshot = readBridgeSnapshot(instanceId);
    if (snapshot) {
      listener(buildBridgeEventDetail(snapshot, "ready"), snapshot);
    }
  }

  return () => {
    window.removeEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleBridgeEvent);
    window.removeEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleBridgeEvent);
    window.removeEventListener(DEVTOOLS_BRIDGE_DISPOSE_EVENT, handleBridgeEvent);
  };
}