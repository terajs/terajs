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
At this stage the command builds the `web` target and reports `android` and `ios` as pending until their target builders land.

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Realtime scaffolds can preconfigure `sync.hub` for SignalR, Socket.IO, or raw WebSockets.
- `create-terajs` is the public one-command entrypoint for app creation.
- The default scaffold is intentionally web-first; universal mode is the explicit opt-in path for shared-source multi-target workspaces.
