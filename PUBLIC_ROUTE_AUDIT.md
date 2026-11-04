# Public Route Audit

**Scope:** the public GET route surface deployed from `website/` by the
Cloudflare Pages Worker. This audit covers the checked-out output as of
2026-11-03, including directly addressable generated/template artifacts.

## Reading the audit

- **Linked from / Links to** records known site-local navigation. `config`
  identifies routes rendered from a configuration-driven navigation surface;
  `runtime` identifies a route created by JavaScript rather than a literal
  anchor. It does not claim that a route is unreachable merely because there
  is no literal source anchor.
- **Activation** distinguishes a navigation gate from a page-local action.
  `Track only` means direct navigation is possible, but the access-flow
  record will not count the stage unless its prerequisites are present.
- **Engine state** is deliberately narrow: it means a route transition is
  contingent on an Engine result, not that a page can make optional API
  calls or render Engine-derived presentation.
- **Orphaned** means no incoming route is declared by the canonical topology,
  configuration, literal site link, or known runtime navigation. Generated
  inventory pages are evaluated against the actual public surface, not only
  their own mirrored links.
- **Dead link** means the deployed route cannot render its intended page.
  The static-link test validates literal target existence, but it does not
  detect a Worker rewrite to an unregistered SPA route.
- Classifications are evidence-based: **Canonical** is topology/configured
  public content; **Legacy** is an explicit compatibility alias; and
  **Experimental** is transitional, generated, template, or undeclared
  public output.

## Deployment routing

| URL family | Route behavior | Source |
|---|---|---|
| `/portal` and `/portal/*` | Worker returns the Portal SPA shell; `/portal/assets/*` and `/portal/favicon.svg` map to `portal-dist`. | `website/_worker.js` |
| `/world` and `/world/*` | Worker returns the same Portal SPA shell, using the root router basename. | `website/_worker.js` |
| All other static paths | Worker delegates to the Pages asset output. Every HTML file in `website/`, including generated and template directories, is therefore directly addressable unless the Worker intercepts it. | `website/_worker.js`, `wrangler.toml` |

## Canonical and configured static routes

