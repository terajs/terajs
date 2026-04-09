import type {
  IRModule,
  IRNode,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRPortalNode,
  IRSlotNode,
  IRIfNode,
  IRForNode
} from "@terajs/compiler";
import type { SSRContext } from "./types";
import {
  renderHydrationMarker,
  renderHydrationData,
  resolveHydration,
  renderAttrs,
  renderText,
  renderInterp,
  renderPortal,
  renderSlot,
  renderIf,
  renderFor
} from "./renderToString";

function isSuspenseElement(node: IRElementNode): boolean {
  return node.tag.toLowerCase() === "suspense";
}

function renderNodeToStream(
  node: IRNode,
  scope: Record<string, unknown>,
  swapChunks: Array<Promise<string>>,
  hasAsyncResource: boolean,
  resourceData?: Record<string, any>
): Array<string | Promise<string>> {
  switch (node.type) {
    case "text":
      return [renderText(node as IRTextNode)];
    case "interp":
      return [renderInterp(node as IRInterpolationNode, scope)];
    case "element":
      return renderElementToStream(node as IRElementNode, scope, swapChunks, hasAsyncResource, resourceData);
    case "portal":
      return [renderPortal(node as IRPortalNode, scope)];
    case "slot":
      return [renderSlot(node as IRSlotNode, scope)];
    case "if":
      return [renderIf(node as IRIfNode, scope)];
    case "for":
      return [renderFor(node as IRForNode, scope)];
    default:
      return [""];
  }
}

function renderNodesToStream(
  nodes: IRNode[],
  scope: Record<string, unknown>,
  swapChunks: Array<Promise<string>>,
  hasAsyncResource: boolean,
  resourceData?: Record<string, any>
) {
  return nodes.flatMap((node) => renderNodeToStream(node, scope, swapChunks, hasAsyncResource, resourceData));
}

function renderElementToStream(
  node: IRElementNode,
  scope: Record<string, unknown>,
  swapChunks: Array<Promise<string>>,
  hasAsyncResource: boolean,
  resourceData?: Record<string, any>
) {
  if (isSuspenseElement(node)) {
    return renderSuspenseToStream(node, scope, swapChunks, hasAsyncResource, resourceData);
  }

  const attrs = renderAttrs(node.props, scope);
  const openTag = `<${node.tag}${attrs}>`;
  const closeTag = `</${node.tag}>`;
  const childChunks = renderNodesToStream(node.children, scope, swapChunks, hasAsyncResource, resourceData);

  return [openTag, ...childChunks, closeTag];
}

function partitionSuspenseChildren(node: IRElementNode) {
  const primary: IRNode[] = [];
  const fallback: IRNode[] = [];

  for (const child of node.children) {
    if (child.type === "slot" && (child as IRSlotNode).name === "fallback") {
      fallback.push(...(child as IRSlotNode).fallback);
      continue;
    }

    primary.push(child);
  }

  return { primary, fallback };
}

function renderSuspenseToStream(
  node: IRElementNode,
  scope: Record<string, unknown>,
  swapChunks: Array<Promise<string>>,
  hasAsyncResource: boolean,
  resourceData?: Record<string, any>
) {
  const targetId = `terajs-suspense-target-${Math.random().toString(36).slice(2, 10)}`;
  const templateId = `terajs-suspense-template-${Math.random().toString(36).slice(2, 10)}`;
  const { primary, fallback } = partitionSuspenseChildren(node);
  const fallbackChunks = renderNodesToStream(fallback, scope, swapChunks, hasAsyncResource, resourceData);
  const fallbackHtml = fallback.length > 0 ? flattenChunks(fallbackChunks) : Promise.resolve("");

  const primaryChunks = renderNodesToStream(primary, scope, swapChunks, hasAsyncResource, resourceData);
  const opening = `<div id="${targetId}" data-terajs-suspense="pending">`;
  const closing = `</div>`;

  if (hasAsyncResource && primary.length > 0) {
    const resolvedChunk = flattenChunks(primaryChunks).then((resolvedHtml) => {
      const dataScript = resourceData ? renderDataChunk(resourceData) : "";
      return `<template id="${templateId}" hidden>${resolvedHtml}</template><script>${dataScript}$teraSwap(${JSON.stringify(templateId)}, ${JSON.stringify(targetId)});</script>`;
    });
    swapChunks.push(resolvedChunk);
  }

  return [opening, fallbackHtml, closing];
}

function renderDataChunk(data: Record<string, any>): string {
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  return `(function(){
    var el = document.getElementById("__TERAJS_DATA__");
    if (!el) {
      el = document.createElement("script");
      el.id = "__TERAJS_DATA__";
      el.type = "application/json";
      document.head.appendChild(el);
    }
    var current = el.textContent ? JSON.parse(el.textContent) : {};
    current = Object.assign({}, current, ${serialized});
    el.textContent = JSON.stringify(current);
    window.__TERAJS_DATA__ = current;
  })();`;
}

async function flattenChunks(chunks: Array<string | Promise<string>>): Promise<string> {
  const pieces: string[] = [];

  for (const chunk of chunks) {
    pieces.push(typeof chunk === "string" ? chunk : await chunk);
  }

  return pieces.join("");
}

export async function renderToStream(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const scope = ctx.scope ?? {};
      const swapChunks: Array<Promise<string>> = [];
      const bodyChunks = renderNodesToStream(ir.template, scope, swapChunks, ir.hasAsyncResource === true, ctx.data);

      for (const chunk of bodyChunks) {
        const text = typeof chunk === "string" ? chunk : await chunk;
        controller.enqueue(encoder.encode(text));
      }

      for (const swapChunk of swapChunks) {
        const swapHtml = await swapChunk;
        controller.enqueue(encoder.encode(swapHtml));
      }

      const marker = renderHydrationMarker(resolveHydration(ir, ctx), {
        ai: ctx.ai ?? ir.ai,
        resources: ctx.resources,
        routeSnapshot: ctx.routeSnapshot
      });
      controller.enqueue(encoder.encode(marker));
      controller.enqueue(encoder.encode(renderHydrationData(ctx.data ?? {})));
      controller.close();
    }
  });
}
