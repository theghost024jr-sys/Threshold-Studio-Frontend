# Kaelen — The Scope of Threshold

**From:** Kesh (VS Code seat)
**To:** Kaelen (Gemini seat, formerly Scott)
**Date:** 2026-11-18
**Live world:** https://www.thresholdstudiowebsite.org/

Welcome to the table. This is what Threshold is, who owns what, and which
laws will break your work if you don't know them. Everything below is
verified against the repository and its test suite as of today, not
summarized from memory.

## What Threshold is

Threshold is a living world, not a website with pages. The site at
`thresholdstudiowebsite.org` is the world's public surface. Underneath it:

- **The world** — places (Hub, House & Garden, Herb Room, Basin, Old Forest,
  the Portal chambers, the Cave route, Plasma-Bloom Meadow, Frog Chamber…)
  connected by authored seams. Geography is declared, reciprocal, and tested.
- **The Engine** — the authoritative source of world-state change
  (`engine/`, THRESHOLD-META-ENGINE-CONTRACT.md). Presentation never owns
  state. Pressure, drift, collapse, resonance are Engine concerns; pages
  render consequences, they do not decide them.
- **The vault** — the Obsidian corpus owned by Doug. World meaning, canonical
  geography, design intent, and implementation packets live there.
- **The repository** (`theghost024jr-sys/Threshold-Studio-Frontend`) — routes,
  runtime behavior, styles, assets, tests, the Cloudflare Worker, and
  deployment. This is where Kesh works.

## Who is who

| Name | Seat |
|---|---|
| theghost | The human. Final authority on everything. |
| Kesh | VS Code assistant — repository implementation and the pipeline. |
| echoroot | Copilot app. Co-author of the vault data. |
| Kaelen | You — Gemini. Formerly Scott, formerly "boob". |
| Doug | Obsidian — world meaning and the vault reading list. |

## The authority boundary (do not cross it)

Obsidian (Doug) owns **meaning**: canonical geography, intended
relationships, design decisions, packet intent. The repository owns
**mechanism**: routes, runtime, Engine boundaries, styles, tests, Worker,
deployment. Neither side silently changes the other.

- Doug hands the vault reading list and each note's status (authority,
  superseded, pending). **Never crawl the vault or infer design authority
  from filenames, timestamps, or the newest copy.** If a note doesn't
  declare its status, ask.
- Substantial world changes travel as implementation packets (packet ID,
  canonical terminology, design intent, route/activation intent,
  preserve/do-not-change constraints, acceptance criteria). Implementation
  reports back repository reality, unknowns, deltas, and test evidence.

## The laws

These are rulings by theghost, enforced in tests wherever possible. They are
not style preferences.

1. **Every page is a node.** A created page must be registered in
   `website/config/world-topology.json` (identity, route, classification,
   reciprocal `connectsTo` seams, `returnsTo`, passage mode) and in the
   route ledger `website/config/route-layers.json` (with its echo back to
   its return place). Orphan routes are violations.

2. **Every node is on the World Map.** The map (`website/world-map.html`)
   is currently theghost's atlas — every declared place appears on it,
   enforced by `website/tests/world-map-atlas.test.mjs`. The atlas may be
   hidden later; the law persists underneath.

3. **Identity preservation.** A failed or unavailable destination must
   never resolve as another Threshold place because that place is a
   convenient fallback. Fail honestly ("Threshold destination
   unavailable.", "This route is unavailable.") or don't fail. The Worker
   enforces this at the edge: it rejects Entry Hub documents served where a
   Portal destination was requested, and logs every shell/asset delivery
   decision (`portal_shell` / `portal_asset` diagnostics in `worker.js`).

4. **Crossing authority.** Only the Main Hub's first crossing is
   Engine-gated: navigation happens only after an accepted Engine intent
   reports `responded:true`. Rejected → no navigation. Accepted but
   recorded-only (`responded:false`) → no navigation. Everything after that
   crossing is authored traversal, and authored routes must never be
   hidden or erased because an activation or API call failed.

5. **Gate 4.** Six canaries — Hub, Basin, Basin Falls, Cabin of Moss,
   Shimmer, Cave Corridor — must retain their intended identity through
   load *and* refresh, with zero fallback documents, failed requests, or
   console errors. It runs as a separate, non-deployment workflow
   (`gate4-six-canary.yml`); a passing Gate 4 does **not** authorize
   deployment, and a failing canary blocks it. The runtime spec drives a
   real `wrangler pages dev` edge with Playwright.

6. **Wildflower Drift is off-limits** unless theghost explicitly
   reauthorizes work on it. Related: wildflowers are dynamically manifested
   by Threshold — static tests must never encode their permanent presence
   or absence as fixed topology.

7. **Hub separation.** Return Hub (`/hub.html`) work must not alter Entry
   Hub (`/index.html`) presentation or structure unless a shared contract
   requires it on both. The Engine console (`deep-system/engine.html`) is a
   makers' surface anchored to the Entry Hub; the Return Hub must never
   link it (ruled 2026-11-03, enforced by an inverted test assertion).

8. **Possibility is not promise.** The Herb Room's West Window shows a
   *possible* Garden — never a guaranteed destination, quest marker, or
   prediction. Generally: no possibility may become a promised destination.

9. **Hidden state is experienced, not metered.** The Frog Chamber is the
   reference implementation: hunger changes because you ate; tiredness is
   known by Threshold and felt by the player; there is no `ENERGY 17/100`,
   no quest flag, no pickup reward. Arrival can be *followed* (the Frog)
   rather than selected from a map, even for a fully registered node.

10. **Place identity precedes manifestation.** Establish what a place *is*
    before letting other things leak into it. Later conditions may
    influence a place without replacing it.

11. **Evidence over belief.** When verified evidence contradicts prior
    assumption, the implementation and the conclusions move — never the
    evidence. Rulings get encoded into tests so they outlive memory.

## The shape of the frontend

- **Entry Hub** `/index.html` → Engine-gated first crossing → canonical
  path: House & Garden → Herb Room → Basin → Old Forest.
- **Return Hub** `/hub.html` — return-state presentation, Node Field.
- **Portal SPA** `/portal/*` — React (Vite, `website/portal/`), one shell
  served by the Worker for all portal routes; `#root` is full-viewport.
  Committed extensionless shell files are static fallback only.
- **Cave route:** Cave Corridor → Crystal Verge (hallway) → Canyon, with an
  authorized two-way Corridor ↔ Verge passage. Corridor never hands off
  directly to Canyon.
- **Meadow arc:** Plasma-Bloom Meadow — pulling is the theremin, blooms are
  the other instruments, sound choices open hidden passages (calm lingering
  reveals the violet seam to Crystal Verge; the field going quiet brings
  the Frog). Frog Chamber hangs off the Meadow, `stillness` passage.
- **Pipeline:** push to `main` → Validate Frontend (schema → full suite →
  `build:ci` → artifact) → Deploy publishes that validated artifact to
  Cloudflare Pages. `build:ci` is self-sufficient from a bare checkout —
  one command, complete artifact. If your change can't survive
  `git clone` + `npm run build:ci` + `npm test`, it isn't done.

## What this means for you, Kaelen

Before you touch anything: know which side of the authority boundary your
change lives on. If it changes meaning, it goes through Doug. If it changes
mechanism, it answers to the test suite — 283 node tests + 59 vitest + Gate 4
as of today, all green, all deployed. Do not hardcode what the registry can
derive, do not let any surface impersonate another, and when the world
refuses your change, assume the world is right until proven otherwise.

The jar is wherever the player left it. That is not a bug.

— Kesh
