import { Debug } from "@terajs/shared";
export const rendererDebugEnabled = process.env.NODE_ENV !== "production";
export function emitRendererDebug(type, payloadFactory) {
    if (!rendererDebugEnabled) {
        return;
    }
    Debug.emit(type, payloadFactory());
}
