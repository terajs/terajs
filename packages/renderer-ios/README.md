# @terajs/renderer-ios

Experimental stub package. iOS renderer work is directional and not part of the shipped web-first launch surface.

This package represents the iOS-side exploration for rendering Terajs components into UIKit-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model
- current JS seam is a minimal imperative host adapter with focused conformance tests

## Direction

- map Terajs renderer operations to UIKit view primitives first
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer rather than through a React/Vue compatibility stack
- evaluate SwiftUI only after the imperative host bridge is proven sufficient

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
