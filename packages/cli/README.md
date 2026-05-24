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
- `tera dev --port <number>`: start Vite dev server with Terajs plugin
- `tera build [--target <web,android,ios>]`: build configured workspace targets for production
- `tera shell init <android|ios> [--dir <directory>]`: materialize a target shell for the current universal workspace
- `tera shell doctor <android|ios> [--dir <directory>]`: inspect shell prerequisites plus synced generated artifacts for the target shell

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
The `android` and `ios` targets emit compiled Terajs module artifacts plus a serializable route manifest into `.terajs/generated/<target>` and write thin host metadata into `.terajs/hosts/<target>` for the native host runtime contract.

`tera shell init android` builds the current Android target artifacts, copies the Android host module scaffold into `android/terajs-host`, creates a runnable `android/app` shell, and syncs `.terajs` host metadata plus generated artifacts into app assets at build time. The generated shell now boots from `.terajs/generated/android/bootstrap/root-command-batch.json` so it can render a real native bootstrap tree through the Android host runtime before the full JS bridge loop is wired. Run `tera shell doctor android` to check that the shell scaffold, generated artifacts, Java toolchain, and Android SDK are all present before trying `gradlew assembleDebug`. The shell path is target-neutral so iOS can later adopt the same `tera shell init <target>` flow without changing the universal workspace contract.

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Realtime scaffolds can preconfigure `sync.hub` for SignalR, Socket.IO, or raw WebSockets.
- `create-terajs` is the public one-command entrypoint for app creation.
- The default scaffold is intentionally web-first; universal mode is the explicit opt-in path for shared-source multi-target workspaces.
