import { createAndroidBridgeHost } from "./bridgeHost.js";
/**
 * Creates a thin command-oriented Android bridge that keeps renderer ownership in JS
 * and emits only host operations plus event subscription state toward native.
 */
export function createAndroidCommandBridge(options = {}) {
    const commands = [];
    const emitCommand = options.emitCommand;
    const nodes = new Map();
    function pushCommand(command) {
        commands.push(command);
        emitCommand?.(command);
    }
    const { host, root } = createAndroidBridgeHost({
        nodes,
        pushCommand,
        rootViewType: options.rootViewType
    });
    return {
        commands,
        dispatchEvent(node, name, payload) {
            for (const handler of [...(node.eventHandlers[name] ?? [])]) {
                handler(payload);
            }
        },
        drainCommands() {
            const drained = [...commands];
            commands.length = 0;
            return drained;
        },
        getNode(nodeId) {
            return nodes.get(nodeId);
        },
        host,
        root
    };
}
