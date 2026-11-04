# Obsidian Design Asset Manifest

This is a repository-local reference for Obsidian Copilot. It identifies design
assets without copying, publishing, or making Obsidian an implementation
authority. The repository paths remain the source of truth.

## Canonical Threshold brand asset

| Purpose | Canonical repository path | Notes |
|---|---|---|
| Threshold Root Sigil | `website/assets/entry/threshold-logo.svg` | Canonical frontend sigil. The SVG identifies itself as a radial world-tree/Fib-Flower threshold mark. |

## Duplicate and non-brand logo assets

| Path | Status | Notes |
|---|---|---|
| `website/assets/logo/threshold-logo.svg` | Duplicate | Byte-identical to the canonical Root Sigil. Do not introduce a second visual variant; frontend code should continue using `assets/entry/threshold-logo.svg`. |
| `website/assets/logo.png.import` | Import metadata only | Godot import record for an absent `logo.png`; not a browser-renderable logo asset. |
| `website/portal/src/assets/react.svg` | Tooling asset | React branding; not Threshold artwork. |
| `website/portal/src/assets/vite.svg` | Tooling asset | Vite branding; not Threshold artwork. |

The two `threshold-logo.svg` files have the same SHA-256:

```text
BDACBEF855CDBAF81A20ACB508A4549F6CA70757596738AD8DDECFDED8DA6493
```

## Shared public-site stylesheets

All paths below are repository paths rooted at `C:\Threshold`.

| Stylesheet | Primary concern |
|---|---|
| `website/styles/access-flow.css` | Shared responsive path/wayfinding drawer |
| `website/styles/beyond.css` | Beyond gateway |
| `website/styles/canonical-path.css` | Canonical world-path emphasis |
| `website/styles/complexity-layers.css` | Shared visual complexity/motion contract |
| `website/styles/destination-page.css` | First-level destination rendering |
| `website/styles/dialogues.css` | Dialogues chamber |
| `website/styles/ella-immersive.css` | Ella world-stage |
| `website/styles/ethos-root.css` | Ethos chamber |
| `website/styles/garden-evidence.css` | Garden evidence treatment |
| `website/styles/glyph-archive-node.css` | Glyph archive node |
| `website/styles/glyph-system.css` | Glyph-system presentation |
| `website/styles/glyphs.css` | Glyph archive |
| `website/styles/housegarden.css` | House and Garden |
| `website/styles/hub-interaction.css` | Hub interaction layer |
| `website/styles/immersive.css` | Shared immersive page treatment |
| `website/styles/invitation-sanctuary.css` | Invitation sanctuary |
| `website/styles/learning-wheel.css` | Learning Wheel |
| `website/styles/living-page.css` | Vault-backed living pages |
| `website/styles/mythology-viewer.css` | Mythology viewer |
| `website/styles/node-editor.css` | Node editor |
| `website/styles/node-field.css` | Node Field |
| `website/styles/pulse.css` | Shared pulse treatment |
| `website/styles/spoke-shell.css` | Spoke shell |
| `website/styles/spoke-tabs.css` | Spoke navigation |
| `website/styles/styles.css` | Base public-site styles |
| `website/styles/weather-engine.css` | Weather engine |
| `website/styles/world-map.css` | World Map |

## Portal stylesheets

| Stylesheet | Primary concern |
|---|---|
| `website/portal/src/App.css` | Portal application layout and route presentation |
| `website/portal/src/index.css` | Portal global/base styles |

## Use in Obsidian

When a Canvas node or implementation packet references design material, record:

```yaml
repo:
  canonicalSigil: website/assets/entry/threshold-logo.svg
  styles:
    - website/styles/housegarden.css
    - website/styles/canonical-path.css
```

This is a reference to implementation evidence, not permission for Obsidian
metadata to rewrite repository assets or CSS. Any proposed visual change still
requires an implementation packet and repository reconciliation.
