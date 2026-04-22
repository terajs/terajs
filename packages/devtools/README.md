# @terajs/devtools

Leaf-package entrypoint for the Terajs DevTools overlay, structured bridge session APIs, and VS Code live-attach helpers.

Most applications can import the same surface through `@terajs/app/devtools`. Use `@terajs/devtools` directly when you are composing tooling or working at the leaf-package level.

## What it provides

- overlay mounting for in-browser diagnostics
- component inspection and drill-down
- router, queue, issues, logs, performance, and AI diagnostics panels
- structured bridge session APIs for custom tooling
- development-only VS Code auto-attach helpers

## Mount the overlay

```ts
import {
  autoAttachVsCodeDevtoolsBridge,
  mountDevtoolsOverlay
} from "@terajs/devtools";

mountDevtoolsOverlay();
autoAttachVsCodeDevtoolsBridge();
```

`mountDevtoolsOverlay(...)` is a development-only no-op in production builds.
`autoAttachVsCodeDevtoolsBridge()` enables receiver discovery. The stock overlay then exposes `Connect VS Code Bridge`, `Retry VS Code Bridge`, and `Disconnect Bridge` in AI Diagnostics, while custom shells can call the explicit bridge lifecycle helpers directly.

## Common overlay behavior

The overlay supports layout and shell options such as:

- `startOpen`
- `position`
- `panelSize`
- `persistPreferences`
- `panelShortcut`
- `visibilityShortcut`

By default, the overlay mounts with Tera Lens visible and the panel minimized, `Alt+Shift+D` toggles the panel, and `Alt+Shift+H` hides or restores the full shell.

Repeated calls reuse the existing overlay instead of creating duplicates.

## VS Code live bridge

The bridge flow is structured and same-origin. It does not depend on scraping arbitrary DOM.

- `autoAttachVsCodeDevtoolsBridge(...)` polls the development manifest route and reports when the companion VS Code receiver becomes available.
- `connectVsCodeDevtoolsBridge()`, `retryVsCodeDevtoolsBridgeConnection()`, and `disconnectVsCodeDevtoolsBridge()` control the explicit live-session pairing lifecycle.
- `getDevtoolsIdeBridgeStatus()` and `DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT` expose the local bridge controller state for custom shells.
- `stopAutoAttachVsCodeDevtoolsBridge()` stops that polling behavior.
- bridge session helpers such as `readDevtoolsBridgeSession(...)`, `subscribeToDevtoolsBridge(...)`, and `waitForDevtoolsBridge(...)` are exported for custom integrations.

The default overlay uses the same exported lifecycle. Once the page is connected, the companion VS Code extension can inspect the live snapshot directly through the attached-site chat workflow without requiring a mirrored panel-first round trip.

## Advanced usage

If you want to embed the DevTools UI in a custom shell instead of the floating overlay, this package also exports `mountDevtoolsApp` and the bridge session types/events used by the overlay.

## Notes

- App-facing docs should generally reference `@terajs/app/devtools`.
- The overlay is part of the shipped Terajs experience, not a separate styling demo.
- Production app builds do not expose the development bridge manifest route or emit the overlay bootstrap wiring.

