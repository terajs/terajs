export interface AndroidNormalizedInputPropUpdate {
    name: string;
    value: unknown;
}
export interface AndroidNormalizedInputProp extends AndroidNormalizedInputPropUpdate {
    additional?: AndroidNormalizedInputPropUpdate[];
}
export declare function normalizeAndroidInputProp(viewType: string, name: string, value: unknown): AndroidNormalizedInputProp | null;
//# sourceMappingURL=inputProps.d.ts.map