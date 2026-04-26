# Releasing Terajs

Terajs uses Changesets for versioning and package release prep.

The recommended release path is a manually triggered GitHub Actions workflow. Local publishing remains the fallback path.

## One-time setup

1. Sign in to npm and open the settings for each published `@terajs/*` package.
2. Add a trusted publisher for GitHub Actions with:
	- organization or user: `terajs`
	- repository: `terajs`
	- workflow filename: `release.yml`
3. Leave the built-in `GITHUB_TOKEN` alone; the workflow uses it to push the version branch and to publish through npm trusted publishing.

Trusted publishing is strict about exact matches. The package settings on npm must match the GitHub organization or user, repository, and workflow filename exactly, and the package `repository.url` fields must point at `https://github.com/terajs/terajs`.

Trusted publishing is configured on npm, not as a GitHub secret. Once it is enabled on the published packages, the workflow can publish without storing a long-lived npm token. The release workflow uses Node 24 and npm 11.5.1 or newer so the npm CLI can perform the OIDC exchange required by trusted publishing.


## Release Checklist (GitHub Actions)

**Prerequisites:**

- Trusted publishing is configured on npm for all published `@terajs/*` packages and points to this repo's `release.yml` workflow.
- All intended changes are merged to `main` and `.changeset/*.md` files are committed.

**Release Steps:**

1. Run the local release check:
	```bash
	npm run release:check
	```
	- This validates tests, typecheck, docs, exports, and pending Changesets.
2. Open the `Release` workflow in GitHub Actions.
3. Run it against `main`.
4. If pending Changesets exist, the workflow pushes or updates the `changeset-release/main` branch and prints a compare URL in the workflow summary.
5. Open or refresh the version PR from that branch and merge it.
6. Run the `Release` workflow again against `main` to publish the packages.

**What happens automatically:**
- All affected package versions are bumped and changelogs updated.
- The root `package.json` version is synced to the highest public package version.
- An annotated git tag (e.g., `v1.1.2`) is created and pushed.
- A GitHub Release entry is created if configured in `release.yml`.
- Packages are published to npm via trusted publishing.

**You do NOT need to manually bump versions, changelogs, or tags.**

---

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

If GitHub Actions is unavailable or you need to recover a release manually:

1. Add a release note after package changes:
	```bash
	npm run changeset
	```
2. Inspect the pending package plan:
	```bash
	npm run release:status
	```
3. Cut versions, sync the repo release version, and refresh the workspace lockfile:
	```bash
	npm run version-packages
	```
4. Publish the release and create the local repo tag:
	```bash
	npm run release:publish
	```
5. Push the release tag once the publish succeeds:
	```bash
	npm run release:tag:push
	```

---

## One-step local release check

You can run all local release validation and status checks with:
```bash
npm run release:check
```
This runs tests, typecheck, docs, exports, and shows pending Changesets. Fix any errors before running the GitHub Actions workflow.