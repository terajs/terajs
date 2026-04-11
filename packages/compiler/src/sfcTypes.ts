import type { MetaConfig, RouteOverride } from "@terajs/shared";

export type { MetaConfig, RouteOverride };

export interface ParsedSFC {
  filePath: string;
  template: string | { content: string };
  script: string | { content: string; lang?: string };
  style: string | { content: string; scoped?: boolean; lang?: string } | null;
  meta: MetaConfig;
  ai?: Record<string, any>;
  routeOverride: RouteOverride | null;
}