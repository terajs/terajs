# Releasing Terajs

Terajs now uses Changesets for versioning and package release prep.

## Local flow

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

## Automated flow

The workflow in `.github/workflows/release.yml` uses Changesets on `main`.

- With pending `.changeset/*.md` files, it opens or updates a version PR.
- After the version PR lands on `main`, it publishes the updated public packages.

To enable publishing from GitHub Actions, set the repository secret `NPM_TOKEN`.