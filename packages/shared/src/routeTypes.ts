import type { HydrationMode } from "./hydration.js";

export interface RouteOverride {
  path?: string;
  layout?: string;
  mountTarget?: string;
  middleware?: string | string[];
  prerender?: boolean;
  hydrate?: HydrationMode;
  edge?: boolean;
}

export interface MetaConfig {
  [key: string]: unknown;
  title?: string;
  description?: string;
  keywords?: string[] | string;
  aiSummary?: "auto" | string;
  aiKeywords?: "auto" | string[];
  aiAltText?: "auto" | boolean;
  schema?: unknown;
  analytics?: {
    track?: boolean;
    events?: string[];
  };
  performance?: {
    priority?: "low" | "normal" | "high";
    hydrate?: HydrationMode;
    cache?: string;
    edge?: boolean;
  };
  a11y?: {
    autoAlt?: boolean;
    autoLabel?: boolean;
    autoLandmarks?: boolean;
  };
  i18n?: {
    languages?: string[];
    autoTranslate?: boolean;
  };
}