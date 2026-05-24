export type AndroidNativeNodeBase = {
    id: number;
    parent: AndroidNativeViewNode | null;
};
export type AndroidNativeTextNode = AndroidNativeNodeBase & {
    kind: "text";
    value: string;
};
export type AndroidNativeViewNode = AndroidNativeNodeBase & {
    children: AndroidNativeNode[];
    className: string;
    kind: "view";
    props: Record<string, unknown>;
    styles: Record<string, string>;
    subscribedEvents: string[];
    viewType: string;
};
export type AndroidNativeNode = AndroidNativeTextNode | AndroidNativeViewNode;
export declare function createAndroidNativeViewNode(nodeId: number, viewType: string): AndroidNativeViewNode;
export declare function createAndroidNativeTextNode(nodeId: number, value: string): AndroidNativeTextNode;
export declare function requireAndroidNativeNode(nodes: Map<number, AndroidNativeNode>, nodeId: number): AndroidNativeNode;
export declare function requireAndroidNativeView(nodes: Map<number, AndroidNativeNode>, nodeId: number): AndroidNativeViewNode;
export declare function requireAndroidNativeText(nodes: Map<number, AndroidNativeNode>, nodeId: number): AndroidNativeTextNode;
export declare function detachAndroidNativeNode(node: AndroidNativeNode): void;
export declare function disposeAndroidNativeNode(node: AndroidNativeNode, nodes: Map<number, AndroidNativeNode>, clearRoot: (nodeId: number) => void): void;
export declare function insertAndroidNativeChild(parent: AndroidNativeViewNode, child: AndroidNativeNode, anchorId: number | null): void;
//# sourceMappingURL=consumerNodes.d.ts.map