| URL | Page title | Source file | Parent route | Linked from | Links to | Activation required? | Activation condition | Return target | Engine state required? | Orphaned? | Dead link? | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/index.html` | Threshold Hub - Entry | `website/index.html` | - | site-wide returns | `/housegarden.html`, `/glyphs.html` | Yes, for first crossing | `activateNode("housegarden")` accepted **and** `responded === true` | - | Yes: authoritative activation result | No | No | Canonical |
| `/hub.html` | Threshold Hub | `website/hub.html` | `/index.html` | `/ethos.html`, legacy Hub Return routes | Hub spokes, return-state continuation, `/world-map.html`, `/deep-system/engine.html` | No | - | `/index.html` | No | No | No | Canonical |
| ~~`/hub-return.html`~~ | Threshold Hub Return | - | - | - | - | - | - | `/hub.html` | - | - | - | Removed 2026-11-03 (was a redirect stub) |
| `/world-map.html` | World Map - Threshold Studio | `website/world-map.html` | `/index.html` | `/hub.html` | `/index.html`, `/housegarden.html`, `/garden.html`, `/dialogues.html`, `/pages/beyond/Ella.html`, `/portal/` | No | - | `/index.html` | No | No | No | Canonical |
| `/housegarden.html` | Threshold Studio - House and Garden | `website/housegarden.html` | `/index.html` | `/index.html`, Hub/world routes | world chambers and first-level spokes | Yes on canonical entry seam | Main Hub's `state-changed` result; direct URL remains technically loadable | `/index.html` | Yes for the entry crossing only | No | No | Canonical |
| `/garden.html` | House and Garden - Threshold | `website/garden.html` | `/housegarden.html` | House/Garden, map, Return Hub | `/index.html` | No | - | `/housegarden.html` | No | No | No | Canonical |
| `/environment/herbroom.html` | Herb Room | `website/environment/herbroom.html` | `/housegarden.html` | `/housegarden.html`, Basin/Waterfall returns | visible authored links to `/environment/basin.html` and `/environment/waterfall.html` | Track only | Access flow records it after House and Garden; direct URL is not blocked | `/housegarden.html` | No | No | No | Canonical |
| `/environment/basin.html` | The Basin | `website/environment/basin.html` | `/environment/herbroom.html` | Herb Room, Old Forest, House/Garden | `/environment/herbroom.html`, `/environment/old-forest.html` | Track only | Access flow records it after Herb Room and awards Shimmer | `/environment/herbroom.html` | No | No | No | Canonical |
| `/environment/old-forest.html` | Old Forest \| Threshold | `website/environment/old-forest.html` | `/housegarden.html` | Basin, House/Garden | `/environment/basin.html`, `/portal/cabin-of-moss` | No | - | `/environment/basin.html` | No | No | No | Canonical |
| `/environment/waterfall.html` | The Drift Falls - Threshold Studio | `website/environment/waterfall.html` | `/environment/herbroom.html` | Herb Room, House/Garden | `/environment/herbroom.html`, `/portal/shimmer`, `/portal/old-forest-trek` | No | - | `/environment/herbroom.html` | No | No | No | Canonical |
| `/deep-system/engine.html` | Threshold Engine - Mechanics | `website/deep-system/engine.html` | - | - (Engine door removed 2026-11-03) | `/index.html` | No | - | - | No | No | No | Canonical — makers' surface, direct URL only |
| `/node-field.html` | Node Field | `website/node-field.html` | `/hub.html` (declared in `world-topology.json`) | `/glyph-archive-node.html` | `/hub.html` | No | - | `/hub.html` | No | No | No | Canonical |
| `/ethos.html` | Ethos | `website/ethos.html` | `/index.html` | first-level spokes and Hub surfaces | `/hub.html`, `/invitation.html`, `/pages/ethos-seed.html` | No | - | `/index.html` | No | No | No | Canonical |
| `/discover.html` | Threshold Discover | `website/discover.html` | `/index.html` | `/hub.html` | `/housegarden.html`, `/ethos.html`, `/index.html` | No | - | `/index.html` | No | No | No | Canonical |
| `/invitation.html` | You Are Welcome | `website/invitation.html` | `/index.html` | first-level spokes and Hub surfaces | - | No route gate | Contribution action requires Shimmer | `/index.html` | No; local access-flow state gates contribution | No | No | Canonical |
| `/mythology.html` | Threshold Studio - Mythology | `website/mythology.html` | `/index.html` | first-level spokes and Hub surfaces | first-level spokes, `/portal/canyon` | No | - | `/index.html` | No | No | No | Canonical |
| `/glyphs.html` | Glyph Archive - Threshold Studio | `website/glyphs.html` | `/index.html` | first-level spokes, `/index.html` | `/ethos.html`, `/index.html`, `/invitation.html` | No | - | `/index.html` | No | No | No | Canonical |
| `/dialogues.html` | Dialogues - Threshold Studio | `website/dialogues.html` | `/index.html` | first-level spokes, map | `/index.html`, `/ethos.html`, `/glyphs.html` | No route gate | Contribution action requires Shimmer | `/index.html` | No; local access-flow state gates contribution | No | No | Canonical |
| `/contact.html` | Threshold Studio - Contact | `website/contact.html` | `/index.html` | first-level spokes and Hub surfaces | first-level spokes and `/index.html` | No route gate | Contribution action requires Shimmer | `/index.html` | No; local access-flow state gates contribution | No | No | Canonical |
| `/learningwheel.html` | Learning Wheel - Threshold Studio | `website/learningwheel.html` | `/index.html` | first-level spokes and Hub surfaces | seasonal learning pages, first-level spokes | No | - | `/index.html` | No | No | No | Canonical |
| `/pages/learning-spring.html` | Sprout Gallery | `website/pages/learning-spring.html` | `/learningwheel.html` | config/runtime Learning Wheel | configured return to Learning Wheel | No | - | `/learningwheel.html` | No | No | No | Canonical |
| `/pages/learning-summer.html` | Shimmer Chamber | `website/pages/learning-summer.html` | `/learningwheel.html` | config/runtime Learning Wheel | configured return to Learning Wheel | No | - | `/learningwheel.html` | No | No | No | Canonical |
| `/pages/learning-autumn.html` | Collapse Lore | `website/pages/learning-autumn.html` | `/learningwheel.html` | config/runtime Learning Wheel | configured return to Learning Wheel | No | - | `/learningwheel.html` | No | No | No | Canonical |
| `/pages/learning-winter.html` | Soil Archive | `website/pages/learning-winter.html` | `/learningwheel.html` | config/runtime Learning Wheel | configured return to Learning Wheel | No | - | `/learningwheel.html` | No | No | No | Canonical |
| `/portal/cabin-of-moss` | What has waited can be seen. | `website/portal/src/pages/CabinOfMoss.jsx` | `/environment/old-forest.html` | Portal routes, topology | Portal forest routes | No | - | `/environment/old-forest.html` | No | No | No | Canonical |
| `/portal/lanternroot-conservatory` | Light waits beneath the path. | `website/portal/src/pages/LanternrootConservatory.jsx` | `/environment/old-forest.html` | Portal forest routes | `/portal/cabin-of-moss`, `/portal/old-forest-trek` | No | - | `/portal/cabin-of-moss` | No | No | No | Canonical |
| `/portal/old-forest-trek` | The forest is not overgrown... | `website/portal/src/pages/OldForestTrek.jsx` | `/environment/old-forest.html` | Basin/Waterfall and Portal forest routes | forest continuation routes | No | - | `/portal/lanternroot-conservatory` | No | No | No | Canonical |
| `/portal/snail-band-clearing` | The band is how the forest speaks. | `website/portal/src/pages/SnailBand.jsx` | `/environment/old-forest.html` | topology declaration | - | No | - | `/portal/old-forest-trek` | No | No | No | Canonical |

## Configured living pages and directly addressable legacy pages

| URL | Page title | Source file | Parent route | Linked from | Links to | Activation required? | Activation condition | Return target | Engine state required? | Orphaned? | Dead link? | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/pages/threshold.html` | Threshold | `website/pages/threshold.html` | `/index.html` | `/hub.html`; living-pages config | configured Notes, Posts, Projects, Hub returns | No | - | `/index.html` | No | No | No | Canonical |
| `/pages/notes.html` | Notes | `website/pages/notes.html` | `/pages/threshold.html` | living-pages config | configured Threshold and note pages | No | - | `/pages/threshold.html` | No | No | No | Canonical |
| `/pages/posts.html` | Posts | `website/pages/posts.html` | `/pages/threshold.html` | living-pages config | configured Threshold return | No | - | `/pages/threshold.html` | No | No | No | Canonical |
| `/pages/projects.html` | Projects | `website/pages/projects.html` | `/pages/threshold.html` | living-pages config | configured Threshold return | No | - | `/pages/threshold.html` | No | No | No | Canonical |
| `/pages/role-expressions.html` | Role Expressions | `website/pages/role-expressions.html` | `/pages/notes.html` | living-pages config | configured Notes return | No | - | `/pages/notes.html` | No | No | No | Canonical |
| `/pages/species-signals.html` | Species Signals | `website/pages/species-signals.html` | `/pages/notes.html` | living-pages config | configured Notes return | No | - | `/pages/notes.html` | No | No | No | Canonical |
| `/pages/ethos-seed.html` | Ethos Seed | `website/pages/ethos-seed.html` | `/ethos.html` | `/ethos.html` | `/ethos.html` | No | - | `/ethos.html` | No | No | No | Experimental |
| `/pages/beyond/beyond.html` | Threshold - Beyond | `website/pages/beyond/beyond.html` | - | - | `/garden.html`, `/hub.html`, `/index.html` | No | - | `/hub.html` | No | No | No | Experimental |
| `/pages/beyond/Ella.html` | Ella \| The Shepherd of Animals | `website/pages/beyond/Ella.html` | `/world-map.html` | `/world-map.html` | `/index.html` | No | - | `/index.html` | No | No | No | Experimental |
| `/wildflower-drift.html` | Wildflower Drift | `website/wildflower-drift.html` | - | runtime/legacy surface | `/index.html` | No | - | `/index.html` | No | Yes | No | Experimental |
| `/glyph-archive-node.html` | Glyph Archive | `website/glyph-archive-node.html` | - | - | `/glyphs.html`, `/node-field.html` | No | - | - | No | No | No | Experimental |
| `/spoke.html` | Threshold Spoke | `website/spoke.html` | - | - | - | No | - | - | No | Yes | No | Legacy |
| `/thankyou.html` | Thank You | `website/thankyou.html` | - | form/runtime completion only | `/index.html`, first-level spokes | No | - | `/index.html` | No | No | No | Experimental |

