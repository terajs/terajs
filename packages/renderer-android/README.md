# @terajs/renderer-android

Experimental stub package. Android renderer work is directional and not part of the shipped web-first launch surface.

This package represents the Android-side exploration for rendering Terajs components into Android Views-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model
- current JS seam includes a minimal imperative host adapter and a thin command-oriented bridge host with focused conformance tests

## Direction

- map Terajs renderer operations to Android Views primitives first
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer that preserves Terajs-native contracts
- evaluate Jetpack Compose only after the imperative host bridge is proven sufficient

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
