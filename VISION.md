
# Terajs Vision

This document covers longer-range product direction. For shipped web-first APIs and launch behavior, use `API_REFERENCE.md` and `README.md`.

Terajs is trying to build a different kind of application framework:

- compiler-native instead of runtime-heavy
- route-first instead of shell-first
- local-first at the runtime layer, not as an afterthought
- framework-agnostic in the core while still interoperating with React and Vue at the edges
- deeply inspectable in development, not opaque until something breaks

## 1. Compiler-native rendering

Terajs should feel direct.

The long-term rendering model is simple:

- fine-grained reactive reads
- compiler output that binds those reads to concrete renderer operations
- no VDOM diff loop as the center of the architecture
- minimal work when state changes

The goal is not novelty for its own sake. The goal is a model where updates stay predictable enough that performance and debugging do not fight each other.

## 2. Route-first application structure

Terajs is not trying to make routes feel like an optional plugin layered on top of an otherwise unstructured shell.

Pages, layouts, metadata, middleware, and route loading should feel like one composed system.

That means the framework direction continues to favor:

- file-based route discovery
- route-local metadata and configuration
- layout composition that follows the route tree
- code-splitting and loading boundaries that follow page boundaries

## 3. Local-first as a runtime concern

Terajs should keep moving toward a world where local-first application behavior is normal framework behavior rather than custom app plumbing.

That includes:

- durable mutation queues
- invalidation that works with route and resource boundaries
- retry policy and offline-safe action paths
- explicit conflict resolution instead of silent last-write-wins behavior
- tooling that can explain queue state and sync failures

The shipped queue contracts are a foundation, not the finish line.

## 4. Framework-agnostic core, adapters at the seams

Terajs should remain Terajs-native in the core.

The core packages should stay neutral, renderer contracts should stay renderer contracts, and environment-specific behavior should stay in adapters. Interop matters, but compatibility theater should not drive the architecture.

That is why React and Vue wrappers belong at integration seams:

- teams can mount Terajs components inside existing React or Vue applications
- resources can bridge into host-framework hooks or composables
- the Terajs core still does not adopt React or Vue as its internal mental model

## 5. Components that carry application meaning

Terajs components are not meant to be only paint functions.

The vision is for components to remain the unit where application meaning gathers:

- template and render behavior
- local state and lifecycle
- metadata and head updates
- route-level intent and loading boundaries
- AI/debugging context that tooling can consume without scraping raw DOM

That is how Terajs can treat components as application structure, not just reusable view fragments.

## 6. Diagnostics as part of the product

Terajs should be unusually inspectable.

The framework direction is not just “have devtools.” It is “make the runtime legible.”

That means continuing to invest in:

- component drill-down
- router phase and timing diagnostics
- queue lifecycle visibility
- structured debug events instead of only console noise
- IDE-connected debugging flows where safe structured session export matters more than DOM scraping

## 7. Escape hatches without architectural drift

Terajs should stay flexible, but flexibility should not mean dissolving boundaries.

Developers should be able to:

- author in `.tera` SFCs or TSX/JSX
- use the facade package or import leaf packages directly
- integrate with existing React or Vue stacks
- build custom renderers and adapters
- drop down to lower-level APIs when necessary

But the cost of those escape hatches should not be a blurred architecture.

## Launch boundary vs direction

The launch story and the long-term vision are related, but they are not identical.

- `README.md` explains what Terajs ships today.
- `API_REFERENCE.md` documents the current public surface.
- this file keeps the project pointed at the framework it is still trying to become.

That split is healthy. A strong launch should not erase the roadmap, and a strong vision should not pretend every planned idea is already shipped.

## Terajs's promise

Terajs is aiming to become a framework where compiler-native rendering, route-first structure, local-first runtime behavior, and first-party diagnostics all feel like one coherent system rather than a pile of separate tools.
