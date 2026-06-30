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

const SUPPORTED_EVENT_MODIFIERS = new Set(["prevent", "stop"]);

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
            // Simple else: attach the conditional host element.
            lastIfNode.else = [elseNode];
          } else {
            // v-else-if: create nested IfNode
            const nestedIf: IfNode = {
              type: "if",
              condition: elseIfCondition,
              then: [elseNode],
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
        then: [
          this.createElementNode(tag, props, children)
        ]
      } as IfNode;
    }

    if (forDir) {
      const { each, item, index } = parseForExpression(forDir.value);
      return {
        type: "for",
        isStructural: true,
        each,
        item,
        index,
        body: [
          this.createElementNode(tag, props, children)
        ]
      }
    }

    return this.createElementNode(tag, props, children);
  }

  private createElementNode(tag: string, props: PropNode[], children: ASTNode[]): ElementNode {
    return {
      type: "element",
      tag,
      props: props.filter((p) => p.kind !== "directive"),
      children
    };
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
      const event = parseEventName(name.slice(1), name);
      return {
        name: event.name,
        value: rawValue ?? "",
        kind: "event",
        ...(event.modifiers.length > 0 ? { modifiers: event.modifiers } : {})
      };
    }

    if (name.startsWith("v-on:")) {
      const event = parseEventName(name.slice("v-on:".length), name);
      return {
        name: event.name,
        value: rawValue ?? "",
        kind: "event",
        ...(event.modifiers.length > 0 ? { modifiers: event.modifiers } : {})
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

function parseEventName(rawName: string, originalName: string): { name: string; modifiers: string[] } {
  const [eventName = "", ...modifiers] = rawName.split(".");
  if (eventName.length === 0) {
    throw new Error(`Event binding "${originalName}" is missing an event name.`);
  }

  for (const modifier of modifiers) {
    if (!SUPPORTED_EVENT_MODIFIERS.has(modifier)) {
      throw new Error(
        `Unsupported event modifier ".${modifier}" on "${originalName}". Supported modifiers: ${[...SUPPORTED_EVENT_MODIFIERS].join(", ")}.`
      );
    }
  }

  return {
    name: eventName,
    modifiers
  };
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

