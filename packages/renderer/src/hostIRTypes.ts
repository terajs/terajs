export interface HostIRFlags {
  dynamic?: boolean;
  static?: boolean;
  hasDirectives?: boolean;
}

export interface HostIRNodeBase {
  type: string;
  loc?: { start: number; end: number };
  flags?: HostIRFlags;
}

export interface HostIRTextNode extends HostIRNodeBase {
  type: "text";
  value: string;
}

export interface HostIRBindingHint {
  kind: "simple-path";
  segments: string[];
}

export interface HostIRInterpolationNode extends HostIRNodeBase {
  type: "interp";
  expression: string;
  binding?: HostIRBindingHint;
}

export interface HostIRPropNode {
  kind: "static" | "bind" | "event" | "directive" | string;
  name: string;
  value: unknown;
  binding?: HostIRBindingHint;
}

export interface HostIRElementNode extends HostIRNodeBase {
  type: "element";
  tag: string;
  props: HostIRPropNode[];
  children: HostIRNode[];
}

export interface HostIRPortalNode extends HostIRNodeBase {
  type: "portal";
  target?: HostIRPropNode;
  children: HostIRNode[];
}

export interface HostIRSlotNode extends HostIRNodeBase {
  type: "slot";
  name?: string;
  fallback: HostIRNode[];
}

export interface HostIRIfNode extends HostIRNodeBase {
  type: "if";
  condition: string;
  then: HostIRNode[];
  else?: HostIRNode[];
}

export interface HostIRForNode extends HostIRNodeBase {
  type: "for";
  isStructural?: boolean;
  each: string;
  item: string;
  index?: string;
  body: HostIRNode[];
}

export type HostIRNode =
  | HostIRTextNode
  | HostIRInterpolationNode
  | HostIRElementNode
  | HostIRPortalNode
  | HostIRSlotNode
  | HostIRIfNode
  | HostIRForNode;

export interface HostIRModule {
  filePath: string;
  template: HostIRNode[];
}