// packages/renderer-ssr/src/types.ts
export interface SSRContext {
  meta: Record<string, any>;
  route: Record<string, any> | null;
}

export interface SSRResult {
  html: string;
  head: string;
}
