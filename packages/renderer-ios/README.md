# @terajs/renderer-ios

Experimental stub package. iOS renderer work is directional and not part of the shipped web-first launch surface.

This package represents the iOS-side exploration for rendering Terajs components into UIKit-backed native views.

## Current state

- proof-of-concept / planning stage
- not production-ready
- intended to stay aligned with the neutral runtime and renderer contracts rather than introducing a separate framework model
- current JS seam includes a minimal imperative host adapter, a thin command-oriented bridge host with incremental command draining, package-local JSON-safe wire codecs for command batches and native event packets, a package-local wire transport wrapper for host-bridge payload exchange, a package-local host session for compiler-driven IR mounting plus node-id event packets, and focused conformance tests
- package-local native host transport source now exists under `ios/Sources/TerajsRendererHost/` for decoding command batches and encoding native event packets on the UIKit side
- package-local primitive mapping now resolves standard tags and native-flavored tags into concrete UIKit view types
- package-local bridge normalization now translates standard props and events such as `aria-label`, input hints, structured selection-range and caret props, textarea line-count, viewport, interaction, and text-limit props, secure input traits, keyboard and correction hints, image alt text, and `click` into native-facing UIKit names
- package-local style normalization now translates a small layout subset like row/column, spacing, alignment, and colors into UIKit-facing style keys
- package-local native event ingress now normalizes beforeinput replacement previews, direct or item-shaped transfer payloads, delete-style payloads, multiline replacement ranges, text-input change, and text-limit-aware composition start or update previews with selection state, alongside structured text-selection payloads and switch change events, and syncs native state into the host-session proof tree

## Direction

- map Terajs renderer operations to UIKit view primitives first
- reuse Terajs reactivity, runtime, and SFC-authored component model where appropriate
- host the JavaScript runtime through a native bridge layer rather than through a React/Vue compatibility stack
- evaluate SwiftUI only after the imperative host bridge is proven sufficient

## Related docs

- `STUBS_AND_PLAN.md`
- `../../ROADMAP_NATIVE_RENDERERS.md`
