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
import { createUniversalPage, createUniversalWorkspaceReadme } from "./universalSurface.js";

export type ScaffoldHubType = "signalr" | "socket.io" | "websockets";
export type ScaffoldProjectMode = "web" | "universal";

export interface ScaffoldProjectOptions {
  mode?: ScaffoldProjectMode;
  hub?: ScaffoldHubType;
  hubUrl?: string;
}

const MODULE_PATH = import.meta.url.startsWith("file:")
  ? fileURLToPath(import.meta.url)
  : import.meta.url;
const CLI_ROOT = join(dirname(MODULE_PATH), "..");
const CLI_ASSETS_DIR = join(CLI_ROOT, "assets");
const FRAMEWORK_VERSION_SOURCE_PACKAGE = "@terajs/app";

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

function createTerajsConfig(mode: ScaffoldProjectMode, hubType?: ScaffoldHubType, hubUrl = ""): string {
  const workspaceSection = mode === "universal"
    ? `
  workspace: {
    mode: "universal",
    sourceRoot: "src/shared",
    targets: {
      selected: ["web", "android", "ios"],
      web: {
        outputDir: "dist"
      },
      android: {
        generatedDir: ".terajs/generated/android",
        hostDir: ".terajs/hosts/android"
      },
      ios: {
        generatedDir: ".terajs/generated/ios",
        hostDir: ".terajs/hosts/ios"
      }
    }
  },`
    : "";
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
  const autoImportDirs = mode === "universal"
    ? "[\"src/shared/components\"]"
    : "[\"src/components\"]";
  const routeDirs = mode === "universal"
    ? "[\"src/shared/pages\"]"
    : "[\"src/pages\"]";

  return `module.exports = {
${workspaceSection}
  autoImportDirs: ${autoImportDirs},
  routeDirs: ${routeDirs},
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

function createIndexHtml(displayName: string, mode: ScaffoldProjectMode): string {
  const title = mode === "universal"
    ? `${displayName} | Terajs Universal Workspace`
    : `${displayName} | Terajs Starter`;
  const description = mode === "universal"
    ? "A shared-source Terajs workspace with explicit web, Android, and iOS target paths."
    : "A spacious Terajs starter with the full-size logo, route-first scaffolding, and the official docs one click away.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta
      name="description"
      content="${description}" />
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

function createGitIgnore(mode: ScaffoldProjectMode): string {
  const universalEntries = mode === "universal"
    ? ".terajs/generated\n.terajs/hosts\n"
    : "";

  return `node_modules\ndist\n${universalEntries}`;
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
  const mode = options.mode ?? "web";
  const sourceRoot = mode === "universal"
    ? join(src, "shared")
    : src;
  const pages = join(sourceRoot, "pages");
  const components = join(sourceRoot, "components");
  const middleware = join(src, "middleware");
  const plugins = join(src, "plugins");
  const publicDir = join(root, "public");
  const terajs = join(root, ".terajs");
  const generatedAndroid = join(terajs, "generated", "android");
  const generatedIos = join(terajs, "generated", "ios");
  const hostsAndroid = join(terajs, "hosts", "android");
  const hostsIos = join(terajs, "hosts", "ios");
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
  if (mode === "universal") {
    await mkdir(generatedAndroid, { recursive: true });
    await mkdir(generatedIos, { recursive: true });
    await mkdir(hostsAndroid, { recursive: true });
    await mkdir(hostsIos, { recursive: true });
  }
  await copyBrandAssets(publicDir);

  await writeFile(join(root, "package.json"), createPackageJson(name, hubType));
  await writeFile(join(root, "terajs.config.cjs"), createTerajsConfig(mode, hubType, hubUrl));
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
  await writeFile(join(root, "index.html"), createIndexHtml(displayName, mode));
  await writeFile(join(src, "env.d.ts"), createEnvDeclarations());
  await writeFile(join(root, ".gitignore"), createGitIgnore(mode));
  await writeFile(join(plugins, "index.ts"), createPluginEntry());
  await writeFile(join(src, "styles.css"), createStarterStyles());
  await writeFile(join(components, "StarterHero.tera"), createStarterHero());
  await writeFile(join(pages, "layout.tera"), createStarterLayout());
  await writeFile(
    join(pages, "index.tera"),
    mode === "universal"
      ? createUniversalPage(displayName)
      : createStarterPage(displayName, hubType)
  );
  if (mode === "universal") {
    await writeFile(join(root, "README.md"), createUniversalWorkspaceReadme(displayName));
  }
}
