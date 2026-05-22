# Terajs Native Renderer Stubs & Plan

This directory contains experimental scaffolds for native renderers:

- `renderer-ios/` — iOS (UIKit Views first)
- `renderer-android/` — Android (Android Views first)

## What’s included
- JS-side platform adapter interfaces and stubs
- JS-side command-oriented bridge host proof for Android Views-style operations and event delivery
- JS-side host-consumer proof that replays bridge commands into an Android Views-shaped native tree
- package-local Android host session and compiler-driven IR mounting entry point
- package-local primitive mapping from Terajs tags to Android View types
- package-local prop and event normalization from Terajs-style names to Android-facing bridge payloads, including input placeholder, structured selection-range and caret props, textarea line-count, viewport, and interaction props, secure, keyboard, and correction traits, and image accessibility aliases
- package-local style normalization from Terajs-style layout props to Android-facing bridge payloads
- package-local native event ingress for text input text, structured text selection payloads, and switch state so host-session state and JS handlers stay aligned
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
