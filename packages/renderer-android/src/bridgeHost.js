import { createAndroidBridgeNodeFactory } from "./bridgeNodeFactory.js";
import { detachAndroidBridgeNode, disposeAndroidBridgeSubtree, isAndroidNativeBackedNode, resolveAndroidBridgeAnchorId, } from "./bridgeNodes.js";
import { normalizeAndroidEventName, normalizeAndroidProp, resolveAndroidViewType } from "./primitives.js";
import { normalizeAndroidStyle } from "./styleNormalization.js";
export function createAndroidBridgeHost(options) {
    const { nodes, pushCommand } = options;
    const { createAnchorNode, createElementNode, createFragmentNode, createTextNode } = createAndroidBridgeNodeFactory({ nodes, pushCommand });
    const host = {
        createAnchor(label = "") {
            return createAnchorNode(label);
        },
        createElement(type, svg = false) {
            return createElementNode(resolveAndroidViewType(type), svg);
        },
        createText(value) {
            return createTextNode(value);
        },
        createFragment() {
            return createFragmentNode();
        },
        isNode(value) {
            return typeof value === "object" && value !== null && "kind" in value && "id" in value;
        },
        isFragment(node) {
            return node.kind === "fragment";
        },
        getParent(node) {
            return node.parent;
        },
        getNextSibling(node) {
            const parent = node.parent;
            if (!parent) {
                return null;
            }
            const index = parent.children.indexOf(node);
            return index >= 0 ? parent.children[index + 1] ?? null : null;
        },
        getChildren(node) {
            return [...node.children];
        },
        insert(parent, child, anchor = null) {
            if (child.kind === "fragment") {
                const fragmentChildren = [...child.children];
                child.children.length = 0;
                for (const fragmentChild of fragmentChildren) {
                    this.insert(parent, fragmentChild, anchor);
                }
                return;
            }
            const anchorId = resolveAndroidBridgeAnchorId(parent, anchor);
            detachAndroidBridgeNode(child);
            const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1;
            if (anchorIndex >= 0) {
                parent.children.splice(anchorIndex, 0, child);
            }
            else {
                parent.children.push(child);
            }
            child.parent = parent;
            if (isAndroidNativeBackedNode(parent) && isAndroidNativeBackedNode(child)) {
                pushCommand({
                    type: "insert",
                    parentId: parent.id,
                    childId: child.id,
                    anchorId
                });
            }
        },
        remove(node) {
            if (node.kind === "fragment") {
                for (const child of [...node.children]) {
                    this.remove(child);
                }
                nodes.delete(node.id);
                return;
            }
            disposeAndroidBridgeSubtree(node, nodes);
            detachAndroidBridgeNode(node);
            if (isAndroidNativeBackedNode(node)) {
                pushCommand({
                    type: "remove",
                    nodeId: node.id
                });
            }
        },
        setText(node, value) {
            node.value = String(value);
            pushCommand({
                type: "set-text",
                nodeId: node.id,
                value: node.value
            });
        },
        setProp(el, name, value) {
            const normalized = normalizeAndroidProp(el.viewType, name, value);
            const updates = [normalized, ...(normalized.additional ?? [])];
            for (const update of updates) {
                if (update.value == null) {
                    delete el.props[update.name];
                }
                else {
                    el.props[update.name] = update.value;
                }
                pushCommand({
                    type: "set-prop",
                    nodeId: el.id,
                    name: update.name,
                    value: update.value ?? null
                });
            }
        },
        setStyle(el, style) {
            const normalizedStyle = normalizeAndroidStyle(el.viewType, style);
            el.styles = {
                ...el.styles,
                ...normalizedStyle
            };
            pushCommand({
                type: "set-style",
                nodeId: el.id,
                style: normalizedStyle
            });
        },
        setClass(el, className) {
            el.className = className;
            pushCommand({
                type: "set-class",
                nodeId: el.id,
                className
            });
        },
        addEvent(el, name, handler) {
            const nativeEventName = normalizeAndroidEventName(el.viewType, name);
            const handlers = el.eventHandlers[nativeEventName] ?? [];
            const shouldSubscribe = handlers.length === 0;
            handlers.push(handler);
            el.eventHandlers[nativeEventName] = handlers;
            if (shouldSubscribe) {
                pushCommand({
                    type: "subscribe-event",
                    nodeId: el.id,
                    name: nativeEventName
                });
            }
        },
        removeEvent(el, name, handler) {
            const nativeEventName = normalizeAndroidEventName(el.viewType, name);
            const current = el.eventHandlers[nativeEventName];
            if (!current?.length) {
                return;
            }
            const nextHandlers = current.filter((candidate) => candidate !== handler);
            if (nextHandlers.length > 0) {
                el.eventHandlers[nativeEventName] = nextHandlers;
                return;
            }
            delete el.eventHandlers[nativeEventName];
            pushCommand({
                type: "unsubscribe-event",
                nodeId: el.id,
                name: nativeEventName
            });
        },
        addNodeCleanup(node, cleanup) {
            node.cleanups.push(cleanup);
        }
    };
    const root = createElementNode(options.rootViewType ?? "ViewGroup", false);
    return { host, root };
}
