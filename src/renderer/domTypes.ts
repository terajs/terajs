/**
 * A DOM node that can contain children.
 */
export type ParentDomNode = HTMLElement | DocumentFragment;

/**
 * Any DOM node Nebula can create.
 */
export type DomNode = ParentDomNode | Text;
