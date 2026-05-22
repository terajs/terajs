# Terajs Native Renderer Stubs & Plan

This directory contains experimental scaffolds for native renderers:

- `renderer-ios/` — iOS (UIKit Views first)
- `renderer-android/` — Android (Android Views first)

## What’s included
- JS-side platform adapter interfaces and stubs
- JS-side command-oriented bridge host proof for UIKit-style operations and event delivery
- JS-side host-consumer proof that replays bridge commands into a UIKit-shaped native tree
- package-local UIKit host session and compiler-driven IR mounting entry point
- package-local primitive mapping from Terajs tags to UIKit view types
- package-local prop and event normalization from Terajs-style names to UIKit-facing bridge payloads
- package-local style normalization from Terajs-style layout props to UIKit-facing bridge payloads
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
