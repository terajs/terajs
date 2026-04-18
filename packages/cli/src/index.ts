import { readFileSync } from "node:fs";
import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldProject, type ScaffoldHubType } from "./scaffold.js";
import { formatDoctorReport, inspectTerajsProject } from "./doctor.js";

const CLI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function readCliVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(join(CLI_ROOT, "package.json"), "utf8")) as {
      version?: string;
    };

    if (typeof manifest.version === "string" && manifest.version.trim().length > 0) {
      return manifest.version.trim();
    }
  } catch {
    // Fall through to the fallback version below.
  }

  return "0.0.0";
}

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

export function createProgram(): Command {
  const program = new Command();

  program
    .name("tera")
    .description("Official Terajs scaffold and project CLI")
    .version(readCliVersion());

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

  return program;
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  await createProgram().parseAsync(argv, { from: "user" });
}
