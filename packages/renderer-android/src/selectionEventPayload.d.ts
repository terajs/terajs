export interface AndroidNativeSelectionRange {
    start: number;
    end: number;
}
export declare function extractAndroidSelectionRange(payload: unknown): AndroidNativeSelectionRange | undefined;
export declare function createAndroidSelectionPayload(range: AndroidNativeSelectionRange, payload: unknown): unknown;
//# sourceMappingURL=selectionEventPayload.d.ts.map