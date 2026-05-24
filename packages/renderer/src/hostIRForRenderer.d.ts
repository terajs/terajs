import type { RendererHost } from "@terajs/renderer";
import type { HostIRForNode, HostIRNode } from "./hostIRTypes.js";
type RenderIRNode<NodeLike> = (node: HostIRNode, ctx: any, isSvg?: boolean) => NodeLike | null;
type IRForHost<NodeLike, FragmentLike extends NodeLike = NodeLike> = Pick<RendererHost<NodeLike, any, any, FragmentLike>, "addNodeCleanup" | "createAnchor" | "createFragment" | "getChildren" | "getNextSibling" | "getParent" | "insert" | "isFragment" | "remove">;
export declare function createIRForRenderer<NodeLike, FragmentLike extends NodeLike = NodeLike>(host: IRForHost<NodeLike, FragmentLike>): (node: HostIRForNode, ctx: any, isSvg: boolean, renderNode: RenderIRNode<NodeLike>) => NodeLike;
export {};
//# sourceMappingURL=hostIRForRenderer.d.ts.map