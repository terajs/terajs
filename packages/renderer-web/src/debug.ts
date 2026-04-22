import { Debug } from "@terajs/shared";

export const rendererDebugEnabled = process.env.NODE_ENV !== "production";

export function emitRendererDebug<TType extends string>(
  type: TType,
  payloadFactory: () => any,
): void {
  if (!rendererDebugEnabled) {
    return;
  }

  Debug.emit(type as any, payloadFactory());
}