---
"@terajs/compiler": patch
---

Fix scoped CSS rewriting for nested group at-rules so selectors inside `@media` blocks are scoped without appending scope attributes to the at-rule itself.

Preserve the host element for normal elements using `v-if`, `v-else-if`, or `v-else` so classes, scoped style attributes, and layout wrappers remain in the rendered IR.
