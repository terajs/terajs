# Changesets

Use Changesets for package versioning and release prep in this repo.

Recommended release flow:

1. Run `npm run changeset` after a user-facing package change.
2. Commit the generated file under `.changeset/` with the implementation.
3. Make sure npm trusted publishing is configured for the published packages and points to the `release.yml` workflow in this repo.
4. Trigger the `Release` GitHub Actions workflow against `main`.
5. If pending Changesets exist, open or refresh the version PR from the `changeset-release/main` branch the workflow pushes.
6. Trigger the `Release` workflow again to publish the updated packages and push the matching repo release tag.

Immediate publish flow for a single PR:

1. Run `npm run changeset` after a user-facing package change.
2. Commit the generated file under `.changeset/` with the implementation.
3. On the same branch, run `npm run release:status` and then `npm run version-packages`.
4. Commit the generated version/package-lock changes and the consumed/deleted changeset file.
5. Merge that PR to `main`.
6. Trigger the `Release` workflow once against `main`; it should publish because no version diff remains.

Use the immediate flow only when the PR is ready to publish right after merge. For multiple pending release PRs, use the recommended workflow-managed version PR so Changesets can combine everything cleanly.

Local fallback flow:

1. Run `npm run changeset` after a user-facing package change.
2. Commit the generated file under `.changeset/` with the implementation.
3. Run `npm run release:status` to review the pending release plan.
4. Run `npm run version-packages` when you are ready to cut versions locally. This also syncs the repo-level release version in the root `package.json`.
5. Run `npm run release:publish` to build, publish, and create the local repo release tag.
6. Run `npm run release:tag:push` to push the repo release tag.

The GitHub workflow still depends on the same Changesets files, so both paths stay aligned. The root repo version is a Terajs release marker: it must advance on every publishable release and must never fall behind the highest public package version.

Trusted publishing is configured on npm package settings, not by adding an `NPM_TOKEN` secret to GitHub.

Valid Changeset files look like this:

```md
---
"@terajs/devtools": minor
"@terajs/app": minor
---

Add explicit VS Code bridge lifecycle helpers and app-facing re-exports.
```

An empty frontmatter block does not schedule a package release. If a note does not need to bump any package, keep it out of `.changeset/`.
