import type {
  IRElementNode,
  IRInterpolationNode,
  IRPropNode,
  IRSlotNode,
  IRTextNode,
} from "@terajs/compiler";

export function createTextNode(value: string): IRTextNode {
  return {
    type: "text",
    value,
    loc: undefined,
    flags: {}
  };
}

export function createHintedBoundPropElementNode(options: {
  tag?: string;
  propName?: string;
  sourceName?: string;
  hinted?: boolean;
} = {}): IRElementNode {
  const {
    tag = "div",
    propName = "title",
    sourceName = "title",
    hinted = true,
  } = options;

  const prop: IRPropNode = {
    kind: "bind",
    name: propName,
    value: sourceName,
    ...(hinted
      ? {
          binding: {
            kind: "simple-path" as const,
            segments: [sourceName]
          }
        }
      : {})
  };

  return {
    type: "element",
    tag,
    props: [prop],
    children: [],
    loc: undefined,
    flags: { hasDirectives: false }
  };
}

export function createClickEventElementNode(options: {
  tag?: string;
  eventName?: string;
  handlerName?: string;
} = {}): IRElementNode {
  const {
    tag = "button",
    eventName = "click",
    handlerName = "onClick",
  } = options;

  return {
    type: "element",
    tag,
    props: [
      {
        kind: "event",
        name: eventName,
        value: handlerName
      }
    ],
    children: [],
    loc: undefined,
    flags: { hasDirectives: false }
  };
}

export function createProjectedDefaultSlotNode(
  fallbackText: string = "Fallback"
): IRSlotNode {
  return {
    type: "slot",
    name: "default",
    fallback: [createTextNode(fallbackText)],
    loc: undefined,
    flags: { dynamic: true }
  };
}

export function createInterpolatedChild(expression: string): IRInterpolationNode {
  return {
    type: "interp",
    expression,
    loc: undefined,
    flags: { dynamic: true }
  };
}