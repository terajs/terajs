import type { AndroidCommandConsumer } from "./consumerContracts.js";
export type { AndroidCommandConsumer } from "./consumerContracts.js";
export type { AndroidNativeNode, AndroidNativeTextNode, AndroidNativeViewNode, } from "./consumerNodes.js";
/**
 * Replays thin Android bridge commands into an Android Views-shaped native tree
 * owned by the package-local consumer proof rather than the shared renderer.
 */
export declare function createAndroidCommandConsumer(): AndroidCommandConsumer;
//# sourceMappingURL=consumer.d.ts.map