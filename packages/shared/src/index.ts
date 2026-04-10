/**
 * @file index.ts
 * @description Entry point for the @terajs/shared package.
 */

// 1. Identity & Metadata
export * from "./debug/utils/id";
export * from "./debug/metadata"; 

// 2. Core Registries & Logic
export * from "./debug/core/registry";
export * from "./debug/core/graphRegistry"; // This provides addDependency, getNode, etc.

// 3. The Public API Facade (THE TRUTH)
export { addDependency, removeDependencyNode } from "./debug/dependencyGraph"; 

// 4. The Event System
// IMPORTANT: We need both the Debug object AND the named functions
export { Debug, resetDebugHandlers } from "./debug/events"; 
export { emitDebug, getDebugListenerCount, subscribeDebug } from "./debug/eventBus"; 
export { resetDebugListeners } from "./debug/eventBus";
// 5. Context & Types
export * from "./debug/context";
export * from "./debug/devtoolsBridge";
export * from "./debug/types/events"; 
export * from "./debug/types/metadata";
export * from "./debug/types/registry";
export * from "./debug/types/graph";
export * from "./hydration";
export * from "./routeTypes";
export * from "./server";
export * from "./errorBoundary";

export { 
  getCurrentContext, 
  setCurrentContext, 
  createComponentContext, 
} from "./context";
export type { ComponentContext, Disposer } from "./context";
