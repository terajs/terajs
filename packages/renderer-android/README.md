# @terajs/renderer-android

Experimental stub package. Android renderer work is directional and not part of the shipped web-first launch surface.

This package represents the Android-side exploration for rendering Terajs components into Jetpack Compose-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model

## Direction

- map Terajs renderer operations to Compose-friendly native primitives
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer that preserves Terajs-native contracts

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
