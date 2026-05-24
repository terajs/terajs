import type { RendererEventHandler } from "@terajs/renderer";
import { type Ref, type Signal } from "@terajs/reactivity";
export interface HostBindingRuntime<NodeLike, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike> {
    addEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    addNodeCleanup(node: NodeLike, cleanup: () => void): void;
    removeEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    setClass(el: ElementLike, className: string): void;
    setProp(el: ElementLike, name: string, value: any): void;
    setStyle(el: ElementLike, style: Record<string, string>): void;
    setText(node: TextLike, value: any): void;
}
export interface HostBindingOptions<TextLike> {
    setDirectTextValue?: (node: TextLike, value: unknown) => void;
}
export interface HostBindings<ElementLike, TextLike> {
    bindText(node: TextLike, compute: () => any): void;
    bindDirectTextSource(node: TextLike, source: Signal<unknown> | Ref<unknown>): void;
    bindDirectPropSource(el: ElementLike, name: string, source: Signal<unknown> | Ref<unknown>): void;
    bindProp(el: ElementLike, name: string, compute: () => any): void;
    bindClass(el: ElementLike, compute: () => any): void;
    bindStyle(el: ElementLike, compute: () => Record<string, any>): void;
    bindEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
    unbindEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
}
export declare function createHostBindings<NodeLike, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike>(runtime: HostBindingRuntime<NodeLike, ElementLike, TextLike>, options?: HostBindingOptions<TextLike>): HostBindings<ElementLike, TextLike>;
//# sourceMappingURL=hostBindings.d.ts.map