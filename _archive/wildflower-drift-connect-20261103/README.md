# Connect the Wildflower Drift — 2026-11-03

## Why

`website/wildflower-drift.html` is a finished 16,559 B page (177 lines): an
"Ephemeral Field · Mist / Air boundary" with a starfish-to-mist-seam drag, three
field readings (Anchors / Drift / Silence field), a blossom layer, a drift stream,
and a closing landing section.

It had **zero inbound links**. It was reachable only by typing the URL.

The vault already holds its canon, twice:

- `backend/02 - World/01 - Biomes/Wildflowers.md`
- `backend/03 - Organism/03 - Motion/01 - Substrates/Time Organ/02 - Form/13 - Environments/03 - Environments/Ephemeral Fields/Wildflowers.md`

Both say: *Ephemeral Field — Environmental Substrate Artifact*; *a gentle,
non-collapse field where resonance is high but pressure is low*; *poppies = vivid
memory anchors, dandelion seeds = drift vectors*; *composition = containment
without compression*; *best placed near Mist-Air boundary zones*.

The page implements that note. The note was never connected to the page.

`website/garden.html` is the Garden organ — a 40-line page whose middle card reads
"A living field where response becomes pattern and pattern becomes form." That card
was an inert `<article>`. It is the correct parent: `world-topology.json` declares
`garden` as a leaf with `connectsTo: ["world-map", "house-garden"]` and no child.

## What changed

Four live files. Nothing deleted.

### 1. `website/garden.html` line 33

Before:

```html
      <article class="field field--garden"><h2>Garden</h2><p>A living field where response becomes pattern and pattern becomes form.</p></article>
```

After:

```html
      <a class="field field--garden field--link" href="wildflower-drift.html"><h2>Garden</h2><p>A living field where response becomes pattern and pattern becomes form.</p><span class="field__enter">Enter the Wildflower Drift</span></a>
```

### 2. `website/wildflower-drift.html` line 73

Before:

```html
    <header class="topbar"><a href="index.html">Return to Hub</a><span>Ephemeral Field · Mist / Air boundary</span></header>
```

After:

```html
    <header class="topbar"><a href="garden.html">Return to the Garden</a><span>Ephemeral Field · Mist / Air boundary</span></header>
```

Reason: the Drift is now a child of the Garden. Returning to `index.html` from a
Garden entry is a one-way door — you enter from one place and land in another.

### 3. `website/config/world-topology.json`

`garden.connectsTo` gains `"wildflower-drift"`, and one new place is appended
before the closing `]` of `places`:

```json
    { "id": "wildflower-drift", "label": "Wildflower Drift", "route": "/wildflower-drift.html", "classification": "KEEP", "containedBy": "garden", "connectsTo": ["garden"], "returnsTo": "garden", "passage": { "mode": "open" } }
```

`world-topology-contract.js` L82–91 requires every seam to be bidirectional, so
the `garden.connectsTo` edit is mandatory, not cosmetic.

### 4. `website/styles/garden-evidence.css`

Appended `.field--link` rules: an anchor styled as a card needs `display: block`,
`text-decoration: none`, `color: inherit`, and a visible focus ring. Without them
the card collapses to inline height and loses its 170px floor.

## Verify

```powershell
cd C:\Threshold
node --test website/tests/world-topology.test.mjs
node --test website/tests/garden-portal.test.mjs
npm test
```

Expected: topology test passes (`validateWorldTopology` runs on load, and the
bidirectional-seam loop covers the new edge); `garden-portal.test.mjs` L18 still
finds `src="/assets/entry/threshold-logo.svg"` in `garden.html`; full suite
unchanged at the known 5 failures.

Orphan check:

```powershell
node "C:\Users\James Romeo\OneDrive\theghost\outputs\link-scan\orphans.mjs"
```

`wildflower-drift.html` should drop from `0 ORPHAN` to `1 <- garden.html`.

## Undo

```powershell
cd C:\Threshold
Copy-Item _archive\wildflower-drift-connect-20261103\garden.html website\garden.html -Force
Copy-Item _archive\wildflower-drift-connect-20261103\wildflower-drift.html website\wildflower-drift.html -Force
Copy-Item _archive\wildflower-drift-connect-20261103\world-topology.json website\config\world-topology.json -Force
Copy-Item _archive\wildflower-drift-connect-20261103\garden-evidence.css website\styles\garden-evidence.css -Force
```

The four archived files below are byte copies taken before any edit.

## Result (run 2026-11-03)

- `website/tests/world-topology.test.mjs` — 2/2 pass. `validateWorldTopology` accepted
  the new place; the bidirectional-seam loop (L82–91) covers `garden ↔ wildflower-drift`.
- `website/tests/garden-portal.test.mjs` — 1/1 pass. The logo assertion still holds.
- `npm test` — 196 tests, 190 pass, 5 fail. Identical to the pre-change baseline. No regression.
- Orphan scan — `wildflower-drift.html` moved from `0 ORPHAN` to `1 <- garden.html`.
  Live orphans: 11 → 10.

## Not changed, and why

- `garden.html` L30 says "Return to Hub" and points at `hub.html`. But
  `world-topology.json` declares `garden.returnsTo: "house-garden"`. The live page
  and the declaration already disagree. This predates the change and is a separate
  ruling. (Before this change the Drift also said "Return to Hub" while pointing at
  `index.html` — a third destination for the same label. That one is now gone, but
  `garden.html` still carries the contradiction.)
- `wildflower-drift` is absent from `config/threshold-vault.json` (21 nodes). That
  file is a separate identity scheme and is already out of step with topology.
- The page's `Silence field` reading says "The diagram is linked here, but has not
  yet taken form." The vault has `Silence Field Diagram` as a link target; no such
  file exists in the repository. Left as written.

## Provenance

- Link scan: `outputs/link-scan/dead-links.mjs` → `dead-links.txt`. 54 HTML files,
  33 unresolved targets. 30 are inside `echoes/inventory/` (frozen snapshots whose
  relative paths never resolved), 2 are the Vite dev entry `/src/main.jsx` and a
  missing `/portal/favicon.svg`, 1 is `/portal/shimmer` — which **is** a registered
  route (`portal/src/App.jsx` L65), so not dead.
- Orphan scan: `outputs/link-scan/orphans.mjs` → `orphans.txt`. 36 live pages,
  11 with zero inbound.
- `wildflower-drift.html` measured at 16,559 B / 177 lines; 0 inbound before.
