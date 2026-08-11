# Threshold Studio Frontend

[![Frontend CI](https://github.com/theghost024jr-sys/Threshold-Studio-Frontend/actions/workflows/test.yml/badge.svg)](https://github.com/theghost024jr-sys/Threshold-Studio-Frontend/actions/workflows/test.yml)
[![Node Source CI](https://github.com/theghost024jr-sys/Threshold-Node-Source/actions/workflows/test.yml/badge.svg)](https://github.com/theghost024jr-sys/Threshold-Node-Source/actions/workflows/test.yml)

Public static frontend for [thresholdstudiowebsite.org](https://thresholdstudiowebsite.org).

## Repository Boundary

- `website/`: deployable HTML, CSS, JavaScript, assets, configuration, and frontend tests
- `worker.js`: frontend edge worker retained for the Cloudflare deployment
- `.github/workflows/test.yml`: frontend regression validation

Architecture sources, vault history, builders, publication tools, and the Node Gate Worker are owned by [Threshold-Node-Source](https://github.com/theghost024jr-sys/Threshold-Node-Source).

The complete ownership rules are defined in [REPOSITORY_CONTRACT.md](REPOSITORY_CONTRACT.md).

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `website`
- Runtime version: Node.js 22 or newer

`wrangler.toml` and `package.json` are the versioned build manifest. The site is static, so the build validates the deployable directory without copying or rewriting it.

## Validation

```powershell
npm run build
npm test
```

Cloudflare serves the public site. Secrets and domain configuration remain managed outside this repository.