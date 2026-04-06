# Nebula iOS Renderer (Experimental)

This package is a proof-of-concept for rendering Nebula components to native iOS (SwiftUI) views.

## Goals
- Map Nebula’s runtime/component tree to SwiftUI primitives
- Reuse Nebula’s reactivity and SFC pipeline
- Enable cross-platform UI from a single codebase

## Usage
- WIP: See `src/index.ts` for the renderer entry point.

---

## Next Steps
- Define a minimal platform adapter interface
- Implement mapping for basic elements (Text, Button, VStack, etc.)
- Add a bridge for communication between JS and Swift (e.g., via React Native, Capacitor, or custom bridge)
