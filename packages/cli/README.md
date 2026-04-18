# @terajs/cli

Command-line tooling for scaffolding and running Terajs projects.

This is the direct public CLI entry for Terajs scaffolding and project maintenance.

## Quickstart

```bash
npx @terajs/cli init my-app
```

If you prefer npm's create flow, the same scaffold is also available through:

```bash
npm create terajs@latest my-app
```

## Commands

- `tera init <name>`: scaffold a new Terajs project
- `tera init <name> --hub <signalr|socket.io|websockets> [--hub-url <url>]`: scaffold a project preconfigured for realtime hub transport
- `tera doctor`: inspect a Terajs project and report missing or broken setup
- `tera dev --port <number>`: start Vite dev server with Terajs plugin
- `tera build`: build production output with Terajs plugin

## Typical Flow

```bash
npx @terajs/cli init my-app
cd my-app
npm install
npm run dev
```

Scaffolded projects target the app-facing launch surface:

- `@terajs/app`
- `@terajs/app/vite`
- `terajs.config.cjs`
- `.tera` route/page structure under `src/pages`

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Realtime scaffolds can preconfigure `sync.hub` for SignalR, Socket.IO, or raw WebSockets.
- `create-terajs` is a thin wrapper around this CLI for npm's `create` flow.