## Public deployment artifacts

These pages are not declared in the world topology or living-pages configuration,
but the Worker exposes them as static assets. They should be treated as public
until removed from `website/` or explicitly intercepted by the Worker.

| URL | Page title | Source file | Parent route | Linked from | Links to | Activation required? | Activation condition | Return target | Engine state required? | Orphaned? | Dead link? | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/portal/index.html` | Threshold Portal shell | `website/portal/index.html` | `/portal` | - | - | No | - | `/portal` | No | Yes | **Yes**: Worker serves the SPA shell but `/index.html` is not a registered SPA route | Legacy |
| `/portal-dist/index.html` | Threshold Portal | `website/portal-dist/index.html` | - | - | - | No | - | - | No | Yes | No | Experimental |
| `/generated-pages/environment/basin.html` | The Basin | `website/generated-pages/environment/basin.html` | - | - | `/environment/herbroom.html` | No | - | `/environment/herbroom.html` | No | Yes | No | Experimental |
| `/page-templates/environment/basin.html` | The Basin | `website/page-templates/environment/basin.html` | - | - | `/environment/herbroom.html` | No | - | `/environment/herbroom.html` | No | Yes | No | Experimental |
| `/echoes/inventory/index.html` | Threshold Hub - Entry | `website/echoes/inventory/index.html` | - | echo inventory only | mirrored Hub links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/hub.html` | Threshold Hub | `website/echoes/inventory/hub.html` | - | echo inventory only | mirrored Hub links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/housegarden.html` | Threshold Studio - House and Garden | `website/echoes/inventory/housegarden.html` | - | echo inventory only | mirrored world and spoke links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/garden.html` | House and Garden - Threshold | `website/echoes/inventory/garden.html` | - | echo inventory only | mirrored Garden links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/environment/herbroom.html` | Herb Room | `website/echoes/inventory/environment/herbroom.html` | - | echo inventory only | mirrored Basin/Waterfall links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/environment/basin.html` | The Basin | `website/echoes/inventory/environment/basin.html` | - | echo inventory only | mirrored Herb Room link | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/environment/waterfall.html` | The Waterfall | `website/echoes/inventory/environment/waterfall.html` | - | echo inventory only | mirrored Herb Room link | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/ethos.html` | Ethos | `website/echoes/inventory/ethos.html` | - | echo inventory only | mirrored Ethos links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/discover.html` | Threshold Discover | `website/echoes/inventory/discover.html` | - | echo inventory only | mirrored Discover links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/invitation.html` | Invitation | `website/echoes/inventory/invitation.html` | - | echo inventory only | mirrored Invitation links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/learningwheel.html` | Learning Wheel - Threshold Studio | `website/echoes/inventory/learningwheel.html` | - | echo inventory only | mirrored Learning Wheel links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/mythology.html` | Threshold Studio - Mythology | `website/echoes/inventory/mythology.html` | - | echo inventory only | mirrored Mythology links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/glyphs.html` | Glyph Archive - Threshold Studio | `website/echoes/inventory/glyphs.html` | - | echo inventory only | mirrored Glyph links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/dialogues.html` | Dialogues - Threshold Studio | `website/echoes/inventory/dialogues.html` | - | echo inventory only | mirrored Dialogue links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/contact.html` | Threshold Studio - Contact | `website/echoes/inventory/contact.html` | - | echo inventory only | mirrored Contact links | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/deep-system/engine.html` | Threshold Engine - Mechanics | `website/echoes/inventory/deep-system/engine.html` | - | echo inventory only | `/index.html` | No | - | - | No | Yes | No | Experimental |
| `/echoes/inventory/spoke.html` | Threshold Spoke | `website/echoes/inventory/spoke.html` | - | echo inventory only | - | No | - | - | No | Yes | No | Experimental |

