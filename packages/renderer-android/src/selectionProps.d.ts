export interface AndroidNormalizedSelectionPropUpdate {
    name: string;
    value: unknown;
}
export interface AndroidNormalizedSelectionProp extends AndroidNormalizedSelectionPropUpdate {
    additional?: AndroidNormalizedSelectionPropUpdate[];
}
export declare function normalizeAndroidSelectionProp(viewType: string, name: string, value: unknown): AndroidNormalizedSelectionProp | null;
//# sourceMappingURL=selectionProps.d.ts.map