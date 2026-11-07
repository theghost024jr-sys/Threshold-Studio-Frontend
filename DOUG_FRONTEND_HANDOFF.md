# Doug Frontend Handoff

**Audience:** Doug / Obsidian-side design and world reconciliation  
**Repository:** `theghost024jr-sys/Threshold-Studio-Frontend`  
**Vault used for frontend provenance reconciliation:** `C:\Threshold\theghost`  
**Live-site check:** `https://www.thresholdstudiowebsite.org/` returned HTTP 200
on 2026-11-03. This confirms reachability only; it does not prove that every
local, uncommitted frontend change is deployed.

## Authority boundary

Obsidian owns world meaning, canonical geography, intended relationships,
design decisions, and implementation-packet intent. The repository owns
routes, runtime behavior, Engine boundaries, styles, assets, tests, Worker
behavior, and deployment. Neither side silently changes the other.

## Frontend route model

| Surface | Route | Current responsibility |
|---|---|---|
| Main Hub | `/index.html` | Entry to the world; the House and Garden first crossing is Engine-authorized. |
| Return Hub | `/hub.html` | Return-state presentation and onward Portal seams. |
| Canonical authored path | `/index.html` -> `/housegarden.html` -> `/environment/herbroom.html` -> `/environment/basin.html` -> `/environment/old-forest.html` | Canonical introductory geography. |
| Forest continuation | `/portal/cabin-of-moss` | Canonical Old Forest geography; must remain a real route rather than a speculative destination. |

`/hub-return.html` is **retired**, not transitional. The file is absent from `website/`, and
`website/tests/destination-routing.test.mjs` L156–167 asserts its absence (`ENOENT`) — PROVEN BY TEST.
Return-state behaviour now lives in `hub.html` (`data-hub-return-reading`, `scripts/hub-return-state.js`).

### Crossing authority

Only the Main Hub's first crossing is Engine-gated:

```text
accepted + responded:true  -> state-changed -> House and Garden navigation
accepted + responded:false -> recorded-only -> no navigation
rejected/unavailable       -> no navigation
```

Herb Room -> Basin -> Old Forest, Herb Room -> Waterfall, and forest
continuations are authored traversal. They must not be hidden, disabled, or
erased because activation or an API request fails.

## Recent frontend implementation evidence

### Main Hub authority

- Replaced the deleted Main Hub Engine import with a tested boundary:
  `engine-interface` -> Main Hub adapter -> Main Hub runtime -> DOM binding.
- The runtime navigates only after the Engine reports an authoritative state
  change. It preserves rejected, unavailable, and recorded-only outcomes as
  distinct non-navigation states.
- Tests cover the adapter status matrix, runtime navigation consequences,
  malformed/transport outcomes, and canonical node-registry use.

### Route and world-surface audit

- [PUBLIC_ROUTE_AUDIT.md](./PUBLIC_ROUTE_AUDIT.md) inventories the deployed
  route surface, route ownership, activation/return semantics, orphan status,
  and legacy/experimental surfaces.
- The audit established that deployment geography is broader than the intended
  navigation surface; direct static assets, generated pages, templates, and
  inventory mirrors need explicit policy rather than implicit exposure.
- `/portal/index.html` is a legacy compatibility concern because the Portal
  SPA's registered root is `/portal/`, not `/portal/index.html`.

### Wayfinding and chamber continuity

- Shared access flow was made responsive so it does not cover mobile chamber
  content.
- Herb Room's eastward seam has keyboard support.
- Herb Room needs to preserve visible, authored routes to both Basin and
  Waterfall on every viewport.
- Old Forest belongs to the actual Portal forest progression; do not flatten
  its existing Trek/Lanternroot/Cabin relationships into an invented direct
  topology without reconciliation.

### Herb Room design constraints

- West Window is a glimpse of a **possible** Garden, never a guaranteed
  destination, quest marker, or prediction.
- Presentation may change, but that possibility invariant may not.
- The Step Through experience may gain a threshold/door presentation while
  retaining the same authored Basin route and track-only progression meaning.
- A design packet must audit existing wind, chime, media, threshold, and
  mobile behavior before commissioning replacements.

## Image provenance — measured against the live vault

**Scope.** Every image filename referenced from `website/**/*.{html,css,js,jsx,ts,tsx}`, excluding
`node_modules`, `portal-dist`, `generated-pages`, and `_archive`. Each reference was joined to the
**live** vault `C:\Users\James Romeo\OneDrive\theghost` by SHA-256, then re-joined by normalised
stem where the filename differed. 42 distinct referenced filenames.

**Vault size at audit:** 631 image files (3,921 files total). `C:\Threshold\theghost` is a stale
mirror holding 608 images across 3,508 files, and must not be used as the comparison root.

| Result | Count | Meaning |
|---|---|---|
| Exact name **and** exact bytes | 10 | Provenance verified |
| Exact bytes, different vault filename | 12 | Provenance verified; the repo renamed the file |
| Repository only | 14 | No copy in the live vault under any name |
| No such file anywhere | 0 | See the correction below |

### Verified — exact name and exact bytes (10)

