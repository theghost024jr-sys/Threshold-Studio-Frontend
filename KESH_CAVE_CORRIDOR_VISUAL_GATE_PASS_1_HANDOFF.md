# Kesh — Cave Corridor Visual Gate Pass 1 Handoff

**Status:** ISSUED

**Recipient:** Kesh

**Workspace:** `C:\Threshold`

**Pass:** Cave Corridor Visual Gate — Pass 1

**Scope:** Mouth → Compression → physical Bend

**Deep:** DEFERRED

## Pinned baseline

`0e5afc1eae616bb0f736a82b5ff75944176811b2`

This is the structural reference point for Pass 1 verification.

---

# Mission

**Make Mouth → Compression → physical Bend visually legible using appearance only. Preserve spatial truth exactly. Stop rather than alter geometry or mechanics.**

The existing Cave mechanics are not the problem being solved in this pass.

Pass 1 exists to make the already-established physical corridor visually readable.

---

# Read before touching implementation

Use these repository documents as the governing set:

1. `CAVE_CORRIDOR_VISUAL_GATE_PASS_1_CHECKLIST.md`
2. `CAVE_CORRIDOR_PASS_1_STRUCTURAL_VERIFICATION_CHECKLIST.md`
3. `CAVE_CORRIDOR_PASS_1_FRAME_REVIEW_RUBRIC.md`

The Visual Gate Grant remains the authority behind them.

If these documents conflict with an implementation convenience, the documents win.

---

# Protected truth

The following are not available for reinterpretation during Pass 1:

- `CaveCorridorGeometry.js`
- `CaveCorridorState.js`
- corridor vertex positions
- corridor width
- corridor height
- Mouth position
- Bend position
- existing sampler/spatial path
- render/sightline spatial correspondence
- traveler position
- camera positional relationship to traveler position
- House & Garden severance mechanics
- existing Cave progression mechanics
- Canyon handoff

`CaveCorridorGeometry.js` and `CaveCorridorState.js` must remain byte-identical to the pinned baseline.

If either appears in the Pass 1 implementation diff, stop.

---

# Appearance authority

Pass 1 may use appearance-level craft including:

- materials
- lighting
- normals
- vertex colour
- fog
- non-displacing surface treatment
- tessellation-density changes that preserve the existing spatial coordinates

These are implementation tools, not permission to change the Cave's physical truth.

## Specifically prohibited

Do not introduce:

- vertex displacement
- position noise
- altered corridor widths
- altered corridor heights
- independently repositioned Bend walls
- camera translation used to manufacture a Bend
- a new derived state field
- a Deep redesign
- backward Canyon influence as a solution to Pass 1

---

# Required visual progression

The implementation must target this reading:

**Mouth → increasing enclosure → Compression → physical Bend**

### Mouth

The viewer should be able to read an entrance into a physical Cave corridor.

### Compression

The same continuous corridor should visibly become more constrained.

Darkness or fog alone does not establish compression.

### Physical Bend

The viewer should be able to perceive a genuine change in corridor direction.

Loss of the prior sightline must read as physical occlusion produced by Cave structure.

Darkness, fog, overlays, vignette, or disappearance may support the presentation.

They may not substitute for the physical Bend.

---

# Pass 1 environmental boundary

Mouth/Narrowing/Bend remain the strict visual-gate stretch.

Deep is deferred.

Do not pull later Canyon identity backward simply to make the early corridor visually richer.

Existing Deep crystals do not broaden this grant.

---

# Stop and return to Doug only if

Stop for design reconciliation if any of these becomes necessary:

1. A material treatment requires a new derived field.
2. The intended visual reading requires changing corridor width or height.
3. The Bend cannot become legible without moving the camera position rather than changing appearance.

Otherwise, material, lighting, fog, normals, colour, tessellation and related appearance choices remain implementation craft.

Do not broaden the pass merely because an appearance problem is difficult.

---

# Structural verification before frame review

When implementation is complete, run:

`CAVE_CORRIDOR_PASS_1_STRUCTURAL_VERIFICATION_CHECKLIST.md`

against:

`0e5afc1eae616bb0f736a82b5ff75944176811b2`

Return exactly one structural disposition:

- **STRUCTURAL PASS**
- **NOT REVIEWABLE**
- **FAIL**

No frame proceeds to visual acceptance without **STRUCTURAL PASS**.

A visually attractive result cannot rescue a structural FAIL.

---

# Required visual evidence

After STRUCTURAL PASS, produce the four authorized progress states at:

- desktop
- 390 px

Required total:

**4 progress values × 2 viewports = 8 attributable frames**

Every frame must be tied to:

- exact progress value
- derived state
- commit
- served URL
- readable build marker
- the structurally verified implementation

A frame without sufficient attribution is **NOT REVIEWABLE**.

---

# Return packet

Return the following together:

- [ ] Current commit.
- [ ] Changed-file inventory.
- [ ] Complete Pass 1 implementation diff.
- [ ] Protected-file byte-identity result.
- [ ] Render/sightline correspondence result.
- [ ] Camera-integrity result.
- [ ] Focused Cave regression results with actual counts and exit status.
- [ ] Structural disposition.
- [ ] Eight attributable frames, if structural disposition is PASS.
- [ ] Short implementation description.
- [ ] Any unresolved issue.
- [ ] Any Doug escalation condition encountered.

## Evidence hierarchy

**Diffs, hashes, tests, build identity and attributable frames are evidence.**

Implementation prose is description.

Do not substitute description for evidence.

---

# Do not self-close the visual gate

Kesh may establish **STRUCTURAL PASS**.

Kesh does not issue final visual acceptance.

After STRUCTURAL PASS, the eight frames are reviewed against:

`CAVE_CORRIDOR_PASS_1_FRAME_REVIEW_RUBRIC.md`

Possible visual outcome:

- **PASS**
- **HOLD**

A visual HOLD authorizes only another appearance-level correction inside the existing Pass 1 grant.

It does not authorize geometry, state or mechanic changes.

---

# Completion boundary

Pass 1 closes only when both are true:

**1. Spatial truth remains proven.**

**2. The attributable rendered sequence makes Mouth → Compression → physical Bend visually legible at desktop and 390 px.**

Until both are true:

**Cave Corridor Pass 1 remains open.**
