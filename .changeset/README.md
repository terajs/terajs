# Changesets

Use Changesets for package versioning and release prep in this repo.

Recommended release flow:

1. Run `npm run changeset` after a user-facing package change.
2. Commit the generated file under `.changeset/` with the implementation.
3. Make sure npm trusted publishing is configured for the published packages and points to the `release.yml` workflow in this repo.
4. Trigger the `Release` GitHub Actions workflow against `main`.
5. If pending Changesets exist, open or refresh the version PR from the `changeset-release/main` branch the workflow pushes.
6. Trigger the `Release` workflow again to publish the updated packages.

Local fallback flow:

1. Run `npm run changeset` after a user-facing package change.
2. Commit the generated file under `.changeset/` with the implementation.
3. Run `npm run release:status` to review the pending release plan.
4. Run `npm run version-packages` when you are ready to cut versions locally.
5. Run `npm run release:publish` to build and publish the updated packages.

The GitHub workflow still depends on the same Changesets files, so both paths stay aligned.

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