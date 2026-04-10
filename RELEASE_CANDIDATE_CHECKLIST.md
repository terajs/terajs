# Terajs Release Candidate Checklist

This checklist tracks web-first RC readiness for the current release cycle.

## 1. Quality Gates

- [x] Full test suite passes (`npx vitest run --maxWorkers=1`)
- [x] Sanity critical gate passes (`npm run test:sanity`)
- [x] Docs example gate passes (`npm run test:docs`)
- [x] Architecture guardrails pass (`npm run test:architecture`)
- [ ] Typecheck passes (`npm run typecheck`)

## 2. Hydration and Runtime Stability

- [x] In-place hydration reconciliation implemented
- [x] Hydration mismatch fallback verified
- [x] Mounted hooks execute during hydration
- [x] Stress leak regressions added for mount/unmount churn and route churn

## 3. Docs Parity

- [x] README roadmap reflects shipped web features
- [x] API reference router loading signatures aligned with source
- [x] Devtools/Sanity behavior documented in README/API surface
- [ ] Remaining core docs (`VISION.md`, `ROADMAP.md`, `COMPONENTS.md`) contradiction pass

## 4. CI and Workflow

- [x] Sanity gate integrated in `.github/workflows/quality-gate.yml`
- [x] Docs validation integrated in `.github/workflows/quality-gate.yml`
- [ ] Optional: add `typecheck` to quality gate before RC tag

## 5. Release Packaging

- [ ] Finalize version bump strategy and changelog entries
- [ ] Confirm package exports and public API freeze for RC
- [ ] Tag RC branch and publish dry-run
