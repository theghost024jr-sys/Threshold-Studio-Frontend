# Cave Corridor Build Record

## Authorization boundary

- Workspace root: `C:\Threshold`
- Stage B: STOP
- Gate 4: HOLD
- Deployment: NOT AUTHORIZED
- This record is the explicitly authorized durable artifact for the bounded Cave Corridor pass.

## Baseline

Observed repository state before test execution:

```text
HEAD: 4d0bd8f5335d6e35cb4b514b35ca30264a248e06
Branch: cave-bend-walkthrough
```

Pre-existing changed or untracked paths:

```text
 M README.md
 M website/config/world-topology.json
 M website/world-map.html
 M worker.js
?? _tmp_graph.py
?? website/ROUTE_LAYERS.md
?? website/assets/glyphs/symbolic-glyph-spiral.png
?? website/config/route-layers.json
?? website/spiral-reflection.html
?? website/styles/spiral-reflection.css
?? website/tests/route-layers.test.mjs
?? website/tests/spiral-reflection.test.mjs
```

Relevant and protected baseline SHA-256 values:

```text
website/housegarden.html 058857563D4EB7B92CF7E2FB401D859B96054D7BCDA9531FCF5BAC18FE91C338
website/portal/src/App.jsx 5EF124E4A5155B69992165F0012DE2FAEEC0E0731ED227B14D9780AF6A3CDDA9
website/config/world-topology.json 9D73DA0B112D3E3BDFD9DA057CB13979894AE6EEA6B5CFD1264DA0A6DE847382
website/config/access-flow.json F4C92B1FF129831CFB9A095419A21166E383EACA697DA0881A38A5A2B0B260F8
website/portal/src/pages/CaveCorridor.jsx 8B9D16E3AF24732AAB8C076CB6B05C9D5C39B35E250FD768FC0444FD05556889
website/portal/src/pages/CaveCorridor.css 6F03EE294E15009EA3D32CC759A5D44541DFCC18BCDB33BCAD4B7769DC8B7FC4
website/portal/src/pages/CaveCorridorState.js D3846E9C19C711128E7A9DBDE812970B5B6D0BD92423750322D73D5DA2FFE418
website/portal/src/pages/CaveCorridorViewport.jsx C565F0EB1416FC9C56513FC8D0A0DD7C910126D6F54A98F3BFFA71DBE68B68C2
website/tests/cave-corridor-bend-severance.test.mjs 4BF9B47ECD86332B7487A59095BA4777016D39B48A3F66C2DEE0F9C2D9D97618
website/tests/cave-corridor.test.mjs 460A5FA490B3613591D2EC046D8938EA24E7F8F3E68F8F2CAB87EDA890E3886F
website/tests/cave-corridor-chamber.test.mjs 34B0DFBE980ED108B94531212FBBAE9E90450B36BE5E2B417556F94D986B7E47
```

## Direct runners established

```text
Node: C:\Program Files\nodejs\node.exe
Node runner: node --test
Vitest runner: C:\Threshold\node_modules\.bin\vitest.cmd
```

No package-manager, build, bundler, or deployment command was run.

## Baseline suite results

Command:

```text
node --test website\tests\cave-corridor.test.mjs
```

Result:

```text
✔ keeps Cave Corridor as its own House and Garden chamber with Meadow branch
✔ derives continuous Cave Corridor conditions from traveler progress
✔ preserves the former alignment prototype as a connected branch
tests 3
pass 3
fail 0
```

Command:

```text
.\node_modules\.bin\vitest.cmd run website\tests\cave-corridor-bend-severance.test.mjs website\tests\cave-corridor-chamber.test.mjs website\tests\cave-corridor-manifest.test.mjs
```

Result:

```text
Test Files  1 failed | 2 passed (3)
Tests  2 failed | 17 passed (19)
```

Observed failures:

```text
website/tests/cave-corridor-chamber.test.mjs
  Cave Corridor chamber contract > topology > does not expose Wildflower Drift in topology
  AssertionError: expected cave.connectsTo not to include "wildflower-drift"

website/tests/cave-corridor-chamber.test.mjs
  Cave Corridor chamber contract > topology > does not expose a Wildflower or Meadow branch in the chamber
  AssertionError: expected CaveCorridor.jsx not to match /wildflower|meadow/i
```

## Disposition

- Bend severance test: PASS. The local geometry suite reports physical Bend wall intersection and continuous House & Garden-side visibility transition to `gone`.
- Chamber contract: DISCREPANCY FOUND. The failures concern `world-topology.json` and Meadow/Wildflower content in `CaveCorridor.jsx`.
- No repair was attempted. `world-topology.json` is outside the authorized writable paths, and this pass does not authorize scope expansion.
- Post-test status matched the pre-test changed-path set. No excluded output path changed.
- No Cave Corridor source or test file was modified during this baseline pass.

Final disposition: DISCREPANCY FOUND

---

