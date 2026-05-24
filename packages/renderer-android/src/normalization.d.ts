export interface AndroidNormalizedProp {
    name: string;
    value: unknown;
    additional?: Array<{
        name: string;
        value: unknown;
    }>;
}
export declare function normalizeAndroidProp(viewType: string, name: string, value: unknown): AndroidNormalizedProp;
export declare function normalizeAndroidEventName(viewType: string, name: string): string;
//# sourceMappingURL=normalization.d.ts.map