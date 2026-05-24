import type { AndroidNativeSelectionRange } from "./selectionEventPayload.js";
export interface AndroidTextEventConstraintState {
    text?: string;
    compositionText?: string;
    composing?: boolean;
    selectionRange?: AndroidNativeSelectionRange;
}
export declare function applyAndroidTextEventConstraints<T extends AndroidTextEventConstraintState>(props: Record<string, unknown>, state: T): T;
//# sourceMappingURL=textEventConstraints.d.ts.map