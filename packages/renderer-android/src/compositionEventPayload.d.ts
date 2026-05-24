import { type AndroidNativeSelectionRange } from "./selectionEventPayload.js";
export interface AndroidCompositionEventState {
    text?: string;
    compositionText?: string;
    composing: boolean;
    selectionRange?: AndroidNativeSelectionRange;
    replacementRange?: AndroidNativeSelectionRange;
    baseText?: string;
}
export declare function extractAndroidCompositionState(props: Record<string, unknown>, eventName: string, payload: unknown): AndroidCompositionEventState;
export declare function createAndroidCompositionPayload(state: AndroidCompositionEventState, payload: unknown): unknown;
//# sourceMappingURL=compositionEventPayload.d.ts.map