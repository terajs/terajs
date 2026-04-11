# Terajs Native Renderer Roadmap

This document outlines the plan for building production-ready native renderers for Terajs (iOS, Android, and beyond).

---

## 1. Platform Adapter Interface
- Define a minimal interface for creating, updating, and destroying native views from JS.
- Example: `createElement`, `setProperty`, `appendChild`, `removeChild`.

## 2. JS-to-Native Bridge
- Use JavaScriptCore (iOS/Android) to run Terajs’s JS runtime in the native app.
- Expose native APIs to JS for view management and event handling.
- Serialize tree diffs/commands from JS to native, and events from native to JS.

## 3. Native Host App
- Swift/SwiftUI app for iOS, Kotlin/Jetpack Compose for Android.
- Boots JavaScriptCore, loads Terajs JS bundle, and provides a host for the renderer.
- Receives commands from JS to create/update/destroy views.

## 4. Renderer Implementation
- Walk the Terajs component tree in JS, diff changes, and send minimal updates to native.
- Map Terajs elements to native primitives (VStack/Column, Text, Button, etc.).
- Handle props, events, and state sync.

## 5. Testing & Examples
- Build a minimal demo app for each platform.
- Add tests for the bridge, renderer, and update logic.

## 6. Documentation
- Document the architecture, APIs, and usage for contributors and users.

---

## Example File Structure

- `renderer-ios/`
  - `src/index.ts` (JS adapter)
  - `ios/` (Swift/SwiftUI host app)
- `renderer-android/`
  - `src/index.ts` (JS adapter)
  - `android/` (Kotlin/Jetpack Compose host app)

---

## Next Steps
- Implement the JS adapter and bridge stubs (done)
- Scaffold native host app projects (Swift, Kotlin)
- Build out the bridge and minimal view mapping
- Iterate and expand support for more elements and features

---

This roadmap is a living document—update as you make progress!
