const GITHUB_ACTIONS_BOT_NAME = "github-actions[bot]";
const GITHUB_ACTIONS_BOT_EMAIL = "41898282+github-actions[bot]@users.noreply.github.com";

export function resolveGitExecutionEnvironment(baseEnv, gitUserName, gitUserEmail) {
  const env = { ...baseEnv };

  if (typeof gitUserName === "string" && gitUserName.length > 0 && typeof gitUserEmail === "string" && gitUserEmail.length > 0) {
    return env;
  }

  if (env.GITHUB_ACTIONS !== "true") {
    return env;
  }

  env.GIT_AUTHOR_NAME ??= GITHUB_ACTIONS_BOT_NAME;
  env.GIT_AUTHOR_EMAIL ??= GITHUB_ACTIONS_BOT_EMAIL;
  env.GIT_COMMITTER_NAME ??= GITHUB_ACTIONS_BOT_NAME;
  env.GIT_COMMITTER_EMAIL ??= GITHUB_ACTIONS_BOT_EMAIL;

  return env;
}

export function parseGitTagLines(output) {
  return String(output ?? "")
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function collectChangedPackageTags(packageChanges) {
  const tags = new Set();

  for (const change of packageChanges) {
    if (!change || change.private === true) {
      continue;
    }

    if (typeof change.name !== "string" || change.name.length === 0) {
      continue;
    }

    if (typeof change.currentVersion !== "string" || change.currentVersion.length === 0) {
      continue;
    }

    if (change.previousVersion === change.currentVersion) {
      continue;
    }

    tags.add(`${change.name}@${change.currentVersion}`);
  }

  return [...tags];
}

export function collectTagsToPush(headTags, repoTagName, packageTags = []) {
  const tags = new Set(parseGitTagLines(headTags));
  for (const packageTag of packageTags) {
    if (typeof packageTag === "string" && packageTag.length > 0) {
      tags.add(packageTag);
    }
  }

  if (typeof repoTagName === "string" && repoTagName.length > 0) {
    tags.add(repoTagName);
  }

  return [...tags];
}