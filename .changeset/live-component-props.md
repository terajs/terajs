---
"@terajs/vite-plugin": patch
---

Preserve reactive property descriptors when compiled child components normalize
their props, so mounted components receive late object-prop updates without
requiring conditional remount branches.
