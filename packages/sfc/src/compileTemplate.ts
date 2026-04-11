/**
 * @file compileTemplate.ts
 * @description
 * SFC-aware template compiler entry point for Terajs.
 *
 * This is a thin wrapper around `generateIRModule`, which:
 * - parses the `<template>` block into an AST
 * - normalizes it into renderer-agnostic IR
 * - attaches meta, ai, and route overrides from the SFC
 *
 * The result is an `IRModule` that can be consumed by:
 * - DOM renderer (`renderIRModuleToFragment`)
 * - SSR renderer
 * - router
 * - meta system
 * - devtools
 */

import type { ParsedSFC } from "@terajs/sfc";
import type { IRModule } from "@terajs/compiler";
import { generateIRModule } from "@terajs/compiler";

/**
 * Compiles a Terajs SFC's `<template>` (plus meta/ai/route)
 * into a full `IRModule`.
 *
 * @param sfc - The parsed SFC structure (from `parseSFC`).
 * @returns An `IRModule` ready for rendering and analysis.
 */
export function compileTemplateFromSFC(sfc: ParsedSFC): IRModule {
  return generateIRModule(sfc);
}

