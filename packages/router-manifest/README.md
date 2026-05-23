# @terajs/router-manifest

Route-manifest builders for Terajs.

Most applications reach this layer through `@terajs/app`, `@terajs/app/vite`, or `@terajs/vite-plugin`. Use `@terajs/router-manifest` directly when you are assembling routes in custom tooling, tests, or alternative build flows.

## Install

```bash
npm install @terajs/router-manifest
```

## What it exports

- `inferPathFromFile(filePath)` for converting `.tera` route-file paths into route paths
- `buildRouteFromSFC(parsedSfc)` for turning a parsed SFC into a `RouteDefinition`
- `buildRouteManifest(inputs, options?)` for assembling an ordered route manifest
- `generateRouteConfig(files, manifest?)` for producing route-module source from discovered file paths
- `generateRoutesModuleSource(options)` for producing a richer virtual-routes module with meta, ai, layouts, and emitted asset paths
- `RouteConfigInput`, `RouteManifestOptions`, and `RouteSourceInput` types

## Minimal example

```ts
import { buildRouteManifest } from "@terajs/router-manifest";

const routes = buildRouteManifest([
  {
    filePath: "/src/pages/index.tera",
    source: `<template><h1>Hello</h1></template>`
  }
]);
```

## Notes

- Route-path inference converts `[param].tera` segments into `:param` route parameters.
- `<route>` overrides, `meta`, and `ai` data from parsed SFCs are preserved in the resulting route definitions.
- Route module source generation stays available here so alternative build flows can reuse route discovery without depending on the Vite plugin package.
- This package is the direct route-manifest layer underneath the app-facing facade helpers.