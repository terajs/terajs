/**
 * @file renderFromIRFor.ts
 * @description
 * DOM adapter for IRForNode rendering. Host-generic list behavior lives in
 * hostIRForRenderer.ts so non-DOM host proofs do not import the web adapter.
 */

import type { IRForNode, IRNode } from "@terajs/compiler";

import { webRendererHost } from "./dom.js";
import { createIRForRenderer } from "./hostIRForRenderer.js";

type IRForNodeRenderer = (
	node: IRForNode,
	ctx: any,
	isSvg: boolean,
	renderNode: (node: IRNode, ctx: any, isSvg?: boolean) => Node | null
) => Node;

export const renderIRForNode: IRForNodeRenderer = createIRForRenderer<Node, DocumentFragment>(webRendererHost);
