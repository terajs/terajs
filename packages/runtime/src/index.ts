/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/runtime package.
 * Coordinates component lifecycle and dependency injection.
 */

// Component Core
export { component, onCleanup } from "./component/component.js";
export { ComponentContext, getCurrentContext, setCurrentContext, createComponentContext } from "./component/context.js";
export type { Disposer } from "./component/context.js";

// Lifecycle Hooks
export { onMounted, onUpdated, onUnmounted } from "./component/lifecycle.js";
export { applyHMRUpdate, registerHMRComponent, unregisterHMRComponent } from "./hmr.js";
export type { HMRComponentHandle, HMRInstance } from "./hmr.js";

// Context / Dependency Injection (The "Nerve System")
export { provide } from "./context/provide.js";
export { inject } from "./context/inject.js";
export { 
  contextStack, 
  pushContextFrame, 
  popContextFrame 
} from "./context/contextStack.js";
export type { ContextFrame, ContextKey } from "./context/contextStack.js";

// Hydration (For SSR/Edge support)
export {
  consumeHydratedResource,
  getHydratedResource,
  scheduleHydration,
  setHydrationState
} from "./hydration.js";
export type { RuntimeHydrationState } from "./hydration.js";

// Persistence
export { localStorageAdapter } from "./persistence/adapters.js";
export type { PersistenceAdapter } from "./persistence/types.js";

// Renderer bridge
export {
  setCurrentRenderer,
  getCurrentRenderer
} from "./renderer.js";
export type { Renderer } from "./renderer.js";

// Async data
export { createAction } from "./action.js";
export type {
  Action,
  ActionOptions,
  ActionQueueOptions,
  ActionState,
  QueuedActionResult
} from "./action.js";
export { createResource } from "./resource.js";
export type { Resource, ResourceState, ResourcePayload, ResourceMutateOptions } from "./resource.js";
export {
  createMutationQueue,
  createMutationQueueStorage,
  defaultMutationRetryPolicy
} from "./queue/mutationQueue.js";
export type {
  EnqueueMutationInput,
  MutationConflictDecision,
  MutationConflictResolution,
  MutationConflictResolver,
  MutationFlushResult,
  MutationHandler,
  MutationQueue,
  MutationQueueOptions,
  MutationQueueStorage,
  MutationRetryPolicy,
  MutationStatus,
  QueuedMutation
} from "./queue/mutationQueue.js";
export {
  invalidateResources,
  registerResourceInvalidation
} from "./invalidation.js";
export type { ResourceKey } from "./invalidation.js";
export { createSchemaValidator } from "./validation.js";
export type {
  ParseSchema,
  SafeParseSchema,
  ValidationIssue,
  ValidationResult,
  Validator
} from "./validation.js";

// Server functions
export {
  executeServerFunction,
  executeServerFunctionCall,
  executeServerFunctionCallWithMetadata,
  getServerFunctionTransport,
  hasServerFunction,
  server,
  setServerFunctionTransport
} from "./server.js";
export type {
  ServerExecutionContext,
  ServerFunctionExecutionResult,
  ServerFunction,
  ServerFunctionCall,
  ServerFunctionOptions,
  ServerFunctionTransport
} from "./server.js";
export {
  createFetchServerFunctionTransport,
  createServerContextFromRequest,
  createServerFunctionRequestHandler,
  handleServerFunctionRequest,
  readServerFunctionCall
} from "./serverTransport.js";
export type {
  FetchServerFunctionTransportOptions,
  ServerFunctionErrorResponse,
  ServerFunctionRequestHandlerOptions,
  ServerFunctionResponse,
  ServerFunctionSuccessResponse
} from "./serverTransport.js";

// Components
export { Portal } from "./components/Portal.js";
export { Suspense } from "./components/Suspense.js";
export type { PortalProps } from "./components/Portal.js";
