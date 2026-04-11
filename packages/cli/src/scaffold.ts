import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ScaffoldHubType = "signalr" | "socket.io" | "websockets";

export interface ScaffoldProjectOptions {
  hub?: ScaffoldHubType;
  hubUrl?: string;
}

const HUB_DEFAULT_URLS: Record<ScaffoldHubType, string> = {
  signalr: "https://api.example.com/terajs/hub",
  "socket.io": "https://api.example.com/realtime",
  websockets: "wss://api.example.com/realtime"
};

const HUB_DEPENDENCIES: Record<ScaffoldHubType, Record<string, string>> = {
  signalr: {
    "@terajs/hub-signalr": "^0.0.1",
    "@microsoft/signalr": "^8.0.0"
  },
  "socket.io": {
    "@terajs/hub-socketio": "^0.0.1",
    "socket.io-client": "^4.8.1"
  },
  websockets: {
    "@terajs/hub-websockets": "^0.0.1"
  }
};

export async function scaffoldProject(name: string, options: ScaffoldProjectOptions = {}): Promise<void> {
  const root = join(process.cwd(), name);
  const src = join(root, "src");
  const pages = join(src, "pages");
  const components = join(src, "components");
  const terajs = join(root, ".terajs");
  const hubType = options.hub;
  const hubUrl = hubType
    ? (options.hubUrl?.trim() || HUB_DEFAULT_URLS[hubType])
    : "";

  await mkdir(pages, { recursive: true });
  await mkdir(components, { recursive: true });
  await mkdir(terajs, { recursive: true });

  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name,
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "terajs": "^0.0.1",
        ...(hubType ? HUB_DEPENDENCIES[hubType] : {})
      },
      devDependencies: {
        "vite": "^8.0.0"
      }
    }, null, 2)
  );

  const syncSection = hubType
    ? `
  sync: {
    hub: {
      type: ${JSON.stringify(hubType)},
      url: ${JSON.stringify(hubUrl)},
      autoConnect: true,
      retryPolicy: "exponential"
    }
  },`
    : "";

  await writeFile(
    join(root, "terajs.config.cjs"),
    `module.exports = {
  autoImportDirs: ["src/components"],
  routeDirs: ["src/pages"],
  devtools: {
    enabled: true,
    startOpen: false,
    position: "bottom-right",
    panelShortcut: "Ctrl+Shift+D",
    visibilityShortcut: "Ctrl+Shift+H"
  },${syncSection}
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    keepPreviousDuringLoading: true,
    applyMeta: true
  }
};
`
  );

  await writeFile(
    join(root, "vite.config.ts"),
    `import { defineConfig } from "vite";
import terajsPlugin from "terajs/vite";

export default defineConfig({
  plugins: [terajsPlugin()],
  build: {
    manifest: true
  }
});
`
  );

  await writeFile(
    join(root, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`
  );

  await writeFile(
    join(src, "env.d.ts"),
    `declare module "*.tera" {
  const component: (props?: any) => Node;
  export default component;
}

declare module "virtual:terajs-routes" {
  const routes: any[];
  export { routes };
}

declare module "virtual:terajs-app" {
  const app: (props?: any) => Node;
  export default app;
  export function bootstrapTerajsApp(): void;
}
`
  );

  await writeFile(
    join(root, ".gitignore"),
    `node_modules
dist
`
  );

  await writeFile(
    join(pages, "index.tera"),
    `<template>
  <main>
    <h1>Welcome to ${name}</h1>
    <p>Your first Terajs app is running.</p>
  </main>
</template>

<meta>
  title: Home
</meta>
`
  );
}
