import type { UIKitBridgeCommand, UIKitNativeEventPacket } from "./bridge.js";
import { createUIKitHostSession, type UIKitHostSession } from "./session.js";
import {
  parseUIKitNativeEventPacket,
  stringifyUIKitBridgeCommands,
} from "./transportCodec.js";

export interface CreateUIKitWireTransportOptions {
  session?: UIKitHostSession;
}

export interface UIKitWireTransport {
  readonly session: UIKitHostSession;
  drainCommandBatch(): UIKitBridgeCommand[];
  drainCommandBatchPayload(): string | null;
  dispatchNativeEventPacket(packet: UIKitNativeEventPacket): void;
  dispatchNativeEventPacketPayload(payload: string | unknown): void;
}

/**
 * Wraps a UIKit host session with the package-local wire helpers a real native
 * host bridge will need: drained command batches out, event packets back in.
 */
export function createUIKitWireTransport(
  options: CreateUIKitWireTransportOptions = {}
): UIKitWireTransport {
  const session = options.session ?? createUIKitHostSession();

  function drainCommandBatch(): UIKitBridgeCommand[] {
    return session.bridge.drainCommands();
  }

  return {
    session,
    drainCommandBatch,
    drainCommandBatchPayload() {
      const commands = drainCommandBatch();
      return commands.length > 0 ? stringifyUIKitBridgeCommands(commands) : null;
    },
    dispatchNativeEventPacket(packet) {
      session.dispatchNativeEventPacket(packet);
    },
    dispatchNativeEventPacketPayload(payload) {
      session.dispatchNativeEventPacket(parseUIKitNativeEventPacket(payload));
    }
  };
}