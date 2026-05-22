---
description: "Terajs native renderer contract. Keep native renderer work Terajs-native, thin-bridge, UIKit and Android Views first, and browser-perf-safe."
applyTo: "**"
---

# Terajs Native Renderer Contract

- Terajs source is renderer-neutral input. Do not treat DOM output as the source for iOS or Android.
- Real native renderer targets are UIKit Views first on iOS and Android Views first on Android.
- SwiftUI and Jetpack Compose are optional outer shells later, not first renderer targets.
- Keep JS authoritative for reactivity, control flow, keyed reconciliation, component composition, scheduling, and binding resolution.
- Keep native authoritative only for concrete view allocation, mutation application, layout participation, and event delivery.
- The native bridge must stay thin and command-oriented. It may carry host operations and event payloads only.
- Do not send component instances, virtual trees, hook or lifecycle objects, or framework-compatibility payloads across the native bridge.
- Do not introduce React Native, Vue Native, or other framework bridge patterns into Terajs native renderer work.
- Do not widen the shared host contract with router, head, app-shell, or platform-service concerns until host proof shows the minimal contract is insufficient.
- Keep DOM hot paths locally optimized in `renderer-web`. Do not reintroduce shared host-helper indirection into `renderFromIR.ts` or other hot paths when it risks targeted-update regressions.
- If a change improves reuse but risks browser guard regressions or package-boundary drift, stop and choose the boundary-preserving implementation instead.