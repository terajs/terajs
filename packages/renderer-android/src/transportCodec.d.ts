import type { AndroidBridgeCommand, AndroidNativeEventPacket } from "./bridgeContracts.js";
export type AndroidTransportValue = null | boolean | number | string | AndroidTransportValue[] | {
    [key: string]: AndroidTransportValue;
};
export declare function stringifyAndroidBridgeCommands(commands: readonly AndroidBridgeCommand[]): string;
export declare function parseAndroidBridgeCommands(input: string | unknown): AndroidBridgeCommand[];
export declare function stringifyAndroidNativeEventPacket(packet: AndroidNativeEventPacket): string;
export declare function parseAndroidNativeEventPacket(input: string | unknown): AndroidNativeEventPacket;
//# sourceMappingURL=transportCodec.d.ts.map