# @terajs/compiler

Leaf-package compiler utilities for Terajs templates and scoped style rewriting.

Most apps consume this functionality through `@terajs/app/vite` or `@terajs/vite-plugin`. Use `@terajs/compiler` directly when building tooling around template parsing, IR generation, or CSS rewriting.

## What this package exports

- template tokenizer helpers
- `parseTemplateToAst()`
- IR generator and IR types
- `rewriteScopedCss()`
- `compileStyle()`
- compiler-side SFC types

## Minimal example

```ts
import { compileStyle, parseTemplateToAst } from "@terajs/compiler";

const ast = parseTemplateToAst("<div>{{ count }}</div>");
const css = compileStyle(".card { color: red; }");
```

## Package boundaries

- `.tera` file parsing lives in `@terajs/sfc`
- route-aware module generation lives in `@terajs/vite-plugin`
- runtime rendering lives in `@terajs/renderer-web` and `@terajs/renderer-ssr`

That split is intentional: the compiler stays focused on template and style transformation rather than on app bootstrapping.

