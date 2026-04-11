import type { HydrationMode, MetaConfig } from "@terajs/shared";

export type RouteMetaConfig = MetaConfig;

export interface RouteLayoutDefinition {
  id: string;
  filePath: string;
  component: () => Promise<unknown>;
}

export interface RouteDefinition {
  id: string;
  path: string;
  filePath: string;
  component: () => Promise<unknown>;
  layout?: any;
  mountTarget?: string;
  asset?: string;
  children?: RouteDefinition[];
  middleware: string[];
  prerender: boolean;
  hydrate: HydrationMode;
  edge: boolean;
  meta: MetaConfig;
  ai?: Record<string, any>;
  layouts: RouteLayoutDefinition[];
}