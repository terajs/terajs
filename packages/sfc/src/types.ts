/**
 * Hydration strategies supported by Nebula SFC++.
 *
 * These determine when a server-rendered component becomes interactive.
 *
 * - `"eager"` — Hydrate immediately after SSR.
 * - `"visible"` — Hydrate when the component enters the viewport.
 * - `"idle"` — Hydrate when the browser is idle.
 * - `"interaction"` — Hydrate on first user interaction.
 * - `"none"` — Never hydrate; remains static HTML.
 * - `"ai"` — Allow an AI-driven strategy to choose the optimal mode.
 */
export type HydrationMode =
  | "eager"
  | "visible"
  | "idle"
  | "interaction"
  | "none"
  | "ai";

/**
 * Optional route overrides declared inside an SFC `<route>` block.
 *
 * These values override defaults inferred from the file path and routing system.
 * Parsed from a YAML-like block using Nebula's internal mini parser.
 */
export interface RouteOverride {
  /** Custom route path, e.g. "/blog/:slug". */
  path?: string;

  /** Named layout to apply, e.g. "default" or "admin". */
  layout?: string;

  /** Middleware to run before entering this route. */
  middleware?: string | string[];

  /** Whether this route should be prerendered at build time. */
  prerender?: boolean;

  /** Hydration strategy override for this route. */
  hydrate?: HydrationMode;

  /** Whether this route should run on an edge runtime. */
  edge?: boolean;
}

/**
 * Metadata configuration declared inside an SFC `<meta>` block.
 *
 * Drives SEO, AI, analytics, performance, and accessibility behavior.
 * Parsed from a YAML-like block using Nebula's internal mini parser.
 */
export interface MetaConfig {
  /** Page title used for `<title>` and SEO. */
  title?: string;

  /** Page description used for meta description and link previews. */
  description?: string;

  /** SEO keywords as a string or list. */
  keywords?: string[] | string;

  /** AI-generated or explicit summary of the page. */
  aiSummary?: "auto" | string;

  /** AI-generated or explicit keywords. */
  aiKeywords?: "auto" | string[];

  /** Whether to auto-generate alt text for images. */
  aiAltText?: "auto" | boolean;

  /** Arbitrary schema.org / JSON-LD configuration. */
  schema?: unknown;

  /** Analytics configuration for this page. */
  analytics?: {
    /** Whether to track this page. */
    track?: boolean;
    /** Named events to emit on view or interaction. */
    events?: string[];
  };

  /** Performance-related hints and configuration. */
  performance?: {
    /** Relative priority of this page. */
    priority?: "low" | "normal" | "high";
    /** Hydration strategy override at the meta level. */
    hydrate?: HydrationMode;
    /** Cache hint, e.g. "1h", "5m". */
    cache?: string;
    /** Whether this page should run on the edge runtime. */
    edge?: boolean;
  };

  /** Accessibility-related hints and AI helpers. */
  a11y?: {
    /** Auto-generate alt text where missing. */
    autoAlt?: boolean;
    /** Auto-generate labels where missing. */
    autoLabel?: boolean;
    /** Enforce or auto-add landmark roles. */
    autoLandmarks?: boolean;
  };

  /** Internationalization-related configuration. */
  i18n?: {
    /** Supported languages for this page. */
    languages?: string[];
    /** Whether to auto-translate content. */
    autoTranslate?: boolean;
  };
}

/**
 * Parsed representation of a Nebula SFC++ file.
 *
 * Includes:
 * - raw template/script/style blocks
 * - parsed metadata from `<meta>`
 * - parsed route overrides from `<route>`
 */
export interface ParsedSFC {
  /** Absolute or project-relative file path of the SFC. */
  filePath: string;

  /** Raw contents of the `<template>` block. */
  template: string;

  /** Raw contents of the `<script>` block. */
  script: string;

  /** Raw contents of the `<style>` block, if present. */
  style: string | null;

  /** Parsed metadata configuration from the `<meta>` block. */
  meta: MetaConfig;

  /** Parsed route override configuration from the `<route>` block, if present. */
  routeOverride: RouteOverride | null;
}
