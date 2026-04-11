# Terajs Android Renderer (Experimental)

This package is a proof-of-concept for rendering Terajs components to native Android (Jetpack Compose) views.

## Goals
- Map Terajs’s runtime/component tree to Jetpack Compose primitives
- Reuse Terajs’s reactivity and SFC pipeline
- Enable cross-platform UI from a single codebase

## Usage
- WIP: See `src/index.ts` for the renderer entry point.

---

## Next Steps
- Define a minimal platform adapter interface
- Implement mapping for basic elements (Text, Button, Column, etc.)
- Add a bridge for communication between JS and Kotlin (e.g., via JavaScriptCore, JNI, or custom bridge)