## Portal SPA routes

All Portal routes below share `website/portal/index.html` as the document shell
title, **Threshold Portal**. The title column records the route's rendered
heading where one is present. The Worker maps every `/portal/*` request to the
SPA shell; the router owns the page selection.

No evidence was found that entering any listed Portal route is itself gated by
Engine or progression state. Several pages can offer stateful interactions,
but that is not a route-entry requirement.

| URL | Page title | Source file | Parent route | Linked from | Links to | Activation required? | Activation condition | Return target | Engine state required? | Orphaned? | Dead link? | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/portal` | A place for passing through. | `portal/src/pages/Home.jsx` | - | Portal navigation | Portal routes | No | - | - | No | No | No | Canonical |
| `/portal/dashboard` | Portal dashboard / branch label | `portal/src/pages/Dashboard.jsx` | `/portal` | `/portal/branches/:branchId` | branch dashboard links | No | - | `/portal` | No | No | No | Canonical |
| `/portal/branches/:branchId` | Branch dashboard | `portal/src/pages/Dashboard.jsx` | `/portal/dashboard` | runtime branch links | `/portal/dashboard` | No | - | `/portal/dashboard` | No | No | No | Canonical |
| `/portal/beach` | What will the shore remember? | `portal/src/pages/Beach.jsx` | `/portal` | Portal navigation | `/portal/ocean` | No | - | `/portal` | No | Yes | No | Experimental |
| `/portal/basin` | The Cabin is uphill. | `portal/src/pages/Basin.jsx` | `/portal` | Basin, Shimmer, Cabin routes | Portal forest routes | No | - | `/portal` | No | No | No | Canonical |
| `/portal/basin-falls` | The system is already working. | `portal/src/pages/BasinFalls.jsx` | `/portal/basin` | Basin, Shimmer, Old Forest Trek routes | `/portal/basin`, `/portal/shimmer`, `/portal/old-forest-trek` | No | - | `/portal/basin` | No | No | No | Canonical |
| `/portal/canyon` | Follow the light | `portal/src/pages/Canyon.jsx` | `/portal` | `/mythology.html` | - | No | - | `/portal` | No | No | No | Canonical |
| `/portal/deepwater` | The deep remembers in weight. | `portal/src/pages/Deepwater.jsx` | `/portal` | `/portal/first-door` | `/portal/first-door` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/doug` | Doug's desk | `portal/src/pages/Doug.jsx` | `/portal` | Portal root, Motion, Quiet Grove | `/portal/motion`, `/portal/quiet-grove` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/ethos` | Behavior generates gravity | `portal/src/pages/Ethos.jsx` | `/portal` | Portal navigation | `/ethos.html` | No | - | `/portal` | No | Yes | No | Experimental |
| `/portal/first-door` | The world opens a path... | `portal/src/pages/FirstDoor.jsx` | `/portal` | Deepwater, Ocean, Motion | Portal continuation routes | No | - | `/portal` | No | No | No | Canonical |
| `/portal/motion` | The world moves with you. | `portal/src/pages/Motion.jsx` | `/portal` | Doug, Quiet Grove, First Door | `/portal/doug`, `/portal/first-door`, `/portal/glyphs` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/ocean` | Ocean layer title | `portal/src/pages/Ocean.jsx` | `/portal` | Beach, First Door | `/portal/first-door` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/quiet-grove` | Grove title | `portal/src/pages/QuietGrove.jsx` | `/portal` | Doug | `/portal/doug` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/ruins` | Ruins title | `portal/src/pages/Ruins.jsx` | `/portal` | - | - | No | - | `/portal` | No | Yes | No | Experimental |
| `/portal/shimmer` | Shimmer | `portal/src/pages/Shimmer.jsx` | `/portal` | Basin, Basin Falls, Cabin | Basin/forest Portal routes | No | - | `/portal` | No | No | No | Canonical |
| `/portal/spiral-grove` | Grove title | `portal/src/pages/SpiralGrove.jsx` | `/portal` | - | - | No | - | `/portal` | No | Yes | No | Experimental |
| `/portal/drift-systems` | Drift is a field, not a mistake. | `portal/src/pages/SystemChamber.jsx` | `/portal` | Glyph Archive, Collapse Chamber | `/portal/glyphs` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/drift-chamber` | The Chamber does not push. It guides. | `portal/src/pages/SystemChamber.jsx` | `/portal/drift-systems` | - | - | No | - | `/portal/drift-systems` | No | Yes | No | Legacy |
| `/portal/collapse-chamber` | Collapse is interpreted, not erased. | `portal/src/pages/SystemChamber.jsx` | `/portal` | `/portal/glyphs/hourglass` | `/portal/drift-systems` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/glyphs` | Glyphs are compressed meaning. | `portal/src/pages/GlyphArchive.jsx` | `/portal` | Motion, Drift Systems | `/portal/glyphs/hourglass`, `/portal/drift-systems` | No | - | `/portal` | No | No | No | Canonical |
| `/portal/glyphs/hourglass` | Hourglass Glyph | `portal/src/pages/HourglassGlyph.jsx` | `/portal/glyphs` | `/portal/glyphs` | `/portal/collapse-chamber` | No | - | `/portal/glyphs` | No | No | No | Canonical |
| `/portal/rohg` | Rohg the ... | `portal/src/pages/Rohg.jsx` | `/portal` | - | - | No | - | `/portal` | No | Yes | No | Experimental |
| `/portal/rava` | Rava, the Stone-Mover. | `portal/src/pages/Rava.jsx` | `/portal` | - | - | No | - | `/portal` | No | Yes | No | Experimental |
| `/portal/wildflower-drift` | The field holds without closing. | `portal/src/pages/WildflowerDrift.jsx` | `/portal` | Portal root | `/portal` | No | - | `/portal` | No | No | No | Canonical |

## World SPA routes

The Worker intentionally serves these paths with the Portal shell, but the
source files are outside `website/portal`. They are public and routable, yet
they have no topology or Portal-local navigation declaration; their
experimental classification is therefore evidence-based rather than a claim
that their content is invalid.

| URL | Page title | Source file | Parent route | Linked from | Links to | Activation required? | Activation condition | Return target | Engine state required? | Orphaned? | Dead link? | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/world` | World Map | `website/world/WorldMap.jsx` | - | Worker route only | world routes | No | - | - | No | Yes | No | Experimental |
| `/world/map` | World Map | `website/world/WorldMap.jsx` | `/world` | Worker route only | world routes | No | - | `/world` | No | Yes | No | Experimental |
| `/world/garden` | House & Garden | `website/world/WorldChamberPages.jsx` | `/world` | Worker route only | world routes | No | - | `/world` | No | Yes | No | Experimental |
| `/world/ella` | Ella | `website/world/WorldChamberPages.jsx` | `/world` | Worker route only | world routes | No | - | `/world` | No | Yes | No | Experimental |
| `/world/chambers` | Chambers index | `website/world/WorldChamberPages.jsx` | `/world` | Worker route only | chamber routes | No | - | `/world` | No | Yes | No | Experimental |
| `/world/chambers/house-and-garden` | House & Garden | `website/world/chambers/ChamberPage.jsx` | `/world/chambers` | chamber index data | chamber page | No | - | `/world/chambers` | No | No | No | Experimental |
| `/world/chambers/ella` | Ella | `website/world/chambers/ChamberPage.jsx` | `/world/chambers` | chamber index data | chamber page | No | - | `/world/chambers` | No | No | No | Experimental |
| `/world/chambers/dialogues` | Dialogues | `website/world/chambers/ChamberPage.jsx` | `/world/chambers` | chamber index data | chamber page | No | - | `/world/chambers` | No | No | No | Experimental |

