# @terajs/renderer-android

Experimental stub package. Android renderer work is directional and not part of the shipped web-first launch surface.

This package represents the Android-side exploration for rendering Terajs components into Android Views-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model
- current JS seam includes a minimal imperative host adapter, a thin command-oriented bridge host with incremental command draining, package-local JSON-safe wire codecs for command batches and native event packets, a package-local wire transport wrapper for host-bridge payload exchange, a package-local host session for compiler-driven IR mounting plus node-id event packets, and focused conformance tests
- package-local native host transport source now exists under `android/src/main/kotlin/dev/terajs/renderer/android/` for decoding command batches and encoding native event packets on the Android Views side
- package-local Android host command applier source now exists under `android/src/main/kotlin/dev/terajs/renderer/android/` for allocating concrete `View` instances, replaying command batches, and syncing text, props, styles, and event subscriptions into a native-owned tree
- package-local Android host runtime source now exists under `android/src/main/kotlin/dev/terajs/renderer/android/` to wire the transport and command applier together and expose the current native root view
- package-local Android event bindings now cover basic press, text-input change, and switch change emission back into the JS-owned event packet loop
- package-local Android text-input bindings now also emit structured selection-change packets through a package-local `TerajsSelectionEditText`
- a minimal Android library Gradle scaffold now exists under `android/` so the host code has a package-local compile target
- a package-local Gradle wrapper and Kotlin unit-test harness now exist under `android/`, with JUnit and Robolectric scoped to that host module
- package-local primitive mapping now resolves standard tags and native-flavored tags into concrete Android View types
- package-local bridge normalization now translates standard props and events such as `aria-label`, input placeholders, structured selection-range and caret props, textarea line-count, viewport, interaction, and text-limit props, secure input traits, keyboard and correction hints, image alt text, and `click` into native-facing Android names
- package-local style normalization now translates a small layout subset like row/column, spacing, alignment, and colors into Android-facing style keys
- package-local native event ingress now normalizes beforeinput replacement previews, direct or item-shaped transfer payloads, delete-style payloads, multiline replacement ranges, text-input change, and text-limit-aware composition start or update previews with selection state, alongside structured text-selection payloads and switch change events, and syncs native state into the host-session proof tree

## Local validation

Run the renderer-android validation slices from the Terajs root:

```powershell
npm run test:renderer-android:ts
npm run test:renderer-android:kotlin
npx vitest run packages/cli/test/proofWorkspace.spec.ts packages/renderer-android/src/proofWorkspaceSmoke.spec.ts
```

The TypeScript slice covers the JS-owned bridge, transport, session, normalization, ingress, and conformance seams under `packages/renderer-android/src/`. The Kotlin runner uses the package-local Gradle wrapper in `packages/renderer-android/android/`, prefers `JAVA_HOME` when it is already set, falls back to the Android Studio bundled JBR on Windows, and expects an Android SDK to be available through `ANDROID_SDK_ROOT`, `ANDROID_HOME`, or the default local SDK install path.
The proof smoke path materializes the shared proof workspace fixture, builds Android artifacts through the CLI, and mounts the generated proof module through the package-local Android host session so proof output stays validated outside the main authored workspace.

## Direction

- map Terajs renderer operations to Android Views primitives first
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer that preserves Terajs-native contracts
- evaluate Jetpack Compose only after the imperative host bridge is proven sufficient

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
