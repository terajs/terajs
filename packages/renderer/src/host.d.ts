/**
 * @file host.ts
 * @description
 * Platform-neutral host operations consumed by renderer implementations.
 */
export type RendererEventHandler = (...args: any[]) => unknown;
export interface RendererHost<NodeLike = unknown, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike, FragmentLike extends NodeLike = NodeLike> {
    createAnchor(label?: string): NodeLike;
    createElement(type: string, svg?: boolean): ElementLike;
    createText(value: string): TextLike;
    createFragment(): FragmentLike;
    isNode(value: unknown): value is NodeLike;
    isFragment(node: NodeLike): node is FragmentLike;
    getParent(node: NodeLike): NodeLike | null;
    getNextSibling(node: NodeLike): NodeLike | null;
    getChildren(node: NodeLike): NodeLike[];
    insert(parent: NodeLike, child: NodeLike, anchor?: NodeLike | null): void;
    remove(node: NodeLike): void;
    setText(node: TextLike, value: any): void;
    setProp(el: ElementLike, name: string, value: any): void;
    setStyle(el: ElementLike, style: Record<string, string>): void;
    setClass(el: ElementLike, className: string): void;
    addEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    removeEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    addNodeCleanup(node: NodeLike, cleanup: () => void): void;
}
//# sourceMappingURL=host.d.ts.map