# Terajs Compiler

The Terajs compiler transforms SFC templates into efficient, platform-agnostic render functions.

---

## Features
- Tokenizes, parses, and compiles SFC templates
- Generates optimized code for signals, effects, and DOM updates
- Supports custom directives and advanced template syntax

---

## Usage Example

```ts
import { parseTemplateToAst, compileStyle } from '@terajs/compiler';

const ast = parseTemplateToAst('<div>{{ count }}</div>');
const code = compileStyle('.foo { color: red; }');
```

---

## API Reference
- `parseTemplateToAst(template: string): AstNode[]`
- `compileStyle(css: string): string`
- `sfcToComponent(sfc: SFCDescriptor): string`

---

See the SFC and devtools docs for more on templates and live inspection.

