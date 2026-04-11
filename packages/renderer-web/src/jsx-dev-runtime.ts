import { Fragment, jsx } from "./jsx-runtime.js";

export { Fragment };

export function jsxDEV(
  type: any,
  props: any,
  key?: string | number,
  _isStaticChildren?: boolean,
  _source?: unknown,
  _self?: unknown
): Node {
  if (key !== undefined && key !== null) {
    return jsx(type, { ...(props ?? {}), key });
  }

  return jsx(type, props);
}
