import { type AndroidNativeSelectionRange } from "./selectionEventPayload.js";
export interface AndroidTextEditPreviewState {
    currentText: string;
    currentSelection: AndroidNativeSelectionRange;
    replacementRange: AndroidNativeSelectionRange;
    text: string;
    selectionRange: AndroidNativeSelectionRange;
}
export interface AndroidTextEditPreviewOptions {
    record?: Record<string, unknown>;
    inputType?: string;
    allowDeleteInference?: boolean;
}
export declare function extractAndroidTextEditRecord(payload: unknown): Record<string, unknown> | undefined;
export declare function extractAndroidTextEditString(record: Record<string, unknown> | undefined, payload: unknown, keys?: readonly string[]): string | undefined;
export declare function resolveAndroidTextEditPreview(props: Record<string, unknown>, payload: unknown, replacementText: string, options?: AndroidTextEditPreviewOptions): AndroidTextEditPreviewState;
//# sourceMappingURL=textEditPreview.d.ts.map