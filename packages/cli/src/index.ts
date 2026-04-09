#!/usr/bin/env node
import { Command } from "commander";
import { createServer } from "vite";
import { scaffoldProject } from "./scaffold.js";
import terajsPlugin from "@terajs/vite-plugin";

const program = new Command();

program
  .name("tera")
  .description("The 2026 Terajs Developer Interface")
  .version("1.0.0-alpha");

program
  .command("init <name>")
  .description("Scaffold a new Terajs project")
  .action(async (name: string) => {
    console.log(`🌌 Creating "${name}" in the nebula...`);
    await scaffoldProject(name);
    console.log(`✅ Project ready. Run 'cd ${name} && tera dev' to start.`);
  });

program
  .command("dev")
  .description("Start the development server with Terajs DevTools")
  .option("-p, --port <number>", "port to run on", "3000")
  .action(async (options: { port: string }) => {
    const server = await createServer({
      plugins: [
        terajsPlugin({
          serverFunctions: { endpoint: "/_terajs/server" }
        })
      ],
      server: { port: parseInt(options.port, 10) }
    });

    await server.listen();
    console.log(`🚀 Terajs Dev Server active at http://localhost:${options.port}`);
    server.printUrls();
  });

program
  .command("build")
  .description("Compile for production (Streaming SSR + Edge Optimized)")
  .action(async () => {
    console.log("🏗️ Building for production...");
    // TODO: invoke Vite build with Terajs manifest generation
  });

program.parse();
