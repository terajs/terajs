# @terajs/sfc

Parser and compiler helpers for `.tera` single-file components.

Most applications consume this package through `@terajs/app/vite` or `@terajs/vite-plugin`. Use `@terajs/sfc` directly when building custom tooling, transforms, or tests around `.tera` files.

## The `.tera` block model

Terajs SFCs can combine these structured blocks in one file:

```text
<template>
<script>
<style>
<meta>
<ai>
<route>
```

Those blocks are all part of the shipped surface. `meta`, `ai`, and `route` are not placeholder concepts.

## What this package exports

- `parseSFC()` for turning source text into a parsed descriptor
- `compileTemplate()` for template compilation work
- `compileScript()` for script transformation work
- SFC types and structured error helpers

## Minimal parse example

```ts
import { parseSFC } from "@terajs/sfc";

const source = `
<template>
  <h1>{{ title() }}</h1>
</template>

<script>
  import { signal } from "@terajs/app";
  const title = signal("Hello");
</script>
`;

const parsed = parseSFC(source, "/src/pages/index.tera");
```

## Usage guidance

- Use `.tera` files for route-facing authoring and cohesive page/layout composition.
- Keep advanced transforms in tooling layers such as the Vite plugin or custom build tooling.
- Use the package directly when you need parser/compiler behavior without the full application plugin.

## Related packages

- `@terajs/vite-plugin`: turns parsed SFCs into route-aware application modules
- `@terajs/compiler`: lower-level template compiler pipeline
- `@terajs/devtools`: consumes SFC-derived route, metadata, and component context at runtime
