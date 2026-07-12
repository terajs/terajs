---
"@terajs/router": minor
"@terajs/renderer-web": minor
"@terajs/vite-plugin": minor
"@terajs/app": minor
---

Add nested child route rendering with a built-in `RouterView` outlet. Route matches now expose a parent-to-leaf branch, the web renderer preserves parent route DOM while swapping child outlet panes, `.tera` templates can use `<RouterView />` or `<router-view />` without manual imports, and route debug/devtools surfaces now show branch and resolved route metadata.
