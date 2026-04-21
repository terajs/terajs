---
"@terajs/vite-plugin": patch
"@terajs/app": patch
---

Fix VS Code DevTools bridge discovery for apps outside the current workspace by adding a user-local manifest fallback to the Vite bridge route.