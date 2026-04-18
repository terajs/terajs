# create-terajs

Create a new Terajs application with npm's `create` flow.

## Usage

```bash
npm create terajs@latest my-app
```

That command scaffolds the same starter as:

```bash
npx @terajs/cli init my-app
```

Realtime hub presets pass through to the same generator:

```bash
npm create terajs@latest my-app -- --hub socket.io --hub-url https://api.example.com/live
```

After scaffolding:

```bash
cd my-app
npm install
npm run dev
```