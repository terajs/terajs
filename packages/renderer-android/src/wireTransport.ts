import type { AndroidBridgeCommand, AndroidNativeEventPacket } from "./bridge.js";
import { createAndroidHostSession, type AndroidHostSession } from "./session.js";
import {
  parseAndroidNativeEventPacket,
  stringifyAndroidBridgeCommands,
} from "./transportCodec.js";

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
export function createAndroidWireTransport(
  options: CreateAndroidWireTransportOptions = {}
): AndroidWireTransport {
  const session = options.session ?? createAndroidHostSession();

  function drainCommandBatch(): AndroidBridgeCommand[] {
    return session.bridge.drainCommands();
  }

  return {
    session,
    drainCommandBatch,
    drainCommandBatchPayload() {
      const commands = drainCommandBatch();
      return commands.length > 0 ? stringifyAndroidBridgeCommands(commands) : null;
    },
    dispatchNativeEventPacket(packet) {
      session.dispatchNativeEventPacket(packet);
    },
    dispatchNativeEventPacketPayload(payload) {
      session.dispatchNativeEventPacket(parseAndroidNativeEventPacket(payload));
    }
  };
}