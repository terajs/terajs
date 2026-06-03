# Terajs Universal Deployment Plan

This plan turns the current native-renderer foundation into a deployable shared-source workflow for web, Android, and iOS.

Use this alongside `ROADMAP_NATIVE_RENDERERS.md`. The roadmap records renderer architecture; this file records product readiness for people who want to write once, build deliberately, and ship everywhere.

## North Star

A universal Terajs workspace should feel as direct as the DOM experience:

- write shared `.tera` pages and components once
- keep renderer-specific behavior explicit and narrow
- build web, Android, and iOS artifacts from one workspace
- materialize target shells without hidden DOM assumptions
- inspect readiness before attempting deployment
- keep web hot-path performance protected by the existing focused tests and browser guard

## Guardrails

- Web remains first-class and fast. `npm run test:renderer-web:focused` and `npm run bench:browser:guard` stay required around renderer-boundary work.
- Native targets use imperative UIKit Views and Android Views first.
- JS owns reactivity, control flow, keyed reconciliation, component composition, scheduling, and binding resolution.
- Native owns concrete view allocation, mutation application, layout participation, and event delivery.
- The bridge stays command-oriented. No component instances, virtual trees, hooks, or framework compatibility payloads cross the bridge.
- iOS source work can progress on non-macOS hosts, but native compile/runtime validation remains blocked until macOS/Xcode is available.

## Milestone 1: Universal Readiness Doctor

Goal: make readiness visible from one command.

Status: implemented. `tera doctor --universal` now aggregates project setup, universal workspace shape, selected target checks, native generated artifacts, host metadata, shell scaffolds, Android toolchain blockers, and non-macOS iOS host warnings.

Scope:

- Add a universal doctor mode that aggregates project setup plus selected target readiness.
- Verify universal mode, shared source root, selected targets, generated native artifacts, host metadata, and shell scaffolds.
- Report Android toolchain blockers clearly.
- Report iOS macOS/Xcode validation as a warning on non-macOS hosts, not as proof.
- Keep per-target shell doctor behavior available for focused debugging.

Validation:

- CLI doctor tests cover universal success and missing readiness.
- Proof workspace tests keep Android and iOS shell readiness transitions covered.
- Proof workspace tests cover the universal readiness transition from missing native artifacts, to built generated artifacts, to shell-ready workspace state.
- Source artifacts stay out of package `src/` through `guard:source-artifacts`.

## Milestone 2: Deployable Target Shells

Goal: shells are not placeholders; they are runnable target projects.

Android:

- Keep Gradle shell materialization reliable.
- Keep generated assets synced into app assets at build time.
- Keep Rhino runtime proof and command replay validated.
- Add a release-oriented doctor path for signing/configuration readiness after debug shell remains stable.
- Current checkpoint: `tera shell doctor android --release` verifies release build hooks, package id, version metadata, local signing inputs, and generated asset sync without committing credentials.

iOS:

- Keep Swift package shell materialization reliable on non-macOS hosts.
- Add source-level tests for generated asset and host metadata shape where macOS is unavailable.
- Current checkpoint: `tera shell doctor ios --release` verifies app-wrapper metadata, Swift package shape, required UIKit host sources, generated asset contract, and reports macOS/Xcode validation as a warning on non-macOS hosts.
- When macOS/Xcode is available, add Swift test target coverage for command applier, transport, event binding, diagnostics, and generated runtime host contracts.
- Add macOS CI once the Swift test target exists.

## Milestone 3: Cross-Target Conformance

Goal: shared source behaves the same where platform capabilities overlap.

Status: started. The proof workspace now has a native conformance matrix that builds Android and iOS from the same shared source, compares generated manifests, routes, runtime descriptors, and generated module files, and runs both emitted live runtime bundles through equivalent host-loop interactions.

Scope:

- Promote proof workspace behaviors into a stable conformance matrix.
- Cover text, props, styles, classes, events, conditionals, slots, keyed lists, generated route runtime, bridge diagnostics, and native event ingress.
- Keep DOM-specific optimizations local to `renderer-web`.
- Compare bridge payload shapes across TypeScript, Kotlin, and Swift fixtures.

## Milestone 4: Developer Experience

Goal: universal workspaces feel polished, not experimental.

Scope:

- Improve scaffold copy and target shell READMEs around real workflows.
- Add command output that tells users what to run next for each target.
- Add failure messages that distinguish missing artifacts, missing shell, missing toolchain, and platform-blocked validation.
- Add examples that show target-specific primitives without leaking platform assumptions into shared source.

## Milestone 5: Deployment Readiness

Goal: users can prepare real deployables from a universal workspace.

Use `NATIVE_RC_READINESS.md` as the concrete RC checklist for local gates, Android real-build validation, and macOS/Xcode validation.

Web:

- Production Vite bundle with manifest and app-facing package surface.

Android:

- Debug build remains validated.
- Release build readiness checks cover package id, signing inputs, min/target SDK, generated asset sync, and runtime entry presence.

iOS:

- Swift package validation on macOS.
- Xcode project or package-to-app workflow documented and checked.
- Release readiness checks cover bundle id, generated asset contract, runtime entry presence, host package source shape, and platform validation status.

## Jira Expansion Candidates

- `S-UNIV-READINESS`: Add universal deployment readiness doctor.
- `T-UNIV-READINESS-CLI`: Add `tera doctor --universal`.
- `T-UNIV-READINESS-PROOF`: Cover proof workspace readiness transitions.
- `S-SHELL-DEPLOYABLE`: Harden generated Android and iOS shells from scaffold to deployable app projects.
- `T-SHELL-ANDROID-RELEASE-DOCTOR`: Add Android signing and release readiness checks.
- `T-SHELL-IOS-SOURCE-READINESS`: Add iOS source-level readiness checks for non-macOS hosts.
- `T-SHELL-IOS-MACOS-VALIDATION`: Add Swift/Xcode validation once macOS is available.
- `S-CONFORMANCE-MATRIX`: Promote proof behaviors into a cross-target conformance matrix.
