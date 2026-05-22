# @terajs/renderer-ios

Experimental stub package. iOS renderer work is directional and not part of the shipped web-first launch surface.

This package represents the iOS-side exploration for rendering Terajs components into UIKit-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model
- current JS seam includes a minimal imperative host adapter, a thin command-oriented bridge host, a package-local host session for compiler-driven IR mounting, and focused conformance tests
- package-local primitive mapping now resolves standard tags and native-flavored tags into concrete UIKit view types
- package-local bridge normalization now translates standard props and events such as `aria-label`, input hints, structured selection-range and caret props, textarea line-count props, secure input traits, keyboard and correction hints, image alt text, and `click` into native-facing UIKit names
- package-local style normalization now translates a small layout subset like row/column, spacing, alignment, and colors into UIKit-facing style keys
- package-local native event ingress now normalizes text-input change, text-selection, and switch change events and syncs native state into the host-session proof tree

## Direction

- map Terajs renderer operations to UIKit view primitives first
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer rather than through a React/Vue compatibility stack
- evaluate SwiftUI only after the imperative host bridge is proven sufficient

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
