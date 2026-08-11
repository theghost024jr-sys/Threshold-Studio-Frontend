# Threshold Studio Frontend

Public static frontend for [thresholdstudiowebsite.org](https://thresholdstudiowebsite.org).

## Repository Boundary

- `website/`: deployable HTML, CSS, JavaScript, assets, configuration, and frontend tests
- `worker.js`: frontend edge worker retained for the Cloudflare deployment
- `.github/workflows/test.yml`: frontend regression validation

Architecture sources, vault history, builders, publication tools, and the Node Gate Worker are owned by [Threshold-Node-Source](https://github.com/theghost024jr-sys/Threshold-Node-Source).

## Validation

```powershell
node --test website/tests/*.test.mjs
```

Cloudflare serves the public site. Its Pages project settings are managed outside this repository.