// packages/compiler/src/parseTemplateToAst.ts

import type {
  ASTNode,
  ElementNode,
  PortalNode,
  SlotNode,
  TextNode,
  InterpolationNode,
  PropNode,
  IfNode,
  ForNode
} from "@terajs/renderer";
import { tokenizeTemplate, type Token } from "./templateTokenizer.js";

export function parseTemplateToAst(template: string): ASTNode[] {
  const tokens = tokenizeTemplate(template);
  const ctx = new ParserContext(tokens);
  return ctx.parseChildren();
}

class ParserContext {
  private i = 0;

  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.i + offset];
  }

  private next(): Token | undefined {
    return this.tokens[this.i++];
  }

  private eof(): boolean {
    return this.i >= this.tokens.length;
  }

  parseChildren(stopOnTagClose?: string): ASTNode[] {
    const nodes: ASTNode[] = [];
    let lastIfNode: IfNode | null = null;

    while (!this.eof()) {
      const token = this.peek();
      if (!token) break;

      // FIRST: detect v-else / v-else-if
      if (token.type === "tagOpen") {
        const attrToken = this.peek(1);

        if (attrToken?.type === "attrName" && (attrToken.value === "v-else" || attrToken.value === "v-else-if")) {
          if (!lastIfNode) {
            throw new Error(`${attrToken.value} used without a preceding v-if`);
          }

          // Capture v-else-if condition BEFORE parseElement strips directives
          let elseIfCondition = "";
          if (attrToken.value === "v-else-if") {
            const valueToken = this.peek(2);
            if (valueToken?.type === "attrValue") {
              elseIfCondition = valueToken.value;
            }
          }

          // Parse the element normally
          const elseNode = this.parseElement() as ElementNode;

          if (attrToken.value === "v-else") {
            // Simple else: attach children
            lastIfNode.else = elseNode.children;
          } else {
            // v-else-if: create nested IfNode
            const nestedIf: IfNode = {
              type: "if",
              condition: elseIfCondition,
              then: elseNode.children,
              else: undefined
            };

            lastIfNode.else = [nestedIf];
            lastIfNode = nestedIf;
          }

          continue; // IMPORTANT: do NOT push this element into nodes[]
        }

        // Normal element
        const node = this.parseElement();
        nodes.push(node);

        lastIfNode = node.type === "if" ? node : null;
        continue;
      }

      if (token.type === "tagClose" && stopOnTagClose && token.value === stopOnTagClose) {
        this.next(); // consume close
        break;
      }

      if (token.type === "text") {
        nodes.push(this.parseText());
        continue;
      }

      if (token.type === "interp") {
        nodes.push(this.parseInterpolation());
        continue;
      }
      
      // Skip comments and unknowns
      this.next();
    }

    return nodes;
  }


  private parseText(): TextNode {
    const token = this.next()!;
    return {
      type: "text",
      value: token.value
    };
  }

  private parseInterpolation(): InterpolationNode {
    const token = this.next()!;
    return {
      type: "interp",
      expression: token.value.trim()
    };
  }

  private parseElement(): ASTNode {
    const open = this.next()!; // tagOpen
    const tag = open.value;

    const props: PropNode[] = [];

    // Collect attributes
    while (!this.eof()) {
      const t = this.peek();
      if (!t) break;

      if (t.type === "tagSelfClose") {
        this.next();
        return this.finalizeElement(tag, props, []);
      }

      if (t.type === "attrName") {
        const nameToken = this.next()!;
        const valueToken = this.peek()?.type === "attrValue" ? this.next()! : undefined;

        props.push(this.buildProp(nameToken.value, valueToken?.value));
        continue;
      }

      if (t.type === "text" || t.type === "interp" || t.type === "tagOpen") {
        break;
      }

      if (t.type === "tagClose") {
        break;
      }

      this.next();
    }

    // Children
    const children = this.parseChildren(tag);

    // Directives: v-if / v-for
    const ifDir = props.find((p) => p.kind === "directive" && p.name === "v-if");
    const forDir = props.find((p) => p.kind === "directive" && p.name === "v-for");

    return this.finalizeElement(tag, props, children, ifDir, forDir);
  }

  private finalizeElement(
    tag: string,
    props: PropNode[],
    children: ASTNode[],
    ifDir?: PropNode,
    forDir?: PropNode
  ): ASTNode {
    if (tag === "Portal") {
      const target = props.find((p) => p.name === "to");
      return {
        type: "portal",
        target,
        children
      } as PortalNode;
    }

    if (tag === "slot") {
      const nameProp = props.find((p) => p.kind === "static" && p.name === "name");
      return {
        type: "slot",
        name: typeof nameProp?.value === "string" && nameProp.value.length > 0 ? nameProp.value : undefined,
        fallback: children
      } as SlotNode;
    }

    if (ifDir) {
      return {
        type: "if",
        condition: ifDir.value,
        then: children
      } as IfNode;
    }

    if (forDir) {
      const { each, item, index } = parseForExpression(forDir.value);
      return {
        type: "for",
        each,
        item,
        index,
        body: children
      } as ForNode;
    }

    return {
      type: "element",
      tag,
      props: props.filter((p) => p.kind !== "directive"),
      children
    } as ElementNode;
  }

  private buildProp(name: string, rawValue?: string): PropNode {
    // v- directives
    if (name.startsWith("v-")) {
      return {
        name,
        value: rawValue ?? "",
        kind: "directive"
      };
    }

    // :prop or v-bind:prop
    if (name.startsWith(":")) {
      return {
        name: name.slice(1),
        value: rawValue ?? "",
        kind: "bind"
      };
    }

    if (name.startsWith("v-bind:")) {
      return {
        name: name.slice("v-bind:".length),
        value: rawValue ?? "",
        kind: "bind"
      };
    }

    // @event or v-on:event
    if (name.startsWith("@")) {
      return {
        name: name.slice(1),
        value: rawValue ?? "",
        kind: "event"
      };
    }

    if (name.startsWith("v-on:")) {
      return {
        name: name.slice("v-on:".length),
        value: rawValue ?? "",
        kind: "event"
      };
    }

    // Static
    return {
      name,
      value: rawValue ?? "",
      kind: "static"
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                              v-for expression                              */
/* -------------------------------------------------------------------------- */

function parseForExpression(expr: string): { each: string; item: string; index?: string } {
  // Example: "item in items", "(item, i) in items"
  const inIndex = expr.indexOf(" in ");
  if (inIndex === -1) {
    return { each: expr.trim(), item: "item" };
  }

  const lhs = expr.slice(0, inIndex).trim();
  const rhs = expr.slice(inIndex + 4).trim();

  if (lhs.startsWith("(") && lhs.endsWith(")")) {
    const parts = lhs.slice(1, -1).split(",").map((s) => s.trim());
    return {
      each: rhs,
      item: parts[0] || "item",
      index: parts[1]
    };
  }

  return {
    each: rhs,
    item: lhs || "item"
  };
}

