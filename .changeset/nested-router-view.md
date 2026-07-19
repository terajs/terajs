---
"@terajs/router": minor
"@terajs/renderer-web": minor
"@terajs/vite-plugin": minor
"@terajs/app": minor
---

Add nested child route rendering with a built-in `RouterView` outlet. Route matches now expose a parent-to-leaf branch, the web renderer preserves parent route DOM while swapping child outlet panes, `.tera` templates can use `<RouterView />` or `<router-view />` without manual imports, and route debug/devtools surfaces now show branch and resolved route metadata. Structural loop rebuilds retain routed branch context, dispose replaced children before creating replacements, and leave adjacent DOM intact. Route generation failures preserve virtual-module exports, route edits reload atomically, Tera config changes restart Vite, and default route failures no longer expose internal paths or exception details in page content.
