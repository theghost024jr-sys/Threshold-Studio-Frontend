# House & Garden Archive

This directory preserves the distinct House & Garden implementations found across the Threshold repository. It was moved intact from the published `website/` root into cold storage; nothing was merged, deleted, or overwritten.

## Current Authority

- Live reference: `https://threshold-studio-website.theghost024-jr.workers.dev/housegarden`
- Matching source: `C:\Threshold\website\housegarden.html`
- Repository root: `C:\Threshold`
- Git remote: `https://github.com/theghost024jr-sys/Threshold-Studio-Frontend.git`
- Cold-storage entry: `vault-holding/website-history/house-and-garden/index.html`

The archive index links to `website/housegarden.html` as the current version. It does not replace the existing Worker route.

## Preserved Chambers

### `v1-legacy-rooms`

Source: `C:\Threshold\garden`

The standalone room-based garden with its own HTML, CSS, and JavaScript. The three copied files are byte-identical to their sources.

### `v2-inline-flower`

Source: commit `cdcf81b`, paths `housegarden.html`, `styles/`, and `scripts/`.

This is the earliest recoverable full House & Garden snapshot in Git. It contains an inline flower/chamber layout and a vine layer. `housegarden.html` and `source.html` retain the exact commit bytes. `index.html` changes navigation URLs only so the archived page can return to the owning website.

### `v3-worker-current`

Source: `C:\Threshold\website\housegarden.html` and its current `styles/`, `scripts/`, `config/`, and `vault/` dependencies.

`source.html` is byte-identical to the current Worker-matching source. `index.html` localizes the Vault dependency and points navigation back to the owning website. The current page includes both chamber/shaper behavior and the vine canvas; these were not separate recoverable commits.

### `prototype-core`

Source: `C:\Threshold\threshold\core\housegarden.html`, `css/`, and `js/`.

This activation-driven shell is preserved as a prototype, not labeled as a visual era.

## Integrity Checks

Verified SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `v1-legacy-rooms/index.html` | `7B4735B6C5DA4C61C1F5487E36A88D5E16DA48DF43A0FEB74AD49AA896567F68` |
| `v1-legacy-rooms/Garden.css` | `4A95656057EC1A59F970741AB8BAA5338B3E043779DA6BF3A7C3FF7E108456DE` |
| `v1-legacy-rooms/Garden.js` | `5B1B9844521B53D9260F49CB3CBE893D724B24E7800EAC099AF3A5F6DC63884C` |
| `v2-inline-flower/source.html` | `E517AC4DE3A2B69766F6BF611529805E3B61EF2770BAF42B4A6C4838C355C2CD` |
| `v3-worker-current/source.html` | `A5F18F18C7AB41469247D317600129D57E2FFF8E95249BF51454A3EC96265F5B` |

## Preservation Rules

1. Treat `source.html`, `housegarden.html`, and copied era assets as frozen artifacts.
2. Make archive-runtime fixes only in each era's `index.html`.
3. Build reusable modules outside the frozen era folders.
4. Do not infer a new visual-era label without a source path, commit, or captured page proving that version existed independently.