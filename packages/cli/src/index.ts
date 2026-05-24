import { readFileSync } from "node:fs";
import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import { scaffoldProject, type ScaffoldHubType, type ScaffoldProjectMode } from "./scaffold.js";
import { collectBuildTarget, runBuildCommand } from "./build.js";
import { formatDoctorReport, inspectTerajsProject } from "./doctor.js";
import { initTargetShell } from "./shell.js";
import { inspectTargetShell } from "./shellDoctor.js";

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

function parseMode(value?: string): ScaffoldProjectMode {
  if (!value) {
    return "web";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "web" || normalized === "universal") {
    return normalized;
  }

  throw new Error(`Invalid --mode value \"${value}\". Expected one of: web, universal.`);
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
    .option("--mode <mode>", "scaffold mode (web | universal)", "web")
    .option("--hub <type>", "preconfigure sync hub type (signalr | socket.io | websockets)")
    .option("--hub-url <url>", "override sync hub URL used in scaffolded terajs.config.cjs")
    .action(async (name: string, options: { mode?: string; hub?: string; hubUrl?: string }) => {
      console.log("Initializing Terajs project...");
      const mode = parseMode(options.mode);
      const hub = parseHubType(options.hub);
      await scaffoldProject(name, {
        mode,
        hub,
        hubUrl: options.hubUrl
      });

      const vscodeDir = join(process.cwd(), name, ".vscode");
      await mkdir(vscodeDir, { recursive: true });
      await writeFile(
        join(vscodeDir, "settings.json"),
        JSON.stringify({ files: { associations: { "*.tera": "html" } } }, null, 2)
      );

      if (mode === "universal") {
        console.log("Universal workspace scaffolded with shared source under src/shared.");
      }

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
      const [{ default: terajsPlugin }] = await Promise.all([
        import("@terajs/app/vite")
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
    .description("Build configured workspace targets for production")
    .option("-t, --target <target>", "build target list (comma-separated: web, android, ios)")
    .action(async (options: { target?: string }) => {
      console.log("Building configured Terajs targets...");

      try {
        const buildOptions = typeof options.target === "string"
          ? { target: collectBuildTarget(options.target) }
          : {};

        const buildReport = await runBuildCommand(buildOptions, {
          viteBuild: build
        });

        console.log(`Workspace mode: ${buildReport.workspace.mode}`);
        console.log(`Targets: ${buildReport.targets.join(", ")}`);

        for (const result of buildReport.results) {
          const status = result.status === "built" ? "BUILT" : "PENDING";
          console.log(`[${status}] ${result.target}: ${result.detail}`);
        }

        const pendingTargets = buildReport.results
          .filter((result) => result.status === "pending")
          .map((result) => result.target);

        if (pendingTargets.length > 0) {
          console.log(`Implemented targets built. Pending native target builders: ${pendingTargets.join(", ")}.`);
          return;
        }

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

  const shell = program
    .command("shell")
    .description("Materialize target workspace shells");

  shell
    .command("init <target>")
    .description("Materialize a target shell for the current universal workspace")
    .option("--dir <directory>", "destination directory for the generated shell")
    .action(async (target: string, options: { dir?: string }) => {
      console.log(`Preparing ${target} shell...`);

      try {
        const shellResult = await initTargetShell(target, {
          cwd: process.cwd(),
          destinationDir: options.dir
        });

        const relativeShellDir = path.relative(process.cwd(), shellResult.shellDir) || ".";
        console.log(`Target shell ready at ${relativeShellDir.replace(/\\/g, "/")}.`);

        if (shellResult.target === "android") {
          const buildCommand = process.platform === "win32"
            ? "gradlew.bat assembleDebug"
            : "./gradlew assembleDebug";
          console.log(`Run 'cd ${relativeShellDir.replace(/\\/g, "/")} && ${buildCommand}' to build the Android shell.`);
          console.log("Run 'tera shell doctor android' to verify local Android build prerequisites and synced bootstrap assets.");
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`Terajs shell init failed: ${reason}`);
        process.exitCode = 1;
      }
    });

  shell
    .command("doctor <target>")
    .description("Inspect shell prerequisites and synced target assets")
    .option("--dir <directory>", "shell directory to inspect")
    .action(async (target: string, options: { dir?: string }) => {
      try {
        const report = inspectTargetShell(target as "android" | "ios", {
          cwd: process.cwd(),
          destinationDir: options.dir
        });

        console.log(formatDoctorReport(report));
        if (!report.ok) {
          process.exitCode = 1;
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`Terajs shell doctor failed: ${reason}`);
        process.exitCode = 1;
      }
    });

  return program;
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  await createProgram().parseAsync(argv, { from: "user" });
}
