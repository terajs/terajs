/**
 * @file renderFromIRFor.ts
 * @description
 * DOM adapter for IRForNode rendering. Host-generic list behavior lives in
 * hostIRForRenderer.ts so non-DOM host proofs do not import the web adapter.
 */

import { webRendererHost } from "./dom.js";
import { createIRForRenderer } from "./hostIRForRenderer.js";

export const renderIRForNode = createIRForRenderer<Node, DocumentFragment>(webRendererHost);
