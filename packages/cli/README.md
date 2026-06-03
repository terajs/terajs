# @terajs/cli

Command-line tooling for scaffolding and running Terajs projects.

This package backs the official Terajs scaffold flow and exposes project maintenance commands.

## Quickstart

```bash
npm create terajs@latest my-app
cd my-app
npm install
npm run dev
```

The default scaffold stays web-first and targets `@terajs/app`.

Use universal mode when one workspace should own shared `.tera` source and explicit target mapping for web, Android, and iOS:

```bash
npm create terajs@latest my-app -- --mode universal
```

## Commands

- `tera init <name> [--mode <web|universal>]`: scaffold a new Terajs project
- `tera init <name> --mode universal`: scaffold a shared-source workspace with `src/shared` plus reserved `.terajs/generated` and `.terajs/hosts` directories for native-target output
- `tera init <name> --hub <signalr|socket.io|websockets> [--hub-url <url>]`: scaffold a project preconfigured for realtime hub transport
- `tera doctor`: inspect a Terajs project and report missing or broken setup
- `tera doctor --universal`: inspect shared-source workspace readiness across configured web, Android, and iOS targets
- `tera dev --port <number>`: start Vite dev server with Terajs plugin
- `tera build [--target <web,android,ios>]`: build configured workspace targets for production
- `tera shell init <android|ios> [--dir <directory>]`: materialize a target shell for the current universal workspace
- `tera shell doctor <android|ios> [--dir <directory>]`: inspect shell prerequisites plus synced generated artifacts for the target shell
- `tera shell doctor android --release`: inspect Android release readiness, including release build hooks, version metadata, signing inputs, and synced generated assets
- `tera shell doctor ios --release`: inspect iOS source-level release readiness, including app-wrapper metadata, Swift package shape, host source files, generated assets, and macOS/Xcode validation status

Scaffolded projects target the app-facing launch surface:

- `@terajs/app`
- `@terajs/app/vite`
- `terajs.config.cjs`
- `.tera` route/page structure under `src/pages`

Universal workspaces keep the default web preview path but move shared route and component source to:

- `src/shared/pages`
- `src/shared/components`
- target selection and reserved native output directories declared in `terajs.config.cjs`

`tera build` now reads the authoritative workspace target contract from `terajs.config.*`.
When no `--target` override is provided, it builds the targets listed in `workspace.targets.selected`.
Pass `--target web` or `--target web,android` to narrow the build to a comma-separated subset.
The `web` target emits the production Vite bundle.
The `android` and `ios` targets emit compiled Terajs module artifacts plus a serializable route manifest into `.terajs/generated/<target>`, write bootstrap command batches and generated-route runtime descriptors into that target output, and write thin host metadata into `.terajs/hosts/<target>` for the native host runtime contract.

`tera shell init android` builds the current Android target artifacts, copies the Android host module scaffold into `android/terajs-host`, creates a runnable `android/app` shell, and syncs `.terajs` host metadata plus generated artifacts into app assets at build time. The generated shell now boots from `.terajs/generated/android/bootstrap/root-command-batch.json` so it can render a real native bootstrap tree through the Android host runtime before the full JS bridge loop is wired. Run `tera shell doctor android` to check that the shell scaffold, generated artifacts, Java toolchain, and Android SDK are all present before trying `gradlew assembleDebug`. Run `tera shell doctor android --release` before `gradlew assembleRelease`; release signing is read from local `TERA_ANDROID_RELEASE_*` Gradle properties or environment variables.

`tera shell init ios` now materializes an `ios/` Swift package shell from the UIKit host template and pairs it with the generated `.terajs/generated/ios` plus `.terajs/hosts/ios` artifacts, including the bootstrap command batch and generated-route runtime descriptor. Run `tera shell doctor ios` to verify the scaffold and synced iOS artifacts. Run `tera shell doctor ios --release` to inspect source-level release readiness and the generated `TerajsAppHost.json` app-wrapper contract. Hosted iOS compilation and simulator or device validation still require macOS with Xcode.

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Realtime scaffolds can preconfigure `sync.hub` for SignalR, Socket.IO, or raw WebSockets.
- `create-terajs` is the public one-command entrypoint for app creation.
- The default scaffold is intentionally web-first; universal mode is the explicit opt-in path for shared-source multi-target workspaces.
