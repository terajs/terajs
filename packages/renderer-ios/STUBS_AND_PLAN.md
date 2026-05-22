# Terajs Native Renderer Stubs & Plan

This directory contains experimental scaffolds for native renderers:

- `renderer-ios/` — iOS (UIKit Views first)
- `renderer-android/` — Android (Android Views first)

## What’s included
- JS-side platform adapter interfaces and stubs
- JS-side command-oriented bridge host proof for UIKit-style operations, incremental command draining, JSON-safe wire packets, thin host-bridge payload exchange, and event delivery
- package-local Swift transport scaffold for decoding command batches and encoding node-id native event packets on the UIKit side
- package-local Swift host command applier scaffold for allocating concrete UIKit views and replaying thin bridge commands into a native-owned tree
- package-local Swift host runtime scaffold for wiring transport and command application into a current UIKit root view
- JS-side host-consumer proof that replays bridge commands into a UIKit-shaped native tree
- package-local UIKit host session and compiler-driven IR mounting entry point with node-id native event packet dispatch
- package-local primitive mapping from Terajs tags to UIKit view types
- package-local prop and event normalization from Terajs-style names to UIKit-facing bridge payloads, including input hints, structured selection-range and caret props, textarea line-count, viewport, interaction, and text-limit props, secure, keyboard, and correction traits, and image accessibility aliases
- package-local style normalization from Terajs-style layout props to UIKit-facing bridge payloads
- package-local native event ingress for beforeinput replacement previews, direct or item-shaped transfer payloads, delete-style payloads, multiline replacement ranges, text input text, text-limit-aware composition start or update previews with selection state, structured text selection payloads, and switch state so host-session state and JS handlers stay aligned
- focused JS-side conformance tests for the current host adapter seam
- Example renderer entry points
- README and roadmap for future development

## What’s next
- Implement the JS-to-native bridge (JavaScriptCore, JNI, etc.)
- Scaffold native host apps (Swift, Kotlin)
- Map Terajs elements to imperative native primitives before evaluating declarative outer shells
- Add tests, docs, and real-world examples

---

**This is a foundation for future cross-platform Terajs development.**
