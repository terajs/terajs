/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/runtime package.
 * Coordinates component lifecycle and dependency injection.
 */

// Component Core
export { component, onCleanup } from "./component/component";
export { ComponentContext, getCurrentContext, setCurrentContext, createComponentContext } from "./component/context";
export type { Disposer } from "./component/context";

// Lifecycle Hooks
export { onMounted, onUpdated, onUnmounted } from "./component/lifecycle";

// Context / Dependency Injection (The "Nerve System")
export { provide } from "./context/provide";
export { inject } from "./context/inject";
export { 
  contextStack, 
  pushContextFrame, 
  popContextFrame 
} from "./context/contextStack";
export type { ContextFrame, ContextKey } from "./context/contextStack";

// Hydration (For SSR/Edge support)
export {
  consumeHydratedResource,
  getHydratedResource,
  scheduleHydration,
  setHydrationState
} from "./hydration";
export type { RuntimeHydrationState } from "./hydration";

// Persistence
export { localStorageAdapter } from "./persistence/adapters";
export type { PersistenceAdapter } from "./persistence/types";

// Renderer bridge
export {
  setCurrentRenderer,
  getCurrentRenderer
} from "./renderer";
export type { Renderer } from "./renderer";

// Async data
export { createAction } from "./action";
export type { Action, ActionOptions, ActionState } from "./action";
export { createResource } from "./resource";
export type { Resource, ResourceState, ResourcePayload } from "./resource";
export {
  invalidateResources,
  registerResourceInvalidation
} from "./invalidation";
export type { ResourceKey } from "./invalidation";

// Server functions
export {
  executeServerFunction,
  executeServerFunctionCall,
  executeServerFunctionCallWithMetadata,
  getServerFunctionTransport,
  hasServerFunction,
  server,
  setServerFunctionTransport
} from "./server";
export type {
  ServerExecutionContext,
  ServerFunctionExecutionResult,
  ServerFunction,
  ServerFunctionCall,
  ServerFunctionOptions,
  ServerFunctionTransport
} from "./server";
export {
  createFetchServerFunctionTransport,
  createServerContextFromRequest,
  createServerFunctionRequestHandler,
  handleServerFunctionRequest,
  readServerFunctionCall
} from "./serverTransport";
export type {
  FetchServerFunctionTransportOptions,
  ServerFunctionErrorResponse,
  ServerFunctionRequestHandlerOptions,
  ServerFunctionResponse,
  ServerFunctionSuccessResponse
} from "./serverTransport";

// Components
export { Portal } from "./components/Portal";
export { Suspense } from "./components/Suspense";
export type { PortalProps } from "./components/Portal";
