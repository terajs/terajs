# Changesets

Use Changesets for package versioning and release prep in this repo.

Common flow:

1. Run `npm run changeset` after a user-facing package change.
2. Commit the generated file under `.changeset/` with the implementation.
3. Run `npm run release:status` to review the pending release plan.
4. Run `npm run version-packages` when you are ready to cut versions locally.
5. Run `npm run release:publish` to build and publish the updated packages.

The GitHub release workflow can also create the version PR and publish automatically once `NPM_TOKEN` is configured in repository secrets.