import { type AndroidCommandBridge, type CreateAndroidCommandBridgeOptions } from "./bridgeContracts.js";
export type { AndroidBridgeCommand, AndroidCommandBridge, CreateAndroidCommandBridgeOptions, AndroidNativeEventPacket, } from "./bridgeContracts.js";
export type { AndroidBridgeAnchorNode, AndroidBridgeElementNode, AndroidBridgeFragmentNode, AndroidBridgeNode, AndroidBridgeTextNode, } from "./bridgeNodes.js";
/**
 * Creates a thin command-oriented Android bridge that keeps renderer ownership in JS
 * and emits only host operations plus event subscription state toward native.
 */
export declare function createAndroidCommandBridge(options?: CreateAndroidCommandBridgeOptions): AndroidCommandBridge;
//# sourceMappingURL=bridge.d.ts.map