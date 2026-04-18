# @terajs/renderer-ios

Experimental stub package. iOS renderer work is directional and not part of the shipped web-first launch surface.

This package represents the iOS-side exploration for rendering Terajs components into SwiftUI-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model

## Direction

- map Terajs renderer operations to SwiftUI-friendly native primitives
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer rather than through a React/Vue compatibility stack

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
