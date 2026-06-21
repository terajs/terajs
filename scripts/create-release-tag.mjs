#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangedPackageTags, collectTagsToPush, resolveGitExecutionEnvironment } from "./releaseTagging.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");
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

  function readJsonAtRef(ref, relativePath) {
    const content = git(["show", `${ref}:${relativePath.replace(/\\/g, "/")}`], { allowFailure: true });
    return content ? JSON.parse(content) : null;
  }

  function resolveFirstParent(ref) {
    return git(["rev-parse", `${ref}^`], { allowFailure: true });
  }

  function resolveReleaseCommit() {
    let commit = headCommit;

    while (true) {
      const manifest = readJsonAtRef(commit, "package.json");
      if (!manifest || manifest.version !== rootManifest.version) {
        throw new Error(`Unable to resolve the release commit for repo version ${rootManifest.version}.`);
      }

      const parent = resolveFirstParent(commit);
      if (!parent) {
        return { releaseCommit: commit, previousCommit: null };
      }

      const parentManifest = readJsonAtRef(parent, "package.json");
      if (!parentManifest || parentManifest.version !== rootManifest.version) {
        return { releaseCommit: commit, previousCommit: parent };
      }

      commit = parent;
    }
  }

  function parseGitLines(output) {
    return String(output ?? "")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function resolvePackageVersionCommit(relativePath, version, releaseCommit) {
    const releaseManifest = readJsonAtRef(releaseCommit, relativePath);
    if (releaseManifest?.version === version) {
      return releaseCommit;
    }

    const mainlineCommits = parseGitLines(
      git(["rev-list", "--first-parent", "--reverse", `${releaseCommit}..${headCommit}`], { allowFailure: true }) ?? ""
    );

    for (const commit of mainlineCommits) {
      const manifest = readJsonAtRef(commit, relativePath);
      if (manifest?.version === version) {
        return commit;
      }
    }

    const headManifest = readJsonAtRef(headCommit, relativePath);
    if (headManifest?.version === version) {
      return headCommit;
    }

    throw new Error(`Unable to resolve the commit that introduced ${relativePath} version ${version}.`);
  }

  async function collectPackageTagPlans(previousCommit, releaseCommit) {
    const entries = await readdir(packagesRoot, { withFileTypes: true });
    const packagePlans = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const relativePath = join("packages", entry.name, "package.json");
      const packageJsonPath = join(repoRoot, relativePath);
      if (!existsSync(packageJsonPath)) {
        continue;
      }

      const currentManifest = JSON.parse(await readFile(packageJsonPath, "utf8"));
      if (currentManifest.private === true) {
        continue;
      }

      const previousManifest = previousCommit ? readJsonAtRef(previousCommit, relativePath) : null;

      const [tagName] = collectChangedPackageTags([{
        name: currentManifest.name,
        private: currentManifest.private === true,
        currentVersion: currentManifest.version,
        previousVersion: previousManifest?.version
      }]);

      if (!tagName) {
        continue;
      }

      packagePlans.push({
        tagName,
        targetCommit: resolvePackageVersionCommit(relativePath, currentManifest.version, releaseCommit)
      });
    }

    return packagePlans;
  }

  const { releaseCommit, previousCommit } = resolveReleaseCommit();
  const packageTagPlans = await collectPackageTagPlans(previousCommit, releaseCommit);

  try {
    git(["merge-base", "--is-ancestor", releaseCommit, "origin/main"]);
  } catch {
    throw new Error(`Ref ${releaseCommit} is not merged into origin/main; release tags are only created from merged main history.`);
  }

  const taggedCommit = git(["rev-list", "-n", "1", tagName], { allowFailure: true }) ?? "";

  if (!taggedCommit) {
    git(["tag", "-a", tagName, releaseCommit, "-m", `release: ${rootManifest.version}`]);
    console.log(`Created annotated tag ${tagName} at ${releaseCommit}.`);
  } else if (taggedCommit !== releaseCommit) {
    throw new Error(`Tag ${tagName} already points at ${taggedCommit}, not ${releaseCommit}.`);
  } else {
    console.log(`Tag ${tagName} already points at ${releaseCommit}.`);
  }

  for (const { tagName: packageTagName, targetCommit } of packageTagPlans) {
    try {
      git(["merge-base", "--is-ancestor", targetCommit, "origin/main"]);
    } catch {
      throw new Error(`Ref ${targetCommit} for ${packageTagName} is not merged into origin/main; release tags are only created from merged main history.`);
    }

    const packageTaggedCommit = git(["rev-list", "-n", "1", packageTagName], { allowFailure: true }) ?? "";
    if (!packageTaggedCommit) {
      git(["tag", packageTagName, targetCommit]);
      console.log(`Created package tag ${packageTagName} at ${targetCommit}.`);
      continue;
    }

    if (packageTaggedCommit !== targetCommit) {
      throw new Error(`Tag ${packageTagName} already points at ${packageTaggedCommit}, not ${targetCommit}.`);
    }
  }

  if (shouldPush) {
    const packageTagNames = packageTagPlans.map((plan) => plan.tagName);
    for (const pushedTag of collectTagsToPush(git(["tag", "--points-at", releaseCommit]), tagName, packageTagNames)) {
      git(["push", "origin", `refs/tags/${pushedTag}`]);
      console.log(`Pushed ${pushedTag} to origin.`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
