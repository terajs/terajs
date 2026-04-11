import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function scaffoldProject(name: string): Promise<void> {
  const root = join(process.cwd(), name);
  const src = join(root, "src");
  const pages = join(src, "pages");
  const components = join(src, "components");
  const terajs = join(root, ".terajs");

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
        "terajs": "^0.0.1"
      },
      devDependencies: {
        "vite": "^8.0.0"
      }
    }, null, 2)
  );

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
      },
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
