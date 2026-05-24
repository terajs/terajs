import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { createAndroidCommandBridge, } from "./bridge.js";
import { createAndroidCommandConsumer, } from "./consumer.js";
import { ingestAndroidNativeEvent } from "./eventIngress.js";
import { createAndroidMountedModule } from "./sessionMountedModule.js";
/**
 * Creates a package-local Android host session that mounts compiler IR through the
 * neutral host renderer runtime and replays the resulting command stream into the
 * Android Views-shaped native tree owned by this package.
 */
export function createAndroidHostSession() {
    const consumer = createAndroidCommandConsumer();
    const bridge = createAndroidCommandBridge({
        emitCommand(command) {
            consumer.applyCommand(command);
        }
    });
    const renderer = createHostIRRenderer({
        host: bridge.host,
        bindings: createHostBindings(bridge.host)
    });
    function requireRoot() {
        const root = consumer.root;
        if (!root) {
            throw new Error("Android host session root was not initialized");
        }
        return root;
    }
    return {
        bridge,
        consumer,
        dispatchNativeEvent(nodeId, name, payload) {
            const node = bridge.getNode(nodeId);
            if (!node || node.kind !== "element") {
                throw new Error(`Cannot dispatch Android native event for node ${nodeId}`);
            }
            const event = ingestAndroidNativeEvent(node, consumer.getNode(nodeId), name, payload);
            bridge.dispatchEvent(node, event.name, event.payload);
        },
        dispatchNativeEventPacket(packet) {
            this.dispatchNativeEvent(packet.nodeId, packet.name, packet.payload);
        },
        getBridgeNode(nodeId) {
            return bridge.getNode(nodeId);
        },
        getNativeNode(nodeId) {
            return consumer.getNode(nodeId);
        },
        mountIRModule(ir, ctx) {
            const rendered = renderer.renderIRModule(ir, ctx);
            const bridgeNodes = bridge.host.getChildren(rendered);
            bridge.host.insert(bridge.root, rendered);
            return createAndroidMountedModule(bridge, bridgeNodes);
        },
        mountIRNode(node, ctx, isSvg = false) {
            const rendered = renderer.renderIRNode(node, ctx, isSvg);
            if (rendered) {
                bridge.host.insert(bridge.root, rendered);
            }
            return rendered;
        },
        removeNode(nodeId) {
            const node = bridge.getNode(nodeId);
            if (!node || node.id === bridge.root.id) {
                return;
            }
            bridge.host.remove(node);
        },
        get root() {
            return requireRoot();
        }
    };
}
