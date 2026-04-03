/**
 * @file renderToString.ts
 * @description
 * Nebula's server-side renderer.
 *
 * Converts an IRModule (compiler output) into:
 * - HTML markup
 * - <head> metadata
 * - hydration hints for the client
 *
 * This renderer is intentionally minimal and renderer-agnostic.
 * It does not evaluate expressions or signals; it simply serializes
 * the IR tree into HTML.
 */

import type {
  IRModule,
  IRNode,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRIfNode,
  IRForNode
} from "@nebula/compiler";
import type { SSRContext, SSRResult, SSRHydrationHint } from "./types";

/**
 * Render a Nebula IRModule to an SSRResult.
 *
 * @param ir - The IRModule produced by the compiler.
 * @param ctx - Optional SSR context for overriding meta/route.
 * @returns SSRResult containing html, head, and hydration metadata.
 */
export function renderToString(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): SSRResult {
  const body = ir.template.map(renderNode).join("");
  const hydration = resolveHydration(ir, ctx);
  const marker = renderHydrationMarker(hydration);
  const html = body + marker;
  const head = renderHead(ir, ctx);

  return { html, head, hydration };
}

/**
 * Render a single IR node into HTML.
 *
 * @param node - The IR node to render.
 */
function renderNode(node: IRNode): string {
  switch (node.type) {
    case "text":
      return renderText(node);
    case "interp":
      return renderInterp(node);
    case "element":
      return renderElement(node);
    case "if":
      return renderIf(node);
    case "for":
      return renderFor(node);
    default:
      return "";
  }
}

/**
 * Render a text node.
 */
function renderText(node: IRTextNode): string {
  return escapeText(node.value);
}

/**
 * Render an interpolation node.
 * SSR does not evaluate expressions yet, so this returns an empty string.
 */
function renderInterp(_node: IRInterpolationNode): string {
  return "";
}

/**
 * Render an element node and its children.
 */
function renderElement(node: IRElementNode): string {
  const attrs = renderAttrs(node.props);
  const children = node.children.map(renderNode).join("");
  return `<${node.tag}${attrs}>${children}</${node.tag}>`;
}

/**
 * Render a v-if node.
 */
function renderIf(node: IRIfNode): string {
  if (node.condition) {
    return node.then.map(renderNode).join("");
  }
  return node.else?.map(renderNode).join("") ?? "";
}

/**
 * Render a v-for node.
 * SSR does not evaluate expressions yet; it simply renders the body once.
 */
function renderFor(node: IRForNode): string {
  return node.body.map(renderNode).join("");
}

/**
 * Render static HTML attributes.
 */
function renderAttrs(props: any[]): string {
  if (!props.length) return "";
  const parts: string[] = [];

  for (const p of props) {
    if (p.kind === "static") {
      parts.push(`${p.name}="${escapeAttr(String(p.value))}"`);
    }
  }

  return parts.length ? " " + parts.join(" ") : "";
}

/**
 * Render <head> metadata from IR meta + SSR context.
 */
function renderHead(ir: IRModule, ctx: Partial<SSRContext>): string {
  const meta = { ...(ir.meta || {}), ...(ctx.meta || {}) };
  const parts: string[] = [];

  if (meta.title) {
    parts.push(`<title>${escapeText(String(meta.title))}</title>`);
  }
  if (meta.description) {
    parts.push(
      `<meta name="description" content="${escapeAttr(
        String(meta.description)
      )}">`
    );
  }

  return parts.join("");
}

/**
 * Determine the hydration mode from:
 * - route.hydrate
 * - meta.performance.hydrate
 * - SSR context overrides
 */
function resolveHydration(
  ir: IRModule,
  ctx: Partial<SSRContext>
): SSRHydrationHint {
  const metaHydrate = ir.meta?.performance?.hydrate;
  const routeHydrate = ir.route?.hydrate;
  const ctxMetaHydrate = ctx.meta?.performance?.hydrate;
  const ctxRouteHydrate = ctx.route?.hydrate;

  const mode =
    ctxRouteHydrate ??
    ctxMetaHydrate ??
    routeHydrate ??
    metaHydrate ??
    "eager";

  return { mode };
}

/**
 * Emit a hydration marker script tag.
 *
 * This is consumed by the client renderer to determine how and when
 * to hydrate the server-rendered HTML.
 */
function renderHydrationMarker(hint: SSRHydrationHint): string {
  const payload = JSON.stringify({ mode: hint.mode });
  return `<script type="application/nebula-hydration">${payload}</script>`;
}

/**
 * Escape text content for safe HTML output.
 */
function escapeText(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Escape attribute values for safe HTML output.
 */
function escapeAttr(v: string): string {
  return escapeText(v).replace(/"/g, "&quot;");
}
