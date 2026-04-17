# Terajs Release Candidate Checklist

This checklist tracks web-first RC readiness for the current release cycle.

## 1. Quality Gates

- [x] Full test suite passes (`npx vitest run --maxWorkers=1`)
- [x] Sanity critical gate passes (`npm run test:sanity`)
- [x] Docs example gate passes (`npm run test:docs`)
- [x] Architecture guardrails pass (`npm run test:architecture`)
- [x] Typecheck passes (`npm run typecheck`)

## 2. Hydration and Runtime Stability

- [x] In-place hydration reconciliation implemented
- [x] Hydration mismatch fallback verified
- [x] Mounted hooks execute during hydration
- [x] Stress leak regressions added for mount/unmount churn and route churn

## 3. Docs Parity

- [x] README roadmap reflects shipped web features
- [x] API reference router loading signatures aligned with source
- [x] Devtools/Sanity behavior documented in README/API surface
- [x] Dev-only VS Code bridge workflow and session export surface documented in README/API surface
- [x] Remaining core docs (`VISION.md`, `ROADMAP.md`, `COMPONENTS.md`) contradiction pass

## 4. CI and Workflow

- [x] Sanity gate integrated in `.github/workflows/quality-gate.yml`
- [x] Docs validation integrated in `.github/workflows/quality-gate.yml`
- [x] Local-first foundation gate integrated in `.github/workflows/quality-gate.yml`
- [x] Optional: add `typecheck` to quality gate before RC tag
- [x] External scaffold smoke run passes (`npm run smoke:external`)
- [x] External scaffold smoke workflow integrated in `.github/workflows/external-smoke.yml`

## 5. Local-First Foundation

- [x] Runtime mutation queue contracts shipped (`createMutationQueue`, retry policy hooks)
- [x] Queue-aware action execution shipped (`runQueued`)
- [x] Queue-aware form path shipped for enhanced submissions
- [x] Devtools performance telemetry includes queue metrics
- [ ] Conflict-resolution strategies and multi-device merge policy (planned)

## 6. Release Packaging

- [x] Automated package exports audit passes (`npm run audit:exports`)
- [x] Publish metadata guard passes (`npm run guard:publish-metadata`)
- [ ] Finalize version bump strategy and changelog entries
- [ ] Confirm package exports and public API freeze for RC
- [ ] Tag RC branch and publish dry-run

## 7. DevTools Release Surface

- [ ] Fresh consumer-app smoke verifies the dev-only `/_terajs/devtools/bridge` manifest and auto-attach lifecycle on a new window
- [ ] Companion VS Code tooling smoke verifies `Ask VS Code AI`, `Copy Debugging Prompt`, and live session reveal against the current bridge manifest
- [ ] Structured session export reviewed for sanitized document context, code references, and bounded event payloads
- [ ] Production build verification confirms the VS Code bridge bootstrap and manifest route are absent outside development mode

## 8. Maintainability Holdouts (500+ lines)

These are the current large-file refactor candidates frozen at their present baseline by `packages/shared/src/architectureGuardrails.spec.ts` so post-RC work stays aligned with the modularity guardrails:

- `packages/devtools/src/overlay.ts` (`2090` lines): split public entry wiring from bridge lifecycle and mount orchestration.
- `packages/devtools/src/panels/diagnosticsPanels.ts` (`1202` lines): split AI Diagnostics rendering into section-specific modules plus provider-status helpers.
- `packages/devtools/src/overlayStyles.ts` (`2338` lines): split shared tokens/layout rules from panel-specific styling so DevTools surfaces can evolve without one monolithic stylesheet.
- `packages/devtools/src/overlay.spec.ts` (`1684` lines): split bridge, layout, components, and AI Diagnostics coverage into feature-scoped suites.
- `packages/vite-plug-in/src/index.ts` (`852` lines): split bootstrap injection, devtools bridge wiring, and hub transport resolution into narrower modules.
- `packages/devtools/src/app.ts` (`846` lines): split overlay app state transitions, event ingestion, and panel routing into feature-local modules.
- `packages/sfc/src/stripTypes.ts` (`619` lines): keep strip rules modular and isolate expression-preservation heuristics from block scanning.
- `packages/devtools/src/inspector/runtimeMonitor.ts` (`540` lines): split summary rendering, history formatting, and filter helpers.
- `packages/devtools/src/overlayInspectorSuite.ts` (`537` lines): split inspector-focused regression coverage from selection and drill-down cases.
- `packages/devtools/src/overlayPanelAndContentStyles.ts` (`533` lines): split panel chrome/layout styling from per-panel state styling.
- `packages/renderer-web/src/renderFromIR.ts` (`530` lines): isolate IR operation rendering helpers from fragment/component orchestration.
- `packages/devtools/src/panels/aiDiagnosticsPanel.ts` (`528` lines): split nav rail, detail rendering, and provider status helpers.
- `packages/devtools/src/overlayInspectorAndRuntimeStyles.ts` (`517` lines): split inspector styling from runtime-monitor styling.
- `packages/renderer-ssr/src/renderToString.ts` (`513` lines): isolate stream/string serialization helpers from route render orchestration.
- `packages/devtools/src/aiHelpers.ts` (`512` lines): split structured AI response formatting from prompt-building helpers.
- `packages/devtools/src/overlayValueAndInteractiveStyles.ts` (`511` lines): split interactive control styling from value-explorer styling.
