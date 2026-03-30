import { ParsedSFC } from "./types";
/**
 * Parses a Nebula SFC++ source string into a fully structured `ParsedSFC` object.
 *
 * This includes:
 * - extracting `<template>`, `<script>`, `<style>`, `<meta>`, and `<route>` blocks
 * - parsing `<meta>` and `<route>` using Nebula's mini YAML-like parser
 *
 * @param source - The full SFC source string.
 * @param filePath - The file path of the SFC, used for routing inference.
 * @returns A fully parsed `ParsedSFC` object.
 */
export declare function parseSFC(source: string, filePath: string): ParsedSFC;
