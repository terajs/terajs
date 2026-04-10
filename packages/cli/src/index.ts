#!/usr/bin/env node
import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scaffoldProject } from "./scaffold.js";

const program = new Command();

program
  .name("tera")
  .description("The 2026 Terajs Developer Interface")
  .version("1.0.0-alpha");

program
  .command("init <name>")
  .description("Scaffold a new Terajs project")
  .action(async (name: string) => {
    console.log("Initializing Terajs project...");
    await scaffoldProject(name);

    const vscodeDir = join(process.cwd(), name, ".vscode");
    await mkdir(vscodeDir, { recursive: true });
    await writeFile(
      join(vscodeDir, "settings.json"),
      JSON.stringify({ files: { associations: { "*.tera": "html" } } }, null, 2)
    );

    console.log(`Project ready. Run 'cd ${name} && npm install && npm run dev' to start.`);
  });

program
  .command("dev")
  .description("Start the development server with Terajs DevTools")
  .option("-p, --port <number>", "port to run on", "3000")
  .action(async (options: { port: string }) => {
    const [{ createServer }, { default: terajsPlugin }] = await Promise.all([
      import("vite"),
      import("@terajs/vite-plugin")
    ]);

    const server = await createServer({
      plugins: [
        terajsPlugin({
          serverFunctions: { endpoint: "/_terajs/server" }
        })
      ],
      server: { port: parseInt(options.port, 10) }
    });

    await server.listen();
    console.log(`Terajs Dev Server active at http://localhost:${options.port}`);
    server.printUrls();
  });

program
  .command("build")
  .description("Compile for production (Streaming SSR + Edge Optimized)")
  .action(async () => {
    console.log("Building for production...");

    try {
      const [{ build: viteBuild }, { default: terajsPlugin }] = await Promise.all([
        import("vite"),
        import("@terajs/vite-plugin")
      ]);

      await viteBuild({
        plugins: [
          terajsPlugin({
            serverFunctions: { endpoint: "/_terajs/server" }
          })
        ],
        build: {
          manifest: true
        }
      });

      console.log("Terajs production build complete.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Terajs build failed: ${reason}`);
      process.exitCode = 1;
    }
  });

program.parse();
