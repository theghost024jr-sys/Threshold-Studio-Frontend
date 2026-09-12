# Threshold

[![Frontend CI](https://github.com/theghost024jr-sys/Threshold-Studio-Frontend/actions/workflows/test.yml/badge.svg)](https://github.com/theghost024jr-sys/Threshold-Studio-Frontend/actions/workflows/test.yml)
[![Node Source CI](https://github.com/theghost024jr-sys/Threshold-Node-Source/actions/workflows/test.yml/badge.svg)](https://github.com/theghost024jr-sys/Threshold-Node-Source/actions/workflows/test.yml)

Local build system and public static frontend for [thresholdstudiowebsite.org](https://thresholdstudiowebsite.org).

## Canonical Layout

- Vault: `C:\Users\James Romeo\Threshold\ThresholdVault\theghost`
- System and builders: `C:\Threshold`
- Public website: `C:\Threshold\website`
- Preserved HTML inventory: `C:\Threshold\html-inventory`
- World metadata: `C:\Threshold\world`
- Generated node bundles: `C:\Threshold\node-bundles`

[`threshold.config.json`](threshold.config.json) is the single path authority. Builders read the canonical vault directly; OneDrive folders, holding vaults, audits, and repository-local vault mirrors are not runtime or build inputs.

## Build Boundary

`npm run build` performs this sequence:

1. Read published notes and referenced media from the canonical vault.
2. Generate `website/data/threshold-vault.json`, `website/data/vault-index.json`, and public referenced media under `website/assets/vault/`.
3. Generate `world/vault-source.json` and the canonical bundle families under `node-bundles/`.
4. Validate the static website and canonical source path.

Only note bodies under `_publish` and media explicitly referenced by those notes enter the website. The full vault index contains title and path metadata only. Raw vault contents remain outside `C:\Threshold`.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `website`
- Runtime version: Node.js 22 or newer

`wrangler.toml`, `package.json`, and `threshold.config.json` are the build manifests. The browser consumes generated JSON and media over HTTP; it never reads the filesystem vault directly.

## Validation

```powershell
npm run build
npm test
```

Cloudflare serves the public site. Secrets and domain configuration remain managed outside this repository.

The complete ownership and generation rules are defined in [REPOSITORY_CONTRACT.md](REPOSITORY_CONTRACT.md).