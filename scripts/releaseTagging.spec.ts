import { describe, expect, it } from "vitest";
import { collectChangedPackageTags, collectTagsToPush, parseGitTagLines, resolveGitExecutionEnvironment } from "./releaseTagging.mjs";

describe("resolveGitExecutionEnvironment", () => {
  it("preserves the existing environment when git identity is already configured", () => {
    expect(resolveGitExecutionEnvironment({ CI: "true" }, "Brogrammer", "dev@example.com")).toEqual({ CI: "true" });
  });

  it("injects the GitHub Actions bot identity when git config is missing in CI", () => {
    expect(resolveGitExecutionEnvironment({ GITHUB_ACTIONS: "true" }, "", "")).toMatchObject({
      GITHUB_ACTIONS: "true",
      GIT_AUTHOR_NAME: "github-actions[bot]",
      GIT_AUTHOR_EMAIL: "41898282+github-actions[bot]@users.noreply.github.com",
      GIT_COMMITTER_NAME: "github-actions[bot]",
      GIT_COMMITTER_EMAIL: "41898282+github-actions[bot]@users.noreply.github.com"
    });
  });

  it("does not inject a bot identity outside GitHub Actions", () => {
    expect(resolveGitExecutionEnvironment({}, "", "")).toEqual({});
  });
});

describe("collectTagsToPush", () => {
  it("includes the repo tag and every package tag on HEAD without duplicates", () => {
    expect(collectTagsToPush("@terajs/app@1.1.3\n@terajs/devtools@1.1.3\nv1.1.3\n", "v1.1.3")).toEqual([
      "@terajs/app@1.1.3",
      "@terajs/devtools@1.1.3",
      "v1.1.3"
    ]);
  });

  it("includes recovered package tags that are not already present locally", () => {
    expect(collectTagsToPush("v1.1.3\n", "v1.1.3", ["@terajs/app@1.1.3", "create-terajs@1.0.6"])).toEqual([
      "v1.1.3",
      "@terajs/app@1.1.3",
      "create-terajs@1.0.6"
    ]);
  });

  it("ignores blank lines in git tag output", () => {
    expect(parseGitTagLines("\nfoo\r\n\r\nbar\n")).toEqual(["foo", "bar"]);
  });
});

describe("collectChangedPackageTags", () => {
  it("returns tags only for publishable packages whose versions changed in the release commit", () => {
    expect(collectChangedPackageTags([
      {
        name: "@terajs/app",
        currentVersion: "1.1.3",
        previousVersion: "1.1.2"
      },
      {
        name: "@terajs/shared",
        currentVersion: "1.0.4",
        previousVersion: "1.0.4"
      },
      {
        name: "internal-tooling",
        currentVersion: "1.0.0",
        previousVersion: "0.9.0",
        private: true
      },
      {
        name: "create-terajs",
        currentVersion: "1.0.6",
        previousVersion: "1.0.5"
      }
    ])).toEqual([
      "@terajs/app@1.1.3",
      "create-terajs@1.0.6"
    ]);
  });
});