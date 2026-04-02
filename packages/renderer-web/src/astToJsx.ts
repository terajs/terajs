/**
 * @file astToJsx.ts
 * @description
 * Converts Nebula's platform-agnostic AST into JSX elements
 * using the existing renderer-web JSX runtime.
 */

import { jsx, jsxs, Fragment } from "./jsx-runtime";
import { Debug } from "@nebula/shared";

import type {
  ASTNode,
  ElementNode,
  TextNode,
  InterpolationNode,
  IfNode,
  ForNode
} from "@nebula/renderer";

function assertNever(x: never): never {
  throw new Error("Unexpected AST node: " + JSON.stringify(x));
}

export function renderAst(node: ASTNode, ctx: any): any {
  Debug.emit("template:ast:render", { node });

  switch (node.type) {
    case "text":
      return renderText(node);

    case "interp":
      return renderInterpolation(node, ctx);

    case "element":
      return renderElement(node, ctx);

    case "if":
      return renderIf(node, ctx);

    case "for":
      return renderFor(node, ctx);

    default:
      Debug.emit("error:renderer", {
        message: `Unknown AST node type`,
        node
      });
      return assertNever(node);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TEXT                                     */
/* -------------------------------------------------------------------------- */

function renderText(node: TextNode) {
  Debug.emit("template:ast:text", { value: node.value });
  return node.value;
}

/* -------------------------------------------------------------------------- */
/*                              INTERPOLATION                                 */
/* -------------------------------------------------------------------------- */

function renderInterpolation(node: InterpolationNode, ctx: any) {
  const value = ctx[node.expression];

  Debug.emit("template:ast:interp", {
    expression: node.expression,
    value
  });

  return value ?? "";
}

/* -------------------------------------------------------------------------- */
/*                                  ELEMENT                                   */
/* -------------------------------------------------------------------------- */

function renderElement(node: ElementNode, ctx: any) {
  Debug.emit("template:ast:element", {
    tag: node.tag,
    props: node.props
  });

  const props: Record<string, any> = {};

  for (const p of node.props) {
    if (p.kind === "static") {
      props[p.name] = p.value;
    }

    else if (p.kind === "bind") {
      props[p.name] = ctx[p.value];
    }

    else if (p.kind === "event") {
      const handler = ctx[p.value];

      if (typeof handler !== "function") {
        Debug.emit("error:renderer", {
          message: `Event handler '${p.value}' is not a function`,
          tag: node.tag,
          prop: p
        });
      }

      props["on" + capitalize(p.name)] = handler;
    }
  }

  const children = flatten(node.children.map((c) => renderAst(c, ctx)));

  return jsxs(node.tag, { ...props, children });
}

/* -------------------------------------------------------------------------- */
/*                                    IF                                      */
/* -------------------------------------------------------------------------- */

function renderIf(node: IfNode, ctx: any) {
  const conditionValue = ctx[node.condition];

  Debug.emit("template:ast:if", {
    condition: node.condition,
    value: conditionValue
  });

  if (conditionValue) {
    return flatten(node.then.map((n) => renderAst(n, ctx)));
  }

  return flatten(node.else?.map((n) => renderAst(n, ctx)) ?? []);
}

/* -------------------------------------------------------------------------- */
/*                                    FOR                                     */
/* -------------------------------------------------------------------------- */

function renderFor(node: ForNode, ctx: any) {
  const list = ctx[node.each] ?? [];

  Debug.emit("template:ast:for", {
    each: node.each,
    length: Array.isArray(list) ? list.length : 0
  });

  if (!Array.isArray(list)) {
    Debug.emit("error:renderer", {
      message: `v-for expected array but got ${typeof list}`,
      each: node.each
    });
    return null;
  }

  return flatten(
    list.map((item: any, index: number) => {
      const childCtx = {
        ...ctx,
        [node.item]: item,
        [node.index ?? "i"]: index
      };

      return node.body.map((n) => renderAst(n, childCtx));
    })
  );
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function flatten(arr: any[]): any[] {
  return arr.flat(Infinity);
}
