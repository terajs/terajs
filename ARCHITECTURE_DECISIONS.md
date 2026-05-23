# Terajs Architecture Decisions

This document records validated architecture decisions for the universal workspace model and the target-specific debugging model.

It is not a speculative roadmap. Use it to capture what the proof work established, what is now locked in, and which constraints remain real.

For shipped application-facing APIs, use `README.md` and `API_REFERENCE.md`.
For long-range direction, use `VISION.md` and `ROADMAP*.md`.

## AD-001: Universal Workspaces Stay Explicit And Shared-Source

Status: Accepted

Date: 2026-05-23

### Context

Terajs needed a real multi-target proof path without weakening the shipped web-first launch surface.

The proof work established these constraints:

- the default scaffold must stay web-first around `@terajs/app`
- shared `.tera` source must be owned from one workspace when web, Android, and iOS outputs are built together
- generated native output must stay outside the authored source tree by default
- web output must keep the current fast preview path instead of being forced through native-oriented build structure

### Decision

Universal workspace mode remains an explicit opt-in CLI path.

- `tera init --mode universal` is the only path that creates a shared-source multi-target workspace
- the default scaffold remains web-first
- universal workspaces own shared route and component source under `src/shared/pages` and `src/shared/components`
- target selection is authoritative in `workspace.targets.selected` inside `terajs.config.*`
- `tera build` reads that target contract and can narrow it with `--target`
- web output continues to emit the production Vite bundle
- Android and iOS builds emit compiled module artifacts and route manifests into `.terajs/generated/<target>` and thin host metadata into `.terajs/hosts/<target>`

### Why This Is Locked

- It preserves the shipped web-first product surface instead of pretending every project is multi-target by default.
- It gives universal workspaces one clear ownership model for shared source.
- It keeps generated native artifacts out of authored source unless a team deliberately adopts them.
- It matches the proof workspace validations that now build web, Android, and iOS from one shared source tree.

### Validation Evidence

- CLI scaffold and build work shipped through the universal workspace backlog.
- Proof workspace builds are covered for web, Android, and iOS.
- Proof route and interaction regressions now run from the shared fixture instead of a tracked root proof app.

### Consequences

- Teams that only want the shipped app surface should stay on the default web-first scaffold.
- Teams that need shared-source multi-target builds must opt into universal mode intentionally.
- Future native work should continue to consume the universal workspace contract instead of introducing a second shared-source layout.

## AD-002: Target-Specific Debugging Uses A Narrow Shared Event Subset Plus Package-Local Native Diagnostics

Status: Accepted with active platform constraint

Date: 2026-05-23

### Context

Terajs needs first-party diagnostics that stay legible across web and native targets without widening neutral contracts or forcing native tooling to depend on the browser DevTools model.

The proof work established these constraints:

- structured events matter more than DOM scraping
- cross-target compatibility should be defined as a small payload-based subset, not the entire debug taxonomy
- native bridge and runtime diagnostics should stay package-local to the platform adapters
- proof validation should exercise route, state, queue, and bridge diagnostics through real seams

### Decision

Terajs now treats target-specific debugging as two cooperating layers.

#### Layer 1: Shared cross-target debug subset

- the canonical shared subset is defined in `@terajs/shared`
- the shared subset is payload-based so live listeners and replay hydration normalize to the same shape
- the current subset covers:
  - state: `reactive:updated`
  - routes: `route:navigate:start`, `route:load:start`, `route:load:end`, `route:changed`, `route:blocked`, `route:redirect`, `route:warn`, `route:meta:resolved`, `error:router`
  - queue: `queue:enqueue`, `queue:conflict`, `queue:retry`, `queue:fail`, `queue:flush`, `queue:drained`
  - bridge: `bridge:commands`, `bridge:event`, `bridge:error`
- conformance coverage is required at real producer seams rather than synthetic type-only tests

#### Layer 2: Package-local native diagnostics

- Android and iOS native hosts surface their own diagnostics through package-local adapters instead of pushing native console/log concerns into shared contracts
- Android now records bridge and runtime diagnostics through a package-local sink with a Logcat-facing default implementation
- native renderer JS adapters emit bridge diagnostics through the shared subset where relevant
- proof checks now cover route, state, and bridge diagnostics through the proof workspace surfaces

### Why This Is Locked

- It keeps `@terajs/shared` narrow and transportable.
- It gives DevTools and replay consumers one canonical shared event shape.
- It avoids coupling native host diagnostics to browser-only tooling decisions.
- It matches the project vision that diagnostics should make runtime behavior legible without dissolving package boundaries.

### Validation Evidence

- shared schema and conformance coverage now live in `packages/shared/src/debug/`
- proof diagnostics checks now cover shared route, state, and Android bridge diagnostics
- Android native diagnostics hooks are validated through the package-local Kotlin test harness

### Active Constraint

iOS native diagnostics are not declared validated yet.

- the Swift/UIKit source surface exists and remains the intended package-local seam
- this workspace is currently being advanced from Windows
- honest runtime validation for Xcode console output and UIKit-native diagnostics still requires Apple tooling on macOS
- until that environment exists, iOS native diagnostics remain blocked rather than treated as complete by documentation alone

### Consequences

- New cross-target diagnostics should join the shared subset only when more than one target needs the event and the payload can stay narrow.
- Native-only logging, bridge summaries, and host-runtime details should stay inside the native adapter packages.
- Proof and conformance tests should continue to validate real producers instead of broadening the shared schema spec into a fake compatibility list.
- iOS native diagnostics work should resume from the existing Swift host seam once Apple tooling is available.

## Current Outcome

The validated architecture after the proof work is:

- shipped default surface: web-first
- explicit shared-source multi-target path: universal workspace mode
- cross-target diagnostics contract: narrow shared payload subset in `@terajs/shared`
- native diagnostics model: package-local adapters, with Android validated and iOS still blocked on Apple tooling

That split preserves the launch surface, keeps the core modular, and records the current truth without pretending blocked platform work is already finished.