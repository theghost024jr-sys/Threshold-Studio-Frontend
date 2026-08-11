# Threshold Repository Contract

This contract defines the ownership boundary between the public frontend and the private Node source repository. Changes that move a responsibility across this boundary must update both repositories and their deployment workflows in the same migration.

## Threshold-Studio-Frontend

This repository owns only public, deployable browser and edge code:

- `website/`: static HTML, CSS, JavaScript, public assets, configuration, and frontend tests
- `worker.js`: the frontend edge worker
- Cloudflare Pages build configuration and frontend CI
- Documentation needed to build, test, and operate the public frontend

This repository must never contain:

- An Obsidian vault, `.obsidian/` state, or raw vault exports
- `website/assets/vault/`, `vault-archive.json`, or `vault-index.json`
- Architecture source, node builders, publication tools, or activation bundles
- Node Gate Worker source or its Wrangler configuration
- Credentials, environment files, private media, or generated deployment output

## Threshold-Node-Source

This repository owns private architecture and node publication source:

- Architecture indexes, topology, builders, and validation tools
- Vault history and publication manifests
- Vault export and node bundle publication tools
- Node Gate Worker source, configuration, tests, and deployment workflows

This repository must never contain:

- The public website implementation from `Threshold-Studio-Frontend/website/`
- Generated activation bundles, copied vault media, or raw local vault contents
- Credentials, environment files, or Wrangler state

Vault exports and activation bundles are generated locally or in CI and published to their private storage targets. They are not committed to either repository.

## Deployment Ownership

| Surface | Owner | Build or publication path |
| --- | --- | --- |
| Public static site | `Threshold-Studio-Frontend` | `npm run build` -> `website/` |
| Frontend edge worker | `Threshold-Studio-Frontend` | `worker.js` |
| Fib 1 foundation | `Threshold-Node-Source` | `threshold/publish/core/` |
| Node Gate Worker | `Threshold-Node-Source` | `threshold/worker/` |
| Activated node bundles and private media | External private storage | Node-Source publication workflows |

## Change Rules

1. Do not commit generated or private content to make a deployment pass.
2. Move ownership losslessly: add and validate the destination before deleting the source.
3. Keep tests with the code or publication tool they validate.
4. Treat changes to this contract as architecture changes and review both repositories.