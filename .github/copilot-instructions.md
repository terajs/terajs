Keep Terajs architecture modular and Terajs-native.

- Do not introduce React, Vue, or other framework runtime dependencies, APIs, lifecycle models, hook patterns, component instance models, or VDOM-style abstractions into Terajs packages unless explicitly requested.
- Prefer internal Terajs implementations over new third-party dependencies when the required behavior is reasonably buildable in-repo. Avoid adding dependencies for convenience alone.
- Keep dependency surfaces minimal and intentional. New external runtime dependencies should be treated as exceptional, justified by a concrete need, and scoped to the narrowest adapter layer possible.
- Prefer platform standards and built-ins over wrapper libraries when they satisfy the requirement. This reduces breaking-change exposure and keeps behavior aligned with Terajs-specific needs.
- If a concept is inspired by another framework, re-express it in Terajs-native terms aligned with fine-grained reactivity, compiler-driven rendering, and renderer-agnostic core contracts.
- Design patterns for Terajs itself, not for compatibility theater. Prefer the best Terajs-native pattern for the platform and architecture instead of mirroring React/Vue ergonomics by default.
- Convenience must not override package boundaries. Core and neutral packages such as `shared`, `reactivity`, `renderer`, `compiler`, `router`, and `sfc` must not depend on adapter packages such as `renderer-web`, `renderer-ssr`, `vite-plugin`, or other environment-specific integrations.
- DOM, browser, Vite, Node request/response bridging, and similar environment-specific behavior belongs in adapter packages, not in renderer-neutral or compiler-neutral layers.
- When adding a feature, prefer adding a small neutral contract in a core package and implementing it in adapters rather than leaking adapter behavior upward into the core.
- If a change appears faster but introduces architectural drift, stop and choose the boundary-preserving implementation instead.
- Treat established user constraints and project vision as architecture inputs, not optional guidance. Future iteration should preserve those constraints unless the user explicitly changes them.