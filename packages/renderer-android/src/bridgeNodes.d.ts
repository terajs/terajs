import type { RendererEventHandler } from "@terajs/renderer";
type AndroidBridgeNodeBase = {
    children: AndroidBridgeNode[];
    cleanups: Array<() => void>;
    id: number;
    kind: string;
    parent: AndroidBridgeNode | null;
};
export type AndroidBridgeAnchorNode = AndroidBridgeNodeBase & {
    kind: "anchor";
    label: string;
};
export type AndroidBridgeElementNode = AndroidBridgeNodeBase & {
    className: string;
    eventHandlers: Record<string, RendererEventHandler[]>;
    kind: "element";
    props: Record<string, unknown>;
    styles: Record<string, string>;
    svg: boolean;
    viewType: string;
};
export type AndroidBridgeFragmentNode = AndroidBridgeNodeBase & {
    kind: "fragment";
};
export type AndroidBridgeTextNode = AndroidBridgeNodeBase & {
    kind: "text";
    value: string;
};
export type AndroidBridgeNode = AndroidBridgeAnchorNode | AndroidBridgeElementNode | AndroidBridgeFragmentNode | AndroidBridgeTextNode;
export declare function createAndroidBridgeNodeBase<Kind extends AndroidBridgeNode["kind"]>(id: number, kind: Kind): AndroidBridgeNodeBase & {
    kind: Kind;
};
export declare function isAndroidNativeBackedNode(node: AndroidBridgeNode): node is AndroidBridgeElementNode | AndroidBridgeTextNode;
export declare function detachAndroidBridgeNode(node: AndroidBridgeNode): void;
export declare function disposeAndroidBridgeSubtree(node: AndroidBridgeNode, nodes: Map<number, AndroidBridgeNode>): void;
export declare function resolveAndroidBridgeAnchorId(parent: AndroidBridgeNode, anchor: AndroidBridgeNode | null | undefined): number | null;
export {};
//# sourceMappingURL=bridgeNodes.d.ts.map