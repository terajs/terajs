export { inferPathFromFile, buildRouteFromSFC } from "./builder.js";
export { buildRouteManifest } from "./manifest.js";
export { generateRouteConfig, generateRouteConfigWithAssets } from "./routeConfigSource.js";
export { generateRoutesModuleSource } from "./moduleSource.js";

export type { RouteConfigInput, RouteManifestOptions, RouteSourceInput } from "./manifest.js";
export type { GeneratedRouteConfigInput } from "./routeConfigSource.js";
export type { GenerateRoutesModuleSourceOptions } from "./moduleSource.js";