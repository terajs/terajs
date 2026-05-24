export type TokenType = "text" | "tagOpen" | "tagClose" | "tagSelfClose" | "attrName" | "attrValue" | "interp" | "comment";
export interface Token {
    type: TokenType;
    value: string;
    start: number;
    end: number;
}
export declare function tokenizeTemplate(input: string): Token[];
//# sourceMappingURL=templateTokenizer.d.ts.map