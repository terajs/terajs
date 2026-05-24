import type { RendererHost } from "@terajs/renderer";
import type { HostBindings } from "./hostBindings.js";
import type { HostIRModule, HostIRNode } from "./hostIRTypes.js";
export interface HostIRRendererRuntime<NodeLike, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike, FragmentLike extends NodeLike = NodeLike> {
    host: RendererHost<NodeLike, ElementLike, TextLike, FragmentLike>;
    bindings: HostBindings<ElementLike, TextLike>;
}
export declare function createHostIRRenderer<NodeLike, ElementLike extends NodeLike = NodeLike, TextLike extends NodeLike = NodeLike, FragmentLike extends NodeLike = NodeLike>(runtime: HostIRRendererRuntime<NodeLike, ElementLike, TextLike, FragmentLike>): {
    renderIRModule: (ir: HostIRModule, ctx: any) => FragmentLike;
    renderIRNode: (node: HostIRNode, ctx: any, isSvg?: boolean) => NodeLike | null;
};
//# sourceMappingURL=createHostIRRenderer.d.ts.map