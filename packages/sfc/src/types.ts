import type { MetaConfig, RouteOverride } from "@terajs/shared";

/**
 * Optional route overrides declared inside an SFC `<route>` block.
 *
 * These values override defaults inferred from the file path and routing system.
 * Parsed from a YAML-like block using Nebula's internal mini parser.
 */
export type { RouteOverride };

/**
 * Metadata configuration declared inside an SFC `<meta>` block.
 *
 * Drives SEO, AI, analytics, performance, and accessibility behavior.
 * Parsed from a YAML-like block using Nebula's internal mini parser.
 */
export type { MetaConfig };

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

  /** Raw or parsed contents of the `<template>` block. */
  template: string | { content: string };

  /** Raw or parsed contents of the `<script>` block. */
  script: string | { content: string; lang?: string };

  /** Raw or parsed contents of the `<style>` block, if present. */
  style: string | { content: string; scoped?: boolean; lang?: string } | null;

  /** Parsed metadata configuration from the `<meta>` block. */
  meta: MetaConfig;

  /** Parsed AI block (optional). */
  ai?: Record<string, any>;

  /** Parsed route override configuration from the `<route>` block, if present. */
  routeOverride: RouteOverride | null;
}

