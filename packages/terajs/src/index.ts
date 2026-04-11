/**
 * @file index.ts
 * @description
 * Default app-facing Terajs entry package.
 */

export * from "@terajs/reactivity";
export * from "@terajs/runtime";
export * from "@terajs/router";
export { buildRouteManifest } from "@terajs/router-manifest";
export type {
	RouteConfigInput,
	RouteManifestOptions,
	RouteSourceInput
} from "@terajs/router-manifest";
export {
	mount,
	unmount,
	type MountOptions,
	createRouteView,
	Link,
	Form,
	SubmitButton,
	FormStatus,
	RoutePending,
	useIsNavigating,
	usePendingTarget,
	withErrorBoundary,
	defineCustomElement,
	formDataToObject,
	renderIRModuleToFragment
} from "@terajs/renderer-web";
export * as web from "@terajs/renderer-web";