## Findings requiring follow-up

1. **One confirmed public dead link:** `/world-map.html` links to
   `/portal/index.html`. The Worker intercepts that URL and returns the Portal
   SPA shell, but the SPA registers `/`, not `/index.html`; the result is its
   "This route is unavailable." fallback. The intended target should be
   `/portal/`.

2. **Public static artifact exposure:** 21 generated/template/inventory HTML
   pages are directly reachable because the deployment root is `website/`.
   They are not topology or living-page routes. If they are not intended
   public pages, move them outside the Pages output or add Worker restrictions
   before treating the public route surface as clean.

3. **Orphaned public experiences:** `/spoke.html`, `/wildflower-drift.html`,
   several Portal pages, and all `/world*` routes lack an incoming canonical
   navigation declaration. Their presence is recorded, not promoted.

4. **Hub consolidation is now routed:** `/index.html` remains the Main Hub
   and owns the Engine-gated first crossing. `/hub.html` carries the
   Return-state continuation. `/hub-return.html` is **retired**, not a
   compatibility redirect: the file is absent and
   `website/tests/destination-routing.test.mjs` L156–167 asserts its absence
   (`ENOENT`). Rows 54, 55, 84, and 87 were generated before that retirement;
   their `/hub-return.html` cells have been corrected, and no page in
   `website/` linked to it at the time of correction.