## Baseline re-execution (second pass)

This file pre-existed this pass (4,182 b, mtime 2026-11-12 00:42:31). Prior content is
preserved unmodified; this section is appended. The file appeared as `??` in `git status`
before either runner was invoked in this pass.

### Pre-execution state

```text
HEAD:   4d0bd8f5335d6e35cb4b514b35ca30264a248e06
Branch: cave-bend-walkthrough
```

Changed/untracked set identical to the section above, plus this record file (expected).

### Supplementary protected hashes (additional to the manifest above)

```text
website/portal/src/pages/CaveCorridorPrototype.jsx 736313944B56EB4084B86736826AAFFB0DB68767D9C3CC78CD8F814999D7DCAA
website/portal/src/pages/CaveCorridorPrototype.css 473840D57B689150A33FCAC06B86B39140C1B2528895ACBDF47320A80A752192
website/portal/cave-corridor                      D008666CA7EABD5B0CD2EBD3F833BFDE7030194E189591B8DBFD81D9CB3E907F
worker.js                                         344FD42C3F9A22539DD305D95C70CE7F31596E5106DF692E7E45B3A48297EAF9
website/_worker.js                                344FD42C3F9A22539DD305D95C70CE7F31596E5106DF692E7E45B3A48297EAF9

website/portal-dist aggregate: 69 files, 57,254,064 bytes
sha256 5D187ED5D3EF0DAF2EFEC9F82EAFA1F12F0AFD7F3ADE321110F5A3D5975C1F1E
```

### Runner A - verbatim

```text
$ node --test website/tests/cave-corridor.test.mjs

✔ keeps Cave Corridor as its own House and Garden chamber with Meadow branch (14.5189ms)
✔ derives continuous Cave Corridor conditions from traveler progress (2.4008ms)
✔ preserves the former alignment prototype as a connected branch (13.0188ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 236.9046

EXIT 0
```

### Runner B - verbatim

```text
$ .\node_modules\.bin\vitest.cmd run website/tests/cave-corridor-bend-severance.test.mjs

 RUN  v5.0.5 C:/Threshold

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  00:46:46
   Duration  831ms (import 34%, tests 27%, transform 25%, worker 13%)

EXIT 0
```

### Tool-cache exception

```text
node_modules/.vite/vitest mtime before: 2026-11-01 23:12:19
node_modules/.vite/vitest mtime after:  2026-11-01 23:12:19
touched: no
```

The cache exception was not exercised by this pass.

### Post-run worktree

Identical to the pre-run changed/untracked set. No excluded path changed. No Cave
Corridor source or test file was modified.

## Acceptance observation

Acceptance question: does the Bend geometry itself remove the House & Garden-side
entrance from visibility?

Mechanism (read, not inferred):

- `observeBendSeverance()` projects 41 sightline samples across the entrance opening.
  Each sample is FOV-gated and then tested for intersection against the inner Bend wall
  chain. The returned label is derived from the fraction of unblocked samples.
- `innerBendWalls()` is derived from `corridorSamples()` restricted to
  `bend.start..bend.end` and offset by the sampled corridor width. `CaveCorridorViewport.jsx`
  renders wall surfaces from the same `corridorSamples()` via `addSurface` and `edgePoint`.
  The occluder is the rendered corridor geometry, not a separate invisible slab.
- `segmentsIntersect()` is a standard 2D segment-segment intersection test. No visibility
  flag, progress value, or camera constraint is consulted. The metadata-immunity test
  confirms that `originVisibility`, `cameraConstraint`, and `progress` produce an identical
  observation object.

Verdict: **PASS - model level.**

```text
outbound  progress 0.10 -> visible
          progress 0.53 -> partial
          progress 0.537 -> sliver
          progress 0.54 -> gone
reverse   gone -> sliver -> partial -> visible
Bend wall spans entrance base to above eye height.
```

Limits recorded, not waived:

1. Analytic 2D (x,z) sightline model. No render, no depth buffer, no pixel evidence.
   The viewport is asserted only by source tokens, not by a rendered frame.
2. Four progress samples. "Continuous" describes a label derived from a computed fraction;
   it is not a proof of a continuous visibility curve.
3. Every constant remains provisional: 30.712 total length, bend 14.000-18.712,
   radius 3, widths 1.5-1.6, height 2.2, thresholds 0.53/0.537/0.54. The test pins them,
   so it is also a snapshot of tuning.

## Disposition - second pass

- No implementation was performed. No falsification occurred, so no revision of provisional
  geometry was authorized or needed.
- Chamber contract remains DISCREPANCY FOUND from the earlier section, unchanged.
  Two of its failures reference `CaveCorridor.jsx` content and are therefore inside the
  writable allowlist, but the chamber suite is evidence-only and those assertions are not
  the acceptance question. No repair attempted.
- Stage B: STOP. Gate 4: HOLD. Deployment: NOT AUTHORIZED.
