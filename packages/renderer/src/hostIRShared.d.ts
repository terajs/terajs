import type { RendererEventHandler } from "@terajs/renderer";
import type { HostIRPropNode } from "./hostIRTypes.js";
export interface HostIRPropRuntime<ElementLike> {
    applyStaticProp(el: ElementLike, prop: HostIRPropNode): void;
    bindDirectPropSource(el: ElementLike, name: string, source: unknown): void;
    bindProp(el: ElementLike, name: string, compute: () => any): void;
    bindClass(el: ElementLike, compute: () => any): void;
    bindStyle(el: ElementLike, compute: () => Record<string, any>): void;
    bindEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
}
export interface HostIRSlotRuntime<NodeLike, TextLike extends NodeLike = NodeLike, FragmentLike extends NodeLike = NodeLike> {
    createFragment(): FragmentLike;
    createText(value: string): TextLike;
    insert(parent: NodeLike, child: NodeLike): void;
    isNode(value: unknown): value is NodeLike;
}
export declare function applyIRProps<ElementLike>(el: ElementLike, props: HostIRPropNode[], ctx: any, runtime: HostIRPropRuntime<ElementLike>): void;
export declare function normalizeSlotValue<NodeLike, TextLike extends NodeLike = NodeLike, FragmentLike extends NodeLike = NodeLike>(value: any, runtime: HostIRSlotRuntime<NodeLike, TextLike, FragmentLike>): NodeLike;
//# sourceMappingURL=hostIRShared.d.ts.map