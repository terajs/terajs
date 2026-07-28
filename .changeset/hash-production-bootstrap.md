---
"@terajs/vite-plugin": patch
---

Content-hash the production bootstrap chunk and inject Rollup's emitted filename so cached route chunks cannot load an incompatible bootstrap from another build.
