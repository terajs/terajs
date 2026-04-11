#!/usr/bin/env node
import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scaffoldProject, type ScaffoldHubType } from "./scaffold.js";
import { formatDoctorReport, inspectTerajsProject } from "./doctor.js";

const program = new Command();

function parseHubType(value?: string): ScaffoldHubType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "signalr" || normalized === "socket.io" || normalized === "websockets") {
    return normalized;
  }

  throw new Error(`Invalid --hub value \"${value}\". Expected one of: signalr, socket.io, websockets.`);
}

program
  .name("tera")
  .description("The 2026 Terajs Developer Interface")
  .version("1.0.0-alpha");

program
  .command("init <name>")
  .description("Scaffold a new Terajs project")
  .option("--hub <type>", "preconfigure sync hub type (signalr | socket.io | websockets)")
  .option("--hub-url <url>", "override sync hub URL used in scaffolded terajs.config.cjs")
  .action(async (name: string, options: { hub?: string; hubUrl?: string }) => {
    console.log("Initializing Terajs project...");
    const hub = parseHubType(options.hub);
    await scaffoldProject(name, {
      hub,
      hubUrl: options.hubUrl
    });

    const vscodeDir = join(process.cwd(), name, ".vscode");
    await mkdir(vscodeDir, { recursive: true });
    await writeFile(
      join(vscodeDir, "settings.json"),
      JSON.stringify({ files: { associations: { "*.tera": "html" } } }, null, 2)
    );

    if (hub) {
      const hubUrl = options.hubUrl?.trim();
      console.log(`Realtime hub scaffolded: ${hub}${hubUrl ? ` (${hubUrl})` : ""}`);
    }

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

program
  .command("doctor")
  .description("Inspect current project setup and report actionable issues")
  .action(async () => {
    const report = await inspectTerajsProject(process.cwd());
    console.log(formatDoctorReport(report));

    if (!report.ok) {
      process.exitCode = 1;
    }
  });

program.parse();
