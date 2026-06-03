import { existsSync } from "node:fs";
import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import os from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const proofWorkspaceRoot = join(repoRoot, "packages", "shared", "test", "fixtures", "proof-workspace");
const iosTemplateRoot = join(repoRoot, "packages", "renderer-ios", "ios");
const cliBuildPath = join(repoRoot, "packages", "cli", "dist", "build.js");
const cliShellPath = join(repoRoot, "packages", "cli", "dist", "shell.js");
const cliShellDoctorPath = join(repoRoot, "packages", "cli", "dist", "shellDoctor.js");

function assertBuiltCliAvailable() {
  if (!existsSync(cliBuildPath) || !existsSync(cliShellPath) || !existsSync(cliShellDoctorPath)) {
    console.error("Missing built CLI outputs. Run npm run build before iOS proof shell source validation.");
    process.exit(1);
  }
}

async function copyProofWorkspace() {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "terajs-ios-proof-shell-"));
  const tempWorkspace = join(tempRoot, "shared-workspace");

  await cp(proofWorkspaceRoot, tempWorkspace, { recursive: true });
  await symlink(
    join(repoRoot, "node_modules"),
    join(tempWorkspace, "node_modules"),
    process.platform === "win32" ? "junction" : "dir"
  );

  return { tempRoot, tempWorkspace };
}

function assertPath(label, filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${label} at ${filePath}.`);
  }
}

assertBuiltCliAvailable();
const { runBuildCommand } = await import("../packages/cli/dist/build.js");
const { formatDoctorReport } = await import("../packages/cli/dist/doctor.js");
const { initTargetShell } = await import("../packages/cli/dist/shell.js");
const { inspectIOSReleaseReadiness } = await import("../packages/cli/dist/shellDoctor.js");

let tempRoot;

try {
  const copied = await copyProofWorkspace();
  tempRoot = copied.tempRoot;
  const tempWorkspace = copied.tempWorkspace;
  const originalCwd = process.cwd();

  console.log("Terajs iOS proof shell source validation");
  console.log(`Using workspace: ${tempWorkspace}`);

  process.chdir(tempWorkspace);
  try {
    await runBuildCommand({ target: ["ios"] }, { cwd: tempWorkspace });
    await initTargetShell("ios", {
      cwd: tempWorkspace,
      templateRoot: iosTemplateRoot,
    });
  } finally {
    process.chdir(originalCwd);
  }

  const report = inspectIOSReleaseReadiness({ cwd: tempWorkspace, env: process.env });
  console.log(formatDoctorReport(report));
  if (!report.ok) {
    throw new Error("iOS proof shell source release readiness failed.");
  }

  const shellDir = join(tempWorkspace, "ios");
  const hostSourceRoot = join(shellDir, "Sources", "TerajsRendererHost");
  for (const fileName of [
    "TerajsCommandApplier.swift",
    "TerajsHostRuntime.swift",
    "TerajsHostRuntimeContract.swift",
    "TerajsHostTransport.swift",
    "TerajsWireTypes.swift",
  ]) {
    assertPath(`iOS host source ${fileName}`, join(hostSourceRoot, fileName));
  }

  assertPath("iOS app host metadata", join(shellDir, "TerajsAppHost.json"));
  assertPath("iOS generated target manifest", join(tempWorkspace, ".terajs", "generated", "ios", "terajs-target.json"));
  assertPath("iOS generated runtime entry", join(tempWorkspace, ".terajs", "generated", "ios", "runtime", "live-runtime-entry.js"));
  assertPath("iOS generated bootstrap command batch", join(tempWorkspace, ".terajs", "generated", "ios", "bootstrap", "root-command-batch.json"));
  assertPath("iOS host manifest", join(tempWorkspace, ".terajs", "hosts", "ios", "terajs-host.json"));

  console.log("iOS proof shell source validation passed. Swift/Xcode build validation still requires macOS.");
} finally {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
