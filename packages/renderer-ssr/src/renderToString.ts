/**
 * @file renderToString.ts
 * @description
 * Terajs's server-side renderer.
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
  IRPortalNode,
  IRSlotNode,
  IRIfNode,
  IRForNode
} from "@terajs/compiler";
import type { SSRContext, SSRResult, SSRHydrationHint } from "./types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValues(base: unknown, incoming: unknown): unknown {
  if (incoming === undefined) {
    return base;
  }

  if (Array.isArray(base) && Array.isArray(incoming)) {
    return Array.from(new Set([...base, ...incoming]));
  }

  if (isPlainObject(base) && isPlainObject(incoming)) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = mergeValues(merged[key], value);
    }
    return merged;
  }

  return incoming;
}

function mergeMeta(...sources: Array<Record<string, unknown> | undefined>): Record<string, unknown> {
  let merged: Record<string, unknown> = {};

  for (const source of sources) {
    if (!isPlainObject(source)) continue;
    for (const [key, value] of Object.entries(source)) {
      merged[key] = mergeValues(merged[key], value);
    }
  }

  return merged;
}

function normalizeMetaValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(",");
  }
  return String(value);
}

function renderMetaTag(name: string, content: string, attrName: "name" | "property" = "name"): string {
  return `<meta ${attrName}="${escapeAttr(name)}" content="${escapeAttr(content)}">`;
}

function renderStructuredMeta(meta: Record<string, unknown>): string[] {
  const parts: string[] = [];

  if (meta.title) {
    parts.push(`<title>${escapeText(String(meta.title))}</title>`);
  }

  if (meta.description) {
    parts.push(renderMetaTag("description", String(meta.description)));
  }

  if (meta.keywords) {
    parts.push(renderMetaTag("keywords", normalizeMetaValue(meta.keywords)));
  }

  if (meta.aiSummary) {
    parts.push(renderMetaTag("ai:summary", normalizeMetaValue(meta.aiSummary)));
  }

  if (meta.aiKeywords) {
    parts.push(renderMetaTag("ai:keywords", normalizeMetaValue(meta.aiKeywords)));
  }

  if (meta.aiAltText !== undefined) {
    parts.push(renderMetaTag("ai:alt-text", normalizeMetaValue(meta.aiAltText)));
  }

  if (isPlainObject(meta.analytics)) {
    const analytics = meta.analytics as Record<string, unknown>;
    if (analytics.track !== undefined) {
      parts.push(renderMetaTag("analytics-track", normalizeMetaValue(analytics.track)));
    }
    if (analytics.events !== undefined) {
      parts.push(renderMetaTag("analytics-events", normalizeMetaValue(analytics.events)));
    }
  }

  if (isPlainObject(meta.performance)) {
    const perf = meta.performance as Record<string, unknown>;
    if (perf.priority !== undefined) {
      parts.push(renderMetaTag("performance-priority", normalizeMetaValue(perf.priority)));
    }
    if (perf.hydrate !== undefined) {
      parts.push(renderMetaTag("performance-hydrate", normalizeMetaValue(perf.hydrate)));
    }
    if (perf.cache !== undefined) {
      parts.push(renderMetaTag("performance-cache", normalizeMetaValue(perf.cache)));
    }
    if (perf.edge !== undefined) {
      parts.push(renderMetaTag("performance-edge", normalizeMetaValue(perf.edge)));
    }
  }

  if (isPlainObject(meta.a11y)) {
    const a11y = meta.a11y as Record<string, unknown>;
    for (const [key, value] of Object.entries(a11y)) {
      parts.push(renderMetaTag(`a11y:${key}`, normalizeMetaValue(value)));
    }
  }

  if (isPlainObject(meta.i18n)) {
    const i18n = meta.i18n as Record<string, unknown>;
    for (const [key, value] of Object.entries(i18n)) {
      parts.push(renderMetaTag(`i18n:${key}`, normalizeMetaValue(value)));
    }
  }

  for (const [key, value] of Object.entries(meta)) {
    if ([
      "title",
      "description",
      "keywords",
      "aiSummary",
      "aiKeywords",
      "aiAltText",
      "schema",
      "analytics",
      "performance",
      "a11y",
      "i18n"
    ].includes(key)) {
      continue;
    }

    if (value == null || value === false) {
      continue;
    }

    if (key.startsWith("og:")) {
      parts.push(renderMetaTag(key, normalizeMetaValue(value), "property"));
      continue;
    }

    if (key.startsWith("twitter:")) {
      parts.push(renderMetaTag(key, normalizeMetaValue(value), "name"));
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      parts.push(renderMetaTag(key, normalizeMetaValue(value)));
    }
  }

  return parts;
}

function escapeJson(json: string): string {
  return json.replace(/</g, "\\u003c");
}

function renderSchema(schema: any): string {
  if (schema == null) return "";
  try {
    const json = JSON.stringify(schema).replace(/</g, "\\u003c");
    return `<script type="application/ld+json">${json}</script>`;
  } catch {
    return "";
  }
}

function renderAICoord(ai: Record<string, any>): string {
  if (!isPlainObject(ai) || Object.keys(ai).length === 0) return "";
  const content = JSON.stringify(ai).replace(/"/g, "&quot;");
  return `<meta name="terajs-ai-hint" content="${content}">`;
}

export interface SSRHtml {
  __ssrHtml: string;
}

export function createSSRHtml(html: string): SSRHtml {
  return { __ssrHtml: html };
}

export function isSSRHtml(value: unknown): value is SSRHtml {
  return typeof value === "object" && value !== null && "__ssrHtml" in value;
}

/**
 * Render a Terajs IRModule to an SSRResult.
 *
 * @param ir - The IRModule produced by the compiler.
 * @param ctx - Optional SSR context for overriding meta/route.
 * @returns SSRResult containing html, head, and hydration metadata.
 */
