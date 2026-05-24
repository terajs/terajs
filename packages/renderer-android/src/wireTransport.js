import { Debug } from "@terajs/shared";
import { createAndroidHostSession } from "./session.js";
import { parseAndroidNativeEventPacket, stringifyAndroidBridgeCommands, } from "./transportCodec.js";
/**
 * Wraps an Android host session with the package-local wire helpers a real native
 * host bridge will need: drained command batches out, event packets back in.
 */
export function createAndroidWireTransport(options = {}) {
    const session = options.session ?? createAndroidHostSession();
    function drainCommandBatch() {
        const commands = session.bridge.drainCommands();
        if (commands.length > 0) {
            Debug.emit("bridge:commands", {
                target: "android",
                direction: "js-to-host",
                commandCount: commands.length
            });
        }
        return commands;
    }
    function dispatchNativeEventPacket(packet) {
        Debug.emit("bridge:event", {
            target: "android",
            direction: "host-to-js",
            eventName: packet.name,
            nodeId: packet.nodeId
        });
        session.dispatchNativeEventPacket(packet);
    }
    return {
        session,
        drainCommandBatch,
        drainCommandBatchPayload() {
            const commands = drainCommandBatch();
            return commands.length > 0 ? stringifyAndroidBridgeCommands(commands) : null;
        },
        dispatchNativeEventPacket,
        dispatchNativeEventPacketPayload(payload) {
            dispatchNativeEventPacket(parseAndroidNativeEventPacket(payload));
        }
    };
}
