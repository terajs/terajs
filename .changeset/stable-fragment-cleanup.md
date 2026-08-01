---
"@terajs/renderer-web": patch
---

Keep component cleanup attached to a stable fragment boundary so replacing an
internal conditional child does not dispose the parent component's reactive
state.