| Frontend asset | Verified vault source |
|---|---|
| `website/portal/src/assets/abeach.png` | `backend/02 - World/04 - Environments/abeach.png` |
| `website/portal/src/assets/doug.png` | `backend/99 - Reference/Doug/Doug.png` |
| `website/assets/beyond/Ella.png` | `backend/99 - Reference/Characters/Ella.png` |
| `website/assets/beyond/Ellaheard.png` | `backend/99 - Reference/Characters/Rohg/Ellaheard.png` |
| `website/portal/src/assets/raft.png` | `backend/99 - Reference/Symbols & Seals/raft.png` |
| `website/portal/src/assets/rohg.png` | `backend/99 - Reference/Characters/Rohg/rohg.png` |
| `website/assets/glyphs/thread.png` | `engine/20 - Threshold/World/Substrates/Symbolic Substrate/Invocation Glyphs/thread.png` |
| `website/portal/src/assets/tideshellmoon.png` | `backend/04 - Species/04 - Species Families/tideshellmoon.png` |
| `website/portal/src/assets/universebeach.png` | `backend/99 - Reference/16 reference/universebeach.png` |
| `website/assets/vault/velinsignalobject.png` | `backend/04 - Species/02 - Characters/velinsignalobject.png` |

### Verified — identical bytes, different vault filename (12)

These are **not** unprovenanced. The repository renamed them; the bytes are identical.

| Frontend asset | Vault file with identical bytes |
|---|---|
| `dialoguesvelin-001-velin.png` | `backend/04 - Species/02 - Characters/velin.png` |
| `dougs-marigold.png` | `backend/99 - Reference/Doug/dougsmarigold.png` |
| `fog.png` | `backend/03 - Organism/.../03 - Environments/violetfog.png` |
| `invitationafieldofwildflowe-001-a-field-of-wildflowe.png` | `backend/02 - World/04 - Environments/A field of wildflowe.png` |
| `ocean-bubble.png` | `backend/03 - Organism/.../Natural/Elemental/Ocean Bubble.png` |
| `ocean-depth.png` | `backend/03 - Organism/.../Natural/Elemental/Ocean.png` |
| `ocean-fractal.png` | `backend/03 - Organism/.../Natural/Elemental/Ocean Fractal.png` |
| `rohg-calm.png` | `backend/99 - Reference/Characters/Rohg/rohgcalm.png` |
| `ruin-crows.png` | `backend/03 - Organism/.../Ruins/Species/Ruin Crows.png` |
| `soil.png` | `backend/03 - Organism/.../Environmental Phenomena/thesoil.png` |
| `the-returning.png` | `backend/03 - Organism/06 - Species/Species-Linked Artifacts/The Returning.png` |
| `weather-038-herbroom.png` | `backend/03 - Organism/.../Memory Rooms/herbroom.png` |

### Repository only — no vault copy under any name (14)

| Frontend asset | Uses | Note |
|---|---|---|
| `threshold-logo.svg` | 29 | Most-referenced asset on the site; repo-owned by definition |
| `basin.png` | 3 | The Basin page's image; no vault source |
| `cabin.png` | 3 | `portal/src/assets/`; `A Rustic Wooden Cabin.png` exists but is **not** the same bytes |
| `ethos-field.png` | 2 | `portal/src/assets/` |
| `expand.png` | 2 | `vault/glyphs/` |
| `5b8218c41ed2.png` | 1 | Content-addressed name in `assets/vault/`; no vault file has these bytes |
| `beetle-percussion.png` | 1 | `portal/src/assets/` |
| `cabin-of-moss.png` | 1 | `portal/src/assets/` |
| `cindervox-canyon.png` | 1 | `portal/src/assets/`; `cindervox.png` exists but is not the same bytes |
| `collapse.png` | 1 | `vault/glyphs/` |
| `drift-falls-panorama.png` | 1 | `assets/images/` |
| `quiverbright-hawk.png` | 1 | `portal/src/assets/` |
| `ruins-of-velin.png` | 1 | `portal/src/assets/` |
| `wildflower-drift.png` | 1 | `assets/` |

### Correction — the five "dynamic" references were a regex artefact

An earlier pass listed `asset.webp`, `card.image.webp`, `card.story.webp`, `item.webp`, and
`value.webp` as unresolved dynamic references. **They are not image references.**
`website/scripts/spoke-shell.js` L130–131 reads `card.image.webPath` and `card.story.webPath`; the
filename pattern matched `.webp` inside `.webPath`. The static surface contains **zero** unresolved
image references.

## Known conflict — the Engine door, 2026-11-03

The "Enter Engine" door was removed from `index.html` and `hub.html`. It was the only link to
`deep-system/engine.html`, which renders an Engine Telemetry Matrix and calibration sliders — a
makers' instrument, not a room.

Consequence: **no file in `website/` now links to `deep-system/engine.html`.** It is reachable by
direct URL only.

But `website/config/world-topology.json` L9 still declares:

```json
{ "id": "engine", "containedBy": "hub", "connectsTo": ["hub"], "returnsTo": "hub", "passage": { "mode": "open" } }
```

So the declared topology still calls the Engine a Hub spoke while no surface links it. This
contradiction is unresolved and needs a ruling: either the node leaves `world-topology.json`, or the
Engine gets a door on the makers' surface, or the removal is reverted.

## CSS and brand handoff

The full stylesheet and logo inventory is in
[OBSIDIAN_DESIGN_ASSET_MANIFEST.md](./OBSIDIAN_DESIGN_ASSET_MANIFEST.md).

The canonical frontend brand asset is:

```text
website/assets/entry/threshold-logo.svg
```

`website/assets/logo/threshold-logo.svg` is byte-identical and should remain a
compatibility duplicate rather than a competing brand source.

## Required reconciliation before new implementation

For any substantial world change, issue an implementation packet containing:

```text
packet ID
ready-for-repo status
canonical terminology
design intent and player-visible behavior
route and activation intent
preserve / do-not-change constraints
acceptance criteria
known repo context
```

Repository implementation then reports:

```text
design intent
repository reality
preserved existing structure
unknowns / conflicts
proposed delta
changed files
tests and live-route evidence
Engine-contract impact
```

No possibility may become a promised destination, no presentation layer may
claim Engine authority, and no existing authored route may disappear because an
unrelated activation or API boundary fails.
