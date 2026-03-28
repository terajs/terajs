import { UINode, UINodeFlags, Fragment, ComponentFn } from "../src/ui/node";

export function textNode(text: string): UINode {
    return {
        flags: UINodeFlags.TEXT,
        type: "",
        props: null,
        children: text
    };
}

export function elNode(tag: string, props: any = null, children: any = null): UINode {
    return {
        flags: UINodeFlags.ELEMENT,
        type: tag,
        props,
        children
    };
}

export function fragNode(children: UINode[]): UINode {
    return {
        flags: UINodeFlags.FRAGMENT,
        type: Fragment,
        props: null,
        children
    };
}

export function compNode(fn: ComponentFn, props: any = {}): UINode {
    return {
        flags: UINodeFlags.COMPONENT,
        type: fn,
        props,
        children: null
    };
}
