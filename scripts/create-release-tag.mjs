#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectTagsToPush, resolveGitExecutionEnvironment } from "./releaseTagging.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const shouldPush = process.argv.includes("--push");

function runGit(args, { allowFailure = false, env = process.env } = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env
  });

  if (result.status === 0) {
    return result.stdout.trim();
  }

  if (allowFailure) {
    return null;
  }

  const errorOutput = [result.stderr, result.stdout]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);

  throw new Error(errorOutput || `git ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
}

async function main() {
  const rootManifest = JSON.parse(await readFile(resolve(repoRoot, "package.json"), "utf8"));
  const tagName = `v${rootManifest.version}`;
  const gitEnv = resolveGitExecutionEnvironment(
    process.env,
    runGit(["config", "user.name"], { allowFailure: true }) ?? "",
    runGit(["config", "user.email"], { allowFailure: true }) ?? ""
  );
  const git = (args, options = {}) => runGit(args, { ...options, env: gitEnv });
  const headCommit = git(["rev-parse", "HEAD"]);

  try {
    git(["merge-base", "--is-ancestor", headCommit, "origin/main"]);
  } catch {
    throw new Error(`Ref ${headCommit} is not merged into origin/main; release tags are only created from merged main history.`);
  }

  const taggedCommit = git(["rev-list", "-n", "1", tagName], { allowFailure: true }) ?? "";

  if (!taggedCommit) {
    git(["tag", "-a", tagName, "-m", `release: ${rootManifest.version}`]);
    console.log(`Created annotated tag ${tagName} at ${headCommit}.`);
  } else if (taggedCommit !== headCommit) {
    throw new Error(`Tag ${tagName} already points at ${taggedCommit}, not ${headCommit}.`);
  } else {
    console.log(`Tag ${tagName} already points at ${headCommit}.`);
  }

  if (shouldPush) {
    for (const pushedTag of collectTagsToPush(git(["tag", "--points-at", "HEAD"]), tagName)) {
      git(["push", "origin", `refs/tags/${pushedTag}`]);
      console.log(`Pushed ${pushedTag} to origin.`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});