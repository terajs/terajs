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
export { 
  pushEffect, 
  popEffect, 
  currentEffect, 
  getCurrentEffect, // Essential for DX utilities
  withDetachedCurrentEffect,
  type ReactiveEffect 
} from "./deps.js";

// Primitives
export { state } from "./state.js";
export { signal, getActiveSignals, type Signal } from "./signal.js";
export { ref, type Ref } from "./ref.js";

// Complex Reactivity
export { reactive, type Reactive } from "./reactive.js";
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
export { isServer, setRuntimeMode, type RuntimeMode } from "./dx/runtime.js";