export function renderToString(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): SSRResult {
  const body = renderBodyToString(ir, ctx);
  const hydration = resolveHydration(ir, ctx);
  const marker = renderHydrationMarker(hydration, {
    ai: ctx.ai ?? ir.ai,
    resources: ctx.resources,
    routeSnapshot: ctx.routeSnapshot
  });
  const data = ctx.data;
  const html = body + marker + renderHydrationData(data ?? {});
  const head = renderHead(ir, ctx);

  return {
    html,
    head,
    hydration,
    ai: ctx.ai ?? ir.ai,
    resources: ctx.resources,
    routeSnapshot: ctx.routeSnapshot,
    data
  };
}

export function renderBodyToString(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): string {
  const scope = ctx.scope ?? {};
  return ir.template.map((node) => renderNode(node, scope)).join("");
}

/**
 * Render a single IR node into HTML.
 *
 * @param node - The IR node to render.
 */
function renderNode(node: IRNode, scope: Record<string, unknown>): string {
  switch (node.type) {
    case "text":
      return renderText(node);
    case "interp":
      return renderInterp(node, scope);
    case "element":
      return renderElement(node, scope);
    case "portal":
      return renderPortal(node, scope);
    case "slot":
      return renderSlot(node, scope);
    case "if":
      return renderIf(node, scope);
    case "for":
      return renderFor(node, scope);
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
function renderInterp(node: IRInterpolationNode, scope: Record<string, unknown>): string {
  const value = resolveExpr(scope, node.expression);
  if (value == null) {
    return "";
  }

  if (isSSRHtml(value)) {
    return value.__ssrHtml;
  }

  return escapeText(String(value));
}

/**
 * Render an element node and its children.
 */
function renderElement(node: IRElementNode, scope: Record<string, unknown>): string {
  const attrs = renderAttrs(node.props, scope);
  const children = node.children.map((child) => renderNode(child, scope)).join("");
  return `<${node.tag}${attrs}>${children}</${node.tag}>`;
}

function renderPortal(node: IRPortalNode, scope: Record<string, unknown>): string {
  return node.children.map((child) => renderNode(child, scope)).join("");
}

function renderSlot(node: IRSlotNode, scope: Record<string, unknown>): string {
  const slotName = node.name ?? "default";
  const slotValue = (scope.slots as Record<string, unknown> | undefined)?.[slotName];

  if (slotValue != null) {
    return renderSlotValue(slotValue);
  }

  return node.fallback.map((child) => renderNode(child, scope)).join("");
}

/**
 * Render a v-if node.
 */
function renderIf(node: IRIfNode, scope: Record<string, unknown>): string {
  if (resolveExpr(scope, node.condition)) {
    return node.then.map((child) => renderNode(child, scope)).join("");
  }
  return node.else?.map((child) => renderNode(child, scope)).join("") ?? "";
}

/**
 * Render a v-for node.
 * SSR does not evaluate expressions yet; it simply renders the body once.
 */
function renderFor(node: IRForNode, scope: Record<string, unknown>): string {
  const value = resolveExpr(scope, node.each);
  const items = Array.isArray(value) ? value : [];

  return items
    .map((item, index) => {
      const childScope = {
        ...scope,
        [node.item]: item,
        [node.index ?? "i"]: index
      };
      return node.body.map((child) => renderNode(child, childScope)).join("");
    })
    .join("");
}

/**
 * Render static HTML attributes.
 */
function renderAttrs(props: any[], scope: Record<string, unknown>): string {
  if (!props.length) return "";
  const parts: string[] = [];

  for (const p of props) {
    if (p.kind === "static") {
      parts.push(`${p.name}="${escapeAttr(String(p.value))}"`);
      continue;
    }

    if (p.kind === "bind") {
      const resolved = resolveExpr(scope, String(p.value));
      if (resolved == null || resolved === false) {
        continue;
      }

      if (p.name === "style" && typeof resolved === "object") {
        const style = Object.entries(resolved as Record<string, unknown>)
          .map(([key, value]) => `${key}:${String(value)}`)
          .join(";");
        if (style) {
          parts.push(`style="${escapeAttr(style)}"`);
        }
        continue;
      }

      if (p.name === "class" && Array.isArray(resolved)) {
        parts.push(`class="${escapeAttr(resolved.join(" "))}"`);
        continue;
      }

      if (resolved === true) {
        parts.push(p.name);
        continue;
      }

      parts.push(`${p.name}="${escapeAttr(String(resolved))}"`);
    }
  }

  return parts.length ? " " + parts.join(" ") : "";
}

/**
 * Render <head> metadata from IR meta + SSR context.
 */
export function renderHead(ir: IRModule, ctx: Partial<SSRContext>): string {
  const irRouteMeta = isPlainObject(ir.route?.meta) ? ir.route?.meta as Record<string, unknown> : undefined;
  const routeMeta = isPlainObject(ctx.route?.meta) ? ctx.route?.meta as Record<string, unknown> : undefined;
  const meta = mergeMeta(ir.meta ?? {}, irRouteMeta, routeMeta, ctx.meta ?? {});
  const mergedAi = mergeMeta(ir.ai ?? {}, ctx.ai ?? {});

  const parts = renderStructuredMeta(meta);
  const aiTag = renderAICoord(mergedAi as Record<string, any>);
  if (aiTag) parts.push(aiTag);
  const schemaTag = renderSchema(meta.schema);
  if (schemaTag) parts.push(schemaTag);

  return parts.join("");
}

/**
 * Determine the hydration mode from:
 * - route.hydrate
 * - meta.performance.hydrate
 * - SSR context overrides
 */
export function resolveHydration(
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
export function renderHydrationMarker(
  hint: SSRHydrationHint,
  payloadContext: {
    ai?: Record<string, any>;
    resources?: Record<string, unknown>;
    routeSnapshot?: SSRContext["routeSnapshot"];
  } = {}
): string {

  const payload: {
    mode: SSRHydrationHint["mode"];
    ai?: Record<string, any>;
    resources?: Record<string, unknown>;
    routeSnapshot?: SSRContext["routeSnapshot"];
  } = {
    mode: hint.mode
  };

  if (payloadContext.ai !== undefined) {
    payload.ai = payloadContext.ai;
  }

  if (payloadContext.routeSnapshot !== undefined) {
    payload.routeSnapshot = payloadContext.routeSnapshot;
  }

  if (payloadContext.resources !== undefined) {
    payload.resources = payloadContext.resources;
  }

  return `<script type="application/terajs-hydration">${JSON.stringify(payload)}</script>`;
}

/**
 * Renders the state hydration script.
 */
function renderHydrationData(data: Record<string, any>): string {
  if (!data || Object.keys(data).length === 0) return "";
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script id="__TERAJS_DATA__" type="application/json">${serialized}</script>`;
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

function resolveExpr(scope: Record<string, unknown>, expr: string): unknown {
  if (expr in scope) {
    const value = scope[expr];
    return typeof value === "function" ? value() : value;
  }

  const parts = expr.split(".");
  let current: unknown = scope;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    const value = (current as Record<string, unknown>)[part];
    current = typeof value === "function" ? value() : value;
  }

  return current;
}

function renderSlotValue(value: unknown): string {
  if (typeof value === "function") {
    return renderSlotValue(value());
  }

  if (value == null || value === false || value === true) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderSlotValue(item)).join("");
  }

  if (isSSRHtml(value)) {
    return value.__ssrHtml;
  }

  return escapeText(String(value));
}

