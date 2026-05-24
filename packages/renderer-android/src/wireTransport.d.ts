import type { AndroidBridgeCommand, AndroidNativeEventPacket } from "./bridge.js";
import { type AndroidHostSession } from "./session.js";
export interface CreateAndroidWireTransportOptions {
    session?: AndroidHostSession;
}
export interface AndroidWireTransport {
    readonly session: AndroidHostSession;
    drainCommandBatch(): AndroidBridgeCommand[];
    drainCommandBatchPayload(): string | null;
    dispatchNativeEventPacket(packet: AndroidNativeEventPacket): void;
    dispatchNativeEventPacketPayload(payload: string | unknown): void;
}
/**
 * Wraps an Android host session with the package-local wire helpers a real native
 * host bridge will need: drained command batches out, event packets back in.
 */
export declare function createAndroidWireTransport(options?: CreateAndroidWireTransportOptions): AndroidWireTransport;
//# sourceMappingURL=wireTransport.d.ts.map