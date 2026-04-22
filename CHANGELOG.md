# Changelog

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
