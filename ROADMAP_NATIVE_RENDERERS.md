# Terajs Native Renderer Roadmap

This document is directional. Native renderer work is not part of the shipped web-first launch surface. Use `README.md` and `API_REFERENCE.md` for current application-facing behavior.

This document outlines the plan for building production-ready native renderers for Terajs (iOS, Android, and beyond).

## Current Checkpoint
- Browser performance protection is a hard prerequisite for renderer extraction. `npm run bench:browser:guard` is the required pre/post gate for native-renderer foundation work.
- `@terajs/renderer` now owns a shared host contract for the current renderer surface.
- `@terajs/renderer-web` has been proven through that shared host contract with focused renderer tests and the browser regression guard.
- DOM hot paths such as `renderFromIR.ts` prop and slot handling stay locally optimized in `@terajs/renderer-web`; share semantics through conformance tests instead of generic runtime helpers when the browser guard shows a targeted-update regression.
- The current iOS and Android stubs now align to the shared host contract and point at UIKit and Android Views as the next imperative host targets.
- SwiftUI, Jetpack Compose, and JSX-runtime neutralization are explicitly deferred until after the imperative host simulation milestone.

---

## 1. Shared Host Contract
- Keep the shared host contract minimal and driven by the already-shipped web renderer seam.
- Current contract focus: `createElement`, `createText`, `createFragment`, `insert`, `remove`, `setText`, `setProp`, `setStyle`, `setClass`, event hooks, and cleanup registration.
- Do not widen the shared contract with router, head/meta, or platform-shell concerns until the first native host simulation proves the narrower surface is insufficient.

## 2. JS-to-Native Bridge
- Use a thin JS-to-native bridge to run Terajs’s JS runtime in the host app and exchange renderer commands and events.
- Expose native APIs to JS for view management and event handling.
- Serialize renderer operations and view commands from JS to native, and events from native to JS.
- Final engine selection remains open; do not block host-simulation work on a JavaScriptCore-only assumption.

## 3. Native Host App
- UIKit host app for iOS, Android Views host app for Android.
- Boots JavaScriptCore, loads Terajs JS bundle, and provides a host for the renderer.
- Receives commands from JS to create/update/destroy views.
- Treat SwiftUI and Jetpack Compose as optional outer shells to evaluate later, not as the first renderer targets.

## 4. Renderer Implementation
- Walk Terajs compiler-driven output in JS and send minimal renderer operations to native.
- First native milestone stays SFC/compiler-driven only while the shared host contract is hardened.
- Map Terajs elements to imperative native primitives first (views, text, buttons, inputs, image, stacked layout, conditionals, lists).
- Handle props, events, and state sync.

## 5. Testing & Examples
- Keep `npm run bench:browser:guard` green before and after renderer-boundary changes.
- Add JS-side host simulation tests and renderer conformance tests before real host-app scaffolding.
- Keep a narrower DOM prop/update perf canary alongside the broader browser guard so web hot-path regressions fail closer to the changed seam.
- Build a minimal demo app for each platform after the host simulation proves the contract.

## 6. Documentation
- Document the architecture, APIs, and usage for contributors and users.

---

## Example File Structure

- `renderer-ios/`
  - `src/index.ts` (JS adapter)
  - `ios/` (UIKit host app)
- `renderer-android/`
  - `src/index.ts` (JS adapter)
  - `android/` (Android Views host app)

---

## Next Steps
- Keep the browser guard and focused renderer tests green while further neutral-renderer extraction continues.
- Build a JS-side native host simulation for the shared contract and add conformance tests for the minimal imperative primitive set.
- Decide the concrete bridge and engine shape only after the host simulation exposes the required command and lifecycle surface.
- Start real host-app scaffolding after the shared contract and host simulation are stable.

---

This roadmap is a living document—update as you make progress!
