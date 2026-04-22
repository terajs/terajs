import { readFileSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createStarterHero,
  createStarterLayout,
  createStarterPage,
  createStarterStyles
} from "./starterSurface.js";

export type ScaffoldHubType = "signalr" | "socket.io" | "websockets";

export interface ScaffoldProjectOptions {
  hub?: ScaffoldHubType;
  hubUrl?: string;
}

const MODULE_PATH = import.meta.url.startsWith("file:")
  ? fileURLToPath(import.meta.url)
  : import.meta.url;
const CLI_ROOT = join(dirname(MODULE_PATH), "..");
const CLI_ASSETS_DIR = join(CLI_ROOT, "assets");
const FRAMEWORK_VERSION_SOURCE_PACKAGE = "@terajs/vite-plugin";

function readScaffoldVersionRange(): string {
  try {
    const manifest = JSON.parse(readFileSync(join(CLI_ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      version?: string;
    };

    const frameworkVersionRange = manifest.dependencies?.[FRAMEWORK_VERSION_SOURCE_PACKAGE]?.trim();

    if (typeof frameworkVersionRange === "string" && frameworkVersionRange.length > 0) {
      return frameworkVersionRange;
    }

    if (typeof manifest.version === "string" && manifest.version.trim().length > 0) {
      return `^${manifest.version.trim()}`;
    }
  } catch {
    // Fall through to the fallback range below.
  }

  return "^1.0.0";
}

const TERAJS_VERSION = readScaffoldVersionRange();
const APP_FACADE_PACKAGE = "@terajs/app";

const HUB_DEFAULT_URLS: Record<ScaffoldHubType, string> = {
  signalr: "https://api.example.com/terajs/hub",
  "socket.io": "https://api.example.com/realtime",
  websockets: "wss://api.example.com/realtime"
};

const HUB_DEPENDENCIES: Record<ScaffoldHubType, Record<string, string>> = {
  signalr: {
    "@terajs/hub-signalr": TERAJS_VERSION,
    "@microsoft/signalr": "^8.0.0"
  },
  "socket.io": {
    "@terajs/hub-socketio": TERAJS_VERSION,
    "socket.io-client": "^4.8.1"
  },
  websockets: {
    "@terajs/hub-websockets": TERAJS_VERSION
  }
};

function toDisplayName(input: string): string {
  const leaf = input.split(/[\\/]+/).filter((segment) => segment.length > 0).pop() || input;

  return leaf
    .trim()
    .split(/[-_\s]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function createPackageJson(name: string, hubType?: ScaffoldHubType): string {
  return JSON.stringify({
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
      [APP_FACADE_PACKAGE]: TERAJS_VERSION,
      ...(hubType ? HUB_DEPENDENCIES[hubType] : {})
    },
    devDependencies: {
      "vite": "^8.0.0"
    }
  }, null, 2);
}

function createTerajsConfig(hubType?: ScaffoldHubType, hubUrl = ""): string {
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

  return `module.exports = {
  autoImportDirs: ["src/components"],
  routeDirs: ["src/pages"],
  devtools: {
    enabled: true,
    startOpen: false,
    position: "bottom-center",
    panelShortcut: "Alt+Shift+D",
    visibilityShortcut: "Alt+Shift+H"
  },${syncSection}
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    keepPreviousDuringLoading: true,
    applyMeta: true
  }
};
`;
}

function createIndexHtml(displayName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${displayName} | Terajs Starter</title>
    <meta
      name="description"
      content="A spacious Terajs starter with the full-size logo, route-first scaffolding, and the official docs one click away." />
    <link rel="icon" type="image/png" href="/terajs-logo-extension.png" />
    <link rel="apple-touch-icon" href="/terajs-logo-extension.png" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/plugins/index.ts" data-terajs-ignore-bootstrap="true"></script>
  </body>
</html>
`;
}

function createPluginEntry(): string {
  return `import "../styles.css";

export {};
`;
}

function createEnvDeclarations(): string {
  return `declare module "*.tera" {
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
`;
}

async function copyBrandAssets(publicDir: string): Promise<void> {
  await Promise.all([
    copyFile(join(CLI_ASSETS_DIR, "terajs-logo.png"), join(publicDir, "terajs-logo.png")),
    copyFile(join(CLI_ASSETS_DIR, "terajs-logo-extension.png"), join(publicDir, "terajs-logo-extension.png"))
  ]);
}

export async function scaffoldProject(name: string, options: ScaffoldProjectOptions = {}): Promise<void> {
  const root = join(process.cwd(), name);
  const src = join(root, "src");
  const pages = join(src, "pages");
  const components = join(src, "components");
  const middleware = join(src, "middleware");
  const plugins = join(src, "plugins");
  const publicDir = join(root, "public");
  const terajs = join(root, ".terajs");
  const displayName = toDisplayName(name);
  const hubType = options.hub;
  const hubUrl = hubType
    ? (options.hubUrl?.trim() || HUB_DEFAULT_URLS[hubType])
    : "";

  await mkdir(pages, { recursive: true });
  await mkdir(components, { recursive: true });
  await mkdir(middleware, { recursive: true });
  await mkdir(plugins, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await mkdir(terajs, { recursive: true });
  await copyBrandAssets(publicDir);

  await writeFile(join(root, "package.json"), createPackageJson(name, hubType));
  await writeFile(join(root, "terajs.config.cjs"), createTerajsConfig(hubType, hubUrl));
  await writeFile(
    join(root, "vite.config.ts"),
    `import { defineConfig } from "vite";
  import terajsPlugin from "@terajs/app/vite";

export default defineConfig({
  plugins: [terajsPlugin()],
  build: {
    manifest: true
  }
});
`
  );
  await writeFile(join(root, "index.html"), createIndexHtml(displayName));
  await writeFile(join(src, "env.d.ts"), createEnvDeclarations());
  await writeFile(join(root, ".gitignore"), `node_modules\ndist\n`);
  await writeFile(join(plugins, "index.ts"), createPluginEntry());
  await writeFile(join(src, "styles.css"), createStarterStyles());
  await writeFile(join(components, "StarterHero.tera"), createStarterHero());
  await writeFile(join(pages, "layout.tera"), createStarterLayout());
  await writeFile(join(pages, "index.tera"), createStarterPage(displayName, hubType));
}
