# Releasing Terajs

Terajs uses Changesets for versioning and package release prep.

The recommended release path is a manually triggered GitHub Actions workflow. Local publishing remains the fallback path.

## One-time setup

1. Sign in to npm and open the settings for each published `@terajs/*` package.
2. Add a trusted publisher for GitHub Actions with:
	- organization or user: the GitHub owner for this repo
	- repository: `terajs`
	- workflow filename: `release.yml`
3. Leave the built-in `GITHUB_TOKEN` alone; the workflow uses it to push the version branch and to publish through npm trusted publishing.

Trusted publishing is configured on npm, not as a GitHub secret. Once it is enabled on the published packages, the workflow can publish without storing a long-lived npm token.

## Recommended GitHub Actions flow

Prerequisites:

- Trusted publishing is configured on npm for the published packages and points to this repository's `release.yml` workflow.
- `.changeset/*.md` release notes are committed on `main`.

Flow:

1. Open the `Release` workflow in GitHub Actions.
2. Run it against `main`.
3. If pending Changesets exist, the workflow pushes or updates the `changeset-release/main` branch and prints a compare URL in the workflow summary.
4. Open or refresh the version PR from that branch and merge it.
5. Run the `Release` workflow again against `main` to publish the packages.

This keeps publishing explicit while removing the need to run `changeset version` and `changeset publish` by hand on a local machine.

The release workflow already includes the GitHub Actions permission npm needs for OIDC: `id-token: write`.

If you later enable `Allow GitHub Actions to create and approve pull requests` in GitHub repository settings, you can add automated PR creation back on top of this flow. It is not required for publishing.

The workflow only needs real Changeset files. A valid file lists one or more packages and bump levels in the frontmatter, for example:

```md
---
"@terajs/devtools": minor
"@terajs/app": minor
---

Add explicit VS Code bridge lifecycle helpers and app-facing re-exports.
```

## Local fallback flow

1. Add a release note after package changes:

```bash
npm run changeset
```

2. Inspect the pending package plan:

```bash
npm run release:status
```

3. Cut versions and refresh the workspace lockfile:

```bash
npm run version-packages
```

4. Publish the release:

```bash
npm run release:publish
```

Use the local flow if GitHub Actions is unavailable or if you need to recover a release manually.