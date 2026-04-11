/**
 * @file index.ts
 * @description Entry point for the @terajs/shared package.
 */

// Identity and metadata utilities
export * from "./debug/utils/id.js";
export * from "./debug/metadata.js"; 

// Core registries and graph APIs
export * from "./debug/core/registry.js";
export * from "./debug/core/graphRegistry.js";

// Dependency graph facade
export { addDependency, removeDependencyNode } from "./debug/dependencyGraph.js"; 

// Debug event system
export { Debug, resetDebugHandlers } from "./debug/events.js"; 
export { emitDebug, getDebugListenerCount, subscribeDebug } from "./debug/eventBus.js"; 
export { resetDebugListeners } from "./debug/eventBus.js";

// Context and shared types
export * from "./debug/context.js";
export * from "./debug/devtoolsBridge.js";
export * from "./debug/types/events.js"; 
export * from "./debug/types/metadata.js";
export * from "./debug/types/registry.js";
export * from "./debug/types/graph.js";
export * from "./hydration.js";
export * from "./routeTypes.js";
export * from "./server.js";
export * from "./errorBoundary.js";

export { 
  getCurrentContext, 
  setCurrentContext, 
  createComponentContext, 
} from "./context.js";
export type { ComponentContext, Disposer } from "./context.js";
