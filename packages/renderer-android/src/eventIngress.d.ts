import type { AndroidBridgeElementNode } from "./bridge.js";
import type { AndroidNativeNode } from "./consumer.js";
/**
 * Normalizes inbound native Android events and syncs text-entry and toggle
 * state into the bridge and consumer proof trees before JS handlers run.
 */
export declare function ingestAndroidNativeEvent(bridgeNode: AndroidBridgeElementNode, nativeNode: AndroidNativeNode | undefined, name: string, payload: unknown): {
    name: string;
    payload: unknown;
};
//# sourceMappingURL=eventIngress.d.ts.map