# Obsidian Markdown → Threshold Studio Portal

**Status:** Implemented  
**Content source:** The canonical vault path configured in `threshold.config.json`  
**Website app:** `Website/portal`

## Purpose

This document describes how published Obsidian Markdown reaches the Threshold
Studio Portal. The pipeline exports content at build time and bundles the
Archive's chamber records into the React application. The browser does not read
the vault or request the generated vault JSON at runtime.

## Data flow

```text
Canonical vault
  └─ _publish/
       └─ published Markdown + referenced media
            ↓
npm run build:data
  ├─ Website/data/threshold-vault.json
  ├─ Website/data/vault-index.json
  ├─ Website/assets/vault/
  ├─ world/vault-source.json
  └─ node-bundles/
       ↓
Portal Vite build
  └─ statically imports chambers from threshold-vault.json
       ↓
React Archive renders each Markdown body with react-markdown
```

The exporter is [`tools/build_vault_data.py`](../../../tools/build_vault_data.py).
The Portal's data adapter is
[`src/modules/archive.js`](../src/modules/archive.js), and the visible Archive
is [`src/components/Archive.jsx`](../src/components/Archive.jsx).

## What the Portal uses

The generated `threshold-vault.json` contains several collections. The Portal
statically imports the `chambers` collection and renders each entry's `body`
field. Markdown remains Markdown until `react-markdown` renders it in the
Archive. Entries are displayed in collapsible panels, with at most eight shown.

The import is a build-time dependency:

```js
import { chambers } from "../../../data/threshold-vault.json";
```

There is no browser `fetch()` for this data. The generated JSON must therefore
exist before Vite starts or builds; the documented commands run the exporter
first.

## What is exported

| Output | Contents |
| --- | --- |
| `Website/data/threshold-vault.json` | Eligible published note records and Markdown bodies; chamber, node, and entity collections; counts and other generated metadata |
| `Website/data/vault-index.json` | Metadata for visible Markdown notes not marked unpublished or draft: identifiers, titles, and relative paths |
| `Website/assets/vault/` | Media resolved from references in published notes |
| `world/vault-source.json` and `node-bundles/` | Additional generated products used by the wider Threshold build |

**Content boundary:** Markdown bodies and resolved media are selected from
`_publish`, excluding notes explicitly marked `publish: false` or `draft: true`.
The exporter does not copy the raw vault directory into the Portal.

**Filesystem privacy:** Public website JSON omits machine-specific absolute
vault and publish roots. The engine-side `world/vault-source.json` is a separate
build artifact, not part of the website output.

**Metadata boundary:** `vault-index.json` may include title and relative-path
metadata for eligible Markdown notes outside `_publish`, but excludes notes
explicitly marked `publish: false` or `draft: true`. The `threshold-vault.json`
export also contains a list of visible translation file paths. Treat these
generated files as public website data and review their metadata before
publishing. Hidden/system directories excluded by the exporter are not a
substitute for marking a note private; keep private material out of public
metadata surfaces.

## Commands

Run commands from `C:\Threshold` unless a different working directory is shown.

| Command | Behavior |
| --- | --- |
| `npm run build:data` | Export the configured vault's published data and build node bundles |
| `npm --prefix website/portal run dev` | Sync data, then start the Portal's Vite development server |
| `npm --prefix website/portal run build` | Sync data, build the Portal, and copy its static shell |
| `npm run build` | Export once, build the Portal, then assemble the Pages output |
| `npm run dev` | Export and build the Portal, then start the local Cloudflare Pages server |

The Portal package also has a `build:site` script for orchestration after the
root build has already synchronized data; it deliberately does not run the
export a second time.

## Operating rules

- Change the canonical vault location in `threshold.config.json`; do not add a
  second path source or load credentials from another `.env` file.
- Keep publishing intentional: put website-ready notes in `_publish` and
  reference only assets intended for publication.
- Do not replace this exporter with a recursive full-vault copy. In particular,
  do not copy `.obsidian`, trash, private notes, or unrelated media into the
  website.
- Do not edit generated JSON by hand. Update the source Markdown and rerun the
  appropriate build command.
- `react-markdown` is used without a raw-HTML plugin; embedded raw HTML is not
  enabled as HTML rendering.

## Troubleshooting

1. **A note is missing from the Archive:** confirm it is under the canonical
   vault's `_publish` directory and has the metadata required by the exporter.
2. **An edit is not visible:** rerun the data sync or restart the Portal dev
   command, then check the generated `Website/data/threshold-vault.json`.
3. **Vite cannot resolve the JSON import:** run the Portal through its `dev` or
   `build` script so the sync step creates the generated file first.
4. **An asset is missing:** confirm the published note references the asset and
   that the exporter can resolve it from the canonical vault.

## Related references

- [`threshold.config.json`](../../../threshold.config.json) — canonical path
  configuration
- [`REPOSITORY_CONTRACT.md`](../../../REPOSITORY_CONTRACT.md) — repository
  ownership and publishing boundaries
- [`Website/portal/README.md`](../README.md) — Portal quick start
- [`package.json`](../../../package.json) — root build and development scripts
