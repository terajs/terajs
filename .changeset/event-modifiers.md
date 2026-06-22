---
"@terajs/compiler": patch
"@terajs/renderer": patch
"@terajs/renderer-web": patch
---

Support `prevent` and `stop` event modifiers in `.tera` templates by compiling them separately from the base event name and applying the modifier behavior in the web renderer. Unsupported event modifiers now fail compilation with a clear error instead of silently binding an invalid event name.
