import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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
        dev: "tera dev",
        build: "tera build"
      },
      dependencies: {
        "@terajs/runtime": "*",
        "@terajs/vite-plugin": "*"
      }
    }, null, 2)
  );

  await writeFile(
    join(root, "terajs.config.js"),
    `export default {
  plugin: {
    autoImportDirs: ["src/components"],
    routesDir: "src/routes"
  }
};
`
  );

  await writeFile(
    join(routes, "index.tera"),
    `<template>
  <div>Welcome to ${name}</div>
</template>

<meta>
  title: Home
</meta>
`
  );
}
