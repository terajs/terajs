---
"@terajs/compiler": patch
"@terajs/router": patch
"@terajs/renderer": patch
"@terajs/renderer-web": patch
"@terajs/vite-plugin": patch
"@terajs/app": patch
---

Support `prevent` and `stop` event modifiers in `.tera` templates by compiling them separately from the base event name and applying the modifier behavior in the web renderer. Unsupported event modifiers now fail compilation with a clear error instead of silently binding an invalid event name.

Add first-class SPA link ergonomics for `.tera` apps. The Vite app shell now supports configurable same-origin link interception, and SFC templates can use the built-in `Link` component without a manual import. The router also exposes `push()` as an alias for `navigate()`.

Prevent protected deep links from eagerly loading route modules before middleware redirects by removing the generated app shell's initial route prefetch. SFC auto-imports are now injected only for component tags used by the current template instead of importing the full auto-import barrel in every `.tera` module.
