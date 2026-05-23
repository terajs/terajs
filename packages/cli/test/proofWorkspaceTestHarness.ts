import { cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const originalCwd = process.cwd();
export const proofWorkspaceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "shared",
  "test",
  "fixtures",
  "proof-workspace"
);

const tempDirs: string[] = [];

export async function copyProofWorkspace(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "terajs-proof-workspace-"));
  tempDirs.push(tempRoot);

  const tempWorkspace = path.join(tempRoot, "shared-workspace");
  await cp(proofWorkspaceRoot, tempWorkspace, { recursive: true });
  return tempWorkspace;
}

export async function cleanupProofWorkspaceCopies(): Promise<void> {
  process.chdir(originalCwd);
  await Promise.all(tempDirs.splice(0).map((dirPath) => rm(dirPath, { recursive: true, force: true })));
}