# create-terajs

Create a new Terajs application with npm's `create` flow.

## Usage

```bash
npm create terajs@latest my-app
```

That default create flow stays web-first.

Use universal mode when one workspace should own shared `.tera` source and explicit target mapping for web, Android, and iOS:

```bash
npm create terajs@latest my-app -- --mode universal
```

### Realtime preset

```bash
npm create terajs@latest my-app -- --hub socket.io --hub-url https://api.example.com/live
```

### Next steps

```bash
cd my-app
npm install
npm run dev
```