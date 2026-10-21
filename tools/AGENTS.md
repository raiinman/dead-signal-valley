# Tools

## Purpose

Run and publish the current static town without hidden machine dependencies.

## Ownership

serve.mjs is a localhost-only Node standard-library server. write-manifest.mjs and verify-runtime.mjs maintain deployed file identity. deploy-cpanel.sh validates the runtime, preserves hosting configuration, switches the document root and keeps a private rollback directory.

## Local Contracts

Serve only the dist subtree. Use no runtime API secrets or third-party packages. Keep deployment source outside the public document root; publish only dist contents. Preserve rollback copies and restore the original root if the final switch fails.

## Work Guidance

Use the server for offline development and the documented hosting terminal for deployment. Keep release identity tied to a reviewed Git commit.

## Verification

Run package tests, manifest verification and a local HTTP smoke check. Before production changes, validate every runtime file; after deployment verify HTTPS, model delivery and actual browser play.

## Child DOX Index

None.
