# Changesets

Run `pnpm changeset` for every user-facing package change. Commit the generated Markdown file with the change.

The release workflow maintains a version PR. Merging that PR publishes packages to npm using GitHub Actions OIDC trusted publishing.
