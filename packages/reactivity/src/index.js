/**
 * @file index.ts
 * @description
 * Entry point for the Terajs Reactivity System.
 * * This package provides the fine-grained primitives required to build
 * reactive interfaces with automatic dependency tracking and
 * deep-diffing capabilities.
 */
// Core Tracking & Execution
export { effect, scheduleEffect } from "./effect.js";
export { pushEffect, popEffect, currentEffect, getCurrentEffect, // Essential for DX utilities
withDetachedCurrentEffect } from "./deps.js";
// Primitives
export { state } from "./state.js";
export { signal, getActiveSignals } from "./signal.js";
export { ref } from "./ref.js";
// Complex Reactivity
export { reactive } from "./reactive.js";
export { computed } from "./computed.js";
export { model } from "./model.js";
// DX Layer (Platform Agnostic)
export { onEffectCleanup } from "./dx/cleanup.js";
export { dispose } from "./dx/dispose.js";
export { watch } from "./dx/watch.js";
export { watchEffect } from "./dx/watchEffect.js";
export { contract } from "./dx/contract.js";
// DX Utilities
export { memo, markStatic, shallowRef } from "./memo.js";
// Runtime mode helpers
export { isServer, setRuntimeMode } from "./dx/runtime.js";
