# Threshold Vault Holding

This directory is cold storage for preserved material that is not required by the deployed website.

Cloudflare Pages publishes only `website/`. Nothing under `vault-holding/` is part of the active website or downloaded by visitors.

## Rules

1. Move material here intact; do not merge historical versions.
2. Record every move in `manifest.json`.
3. Keep runtime HTML, CSS, JavaScript, config, and referenced assets under `website/`.
4. Restore an artifact with `git mv` when it becomes an active dependency again.
5. Treat frozen `source.html` files and Git-history snapshots as read-only provenance.

## Contents

- `website-history/house-and-garden`: House & Garden versions, prototypes, and Fibonacci design manifests.
- `website-history/spoke-wheel`: deduplicated source snapshots and per-spoke provenance manifests.