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
- [ ] Finalize version bump strategy and changelog entries
- [ ] Confirm package exports and public API freeze for RC
- [ ] Tag RC branch and publish dry-run
