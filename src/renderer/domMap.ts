import { UINode } from "../ui/node";
import { ParentDomNode } from "./domTypes";

export const domMap = new WeakMap<UINode, ParentDomNode>();
