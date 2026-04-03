// packages/renderer-ssr/src/renderToString.ts
import type {
  IRModule,
  IRNode,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRIfNode,
  IRForNode
} from "@nebula/compiler";
import type { SSRContext, SSRResult } from "./types";

export function renderToString(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): SSRResult {
  const html = ir.template.map(renderNode).join("");
  const head = renderHead(ir, ctx);

  return { html, head };
}

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

function renderText(node: IRTextNode): string {
  return escapeText(node.value);
}

function renderInterp(_node: IRInterpolationNode): string {
  // SSR: no runtime signals yet
  return "";
}

function renderElement(node: IRElementNode): string {
  const attrs = renderAttrs(node.props);
  const children = node.children.map(renderNode).join("");
  return `<${node.tag}${attrs}>${children}</${node.tag}>`;
}

function renderIf(node: IRIfNode): string {
  if (node.condition) {
    return node.then.map(renderNode).join("");
  }
  return node.else?.map(renderNode).join("") ?? "";
}

function renderFor(node: IRForNode): string {
  // SSR: no runtime evaluation yet
  return node.body.map(renderNode).join("");
}

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

function escapeText(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(v: string): string {
  return escapeText(v).replace(/"/g, "&quot;");
}
