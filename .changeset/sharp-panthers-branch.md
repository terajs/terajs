---
"@terajs/sfc": patch
"@terajs/vite-plugin": patch
---

Require the directive-preserving compiler when SFC templates are compiled so component `v-if` branches remain mutually exclusive and late-populated component `v-for` lists retain their loop scope in production builds.
