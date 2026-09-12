# Threshold System Contract

This contract defines the canonical local source and the boundary between private vault content, generated build products, and the public website.

## Path Authority

`C:\Threshold\threshold.config.json` is the only path authority. Its canonical vault is:

`C:\Users\James Romeo\Threshold\ThresholdVault\theghost`

Builders, scripts, tools, the world, node bundles, and the website must resolve their paths through that configuration. They must not depend on OneDrive, ghost vault copies, `vault-holding`, audit trees, `C:\Threshold\vault`, or `C:\Threshold\threshold\ThresholdVault`.

## Source Ownership

- The canonical vault owns private notes, `_publish` notes, and source media.
- `C:\Threshold\tools` owns vault scanning and bundle generation.
- `C:\Threshold\website` owns browser and edge code plus generated public inputs.
- `C:\Threshold\world` owns generated source metadata for world integrations.
- `C:\Threshold\node-bundles` owns generated activation bundles.
- `C:\Threshold\html-inventory` is preserved and is not rewritten by normal builds.

## Publication Boundary

The build may publish only:

1. Bodies of Markdown notes under the vault's `_publish` directory.
2. Media explicitly referenced by those published notes.
3. Title, relative path, and identifier metadata for the full vault index.
4. Aggregate counts and canonical source metadata.

The build must not copy the raw vault, `.obsidian` state, private note bodies, credentials, environment files, or unrelated media into the system or website.

## Generated Products

- `website/data/threshold-vault.json`: public note data and resolved asset metadata
- `website/data/vault-index.json`: metadata-only full-vault index
- `website/assets/vault/`: media referenced by published notes
- `world/vault-source.json`: world-facing source metadata
- `node-bundles/`: generated canonical bundle families

## Change Rules

1. Change paths in `threshold.config.json`, not independently in consumers.
2. Generate public data at build time; browser code must not access local filesystem paths.
3. Resolve source media from the canonical vault and retain its relative provenance in generated metadata.
4. Do not move, mirror, or delete the canonical vault as part of a website build.
5. Keep tests with the builder or browser integration they validate.