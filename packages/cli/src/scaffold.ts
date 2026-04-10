import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function scaffoldProject(name: string): Promise<void> {
  const root = join(process.cwd(), name);
  const src = join(root, "src");
  const routes = join(src, "routes");
  const components = join(src, "components");
  const terajs = join(root, ".terajs");

  await mkdir(routes, { recursive: true });
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
        "@terajs/runtime": "^0.0.1",
        "@terajs/renderer-web": "^0.0.1"
      },
      devDependencies: {
        "@terajs/vite-plugin": "^0.0.1",
        "vite": "^8.0.0"
      }
    }, null, 2)
  );

  await writeFile(
    join(root, "terajs.config.cjs"),
    `module.exports = {
  autoImportDirs: ["src/components"],
  routeDirs: ["src/routes"]
};
`
  );

  await writeFile(
    join(root, "vite.config.ts"),
    `import { defineConfig } from "vite";
import terajsPlugin from "@terajs/vite-plugin";

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
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`
  );

  await writeFile(
    join(src, "main.ts"),
    `import { mount } from "@terajs/renderer-web";
import App from "./routes/index.tera";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing #app root element.");
}

mount(App, root);
`
  );

  await writeFile(
    join(src, "env.d.ts"),
    `declare module "*.tera" {
  const component: (props?: any) => Node;
  export default component;
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
    join(routes, "index.tera"),
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
