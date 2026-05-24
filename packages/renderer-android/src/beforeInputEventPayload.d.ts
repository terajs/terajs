import { type AndroidNativeSelectionRange } from "./selectionEventPayload.js";
export interface AndroidBeforeInputEventState {
    text: string;
    data: string;
    inputType: string;
    replacementRange: AndroidNativeSelectionRange;
    selectionRange: AndroidNativeSelectionRange;
}
export declare function extractAndroidBeforeInputState(props: Record<string, unknown>, payload: unknown): AndroidBeforeInputEventState;
export declare function createAndroidBeforeInputPayload(state: AndroidBeforeInputEventState, payload: unknown): unknown;
//# sourceMappingURL=beforeInputEventPayload.d.ts.map