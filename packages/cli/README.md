# @terajs/cli

Command-line tooling for scaffolding and running Terajs projects.

Status: internal package (`private: true`) used for Terajs development and external smoke validation.

## Commands

- `tera init <name>`: scaffold a new Terajs project
- `tera init <name> --hub <signalr|socket.io|websockets> [--hub-url <url>]`: scaffold a project preconfigured for realtime hub transport
- `tera dev --port <number>`: start Vite dev server with Terajs plugin
- `tera build`: build production output with Terajs plugin

## Typical Flow

```bash
tera init my-app
cd my-app
npm install
npm run dev
```

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Publish behavior is intentionally disabled while CLI surface remains internal.
