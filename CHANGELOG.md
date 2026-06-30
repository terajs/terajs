# Changelog

## Unreleased

## 1.2.2

- Fixed `.tera` event modifiers so `.prevent` and `.stop` bind the base event name and apply modifier behavior instead of silently registering invalid event names.
- Added Tera-native SPA navigation ergonomics with built-in `<Link>` support in SFC templates, global same-origin link interception, and a `router.push()` alias for `router.navigate()`.
- Prevented protected deep links from loading route modules before middleware redirects by removing the generated app shell's initial route prefetch.
- Reduced Vite dev module weight by making SFC auto-imports usage-based and suppressing fallback inline sourcemaps for generated `.tera` and virtual modules.

## 1.2.1

- Wired `.tera` style blocks through the Vite web build so regular and scoped styles are registered at runtime, with HMR cleanup for updated modules.
- Fixed scoped CSS rewriting inside nested group at-rules such as `@media` so selectors are scoped without corrupting the at-rule itself.
- Preserved normal host elements that use `v-if`, `v-else-if`, or `v-else` so wrapper classes, scoped style attributes, and layout containers render correctly.

## 1.2.0

- Backfilled the public docs story around `@terajs/app`: the reactivity guide now covers `ref`, `reactive`, and `shallowRef` alongside `signal`, `state`, and `computed`, and the API reference now documents `withErrorBoundary()` plus the `web.*` router context helpers accurately.
- Hardened the docs-site code-highlighting path by switching the public site from Prism globals to Refractor-backed HTML rendering, removing the production `Prism is not defined` failure path from deployed docs pages.
- Tightened docs, examples, and API-reference route metadata so live search and AI summaries describe the current shipped surface instead of older single-transport or signal-only wording.
- Added canonical route metadata support across `@terajs/shared` and `@terajs/renderer-web` so apps can declare explicit or automatic canonical URLs through route head metadata.
- Add debugging support for composables
- Expanded the unreleased DevTools slice across `@terajs/devtools`, `@terajs/vite-plugin`, `@terajs/app`, `@terajs/shared`, `@terajs/reactivity`, and `@terajs/sfc` with richer workbench panels, stronger component/value drilldown, improved instrumentation metadata, and unified overlay theming plus explicit AI bridge controls.

## 1.1.4

- Reduced production overhead across core reactive and renderer hot paths by gating debug instrumentation out of production runtime work.
- Added compiler-emitted simple-path binding hints plus renderer fast paths for common text and prop bindings.
- Improved IR keyed `for` reuse for stable single-root rows so repeated list churn preserves more DOM and setup work.
- Added reproducible framework and route-startup benchmark harnesses used to validate the current performance release story.

## 1.0.5

- Fixed DevTools connected-mode regressions that could remount active tabs, stack iframe listeners, and leave stale component hover highlights behind while live events were streaming.
- Fixed the VS Code live bridge auto-attach path so stale manifest metadata no longer reattaches the same dead `/live/...` endpoint in a request loop after the receiver goes away.
- Hardened DevTools component discovery so DOM markers and lifecycle registry data are merged instead of dropping page/layout nodes when only part of the tree reports lifecycle events.

## 1.0.0

- Public Terajs release surface aligned to `1.0.0` across the publishable packages.
- App-facing facade stabilized around `@terajs/app`, `@terajs/app/vite`, and `@terajs/app/devtools`.
- DevTools development bridge shipped with the same-origin `/_terajs/devtools/bridge` manifest route, sanitized session export, live session reveal, and VS Code AI bridge hooks.
- Realtime transport coverage includes SignalR, Socket.IO, and raw WebSockets adapters.
- Local-first queue contracts ship with retry hooks, durable queue storage, and `MutationConflictResolver` strategies for `replace`, `ignore`, and `merge` decisions.
