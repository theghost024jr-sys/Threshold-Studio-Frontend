# Cave Corridor — Visual Gate Pass 1 Checklist

**Issued to:** Kesh

**Scope:** Mouth → Compression → physical Bend

**Deep:** DEFERRED

**Baseline:** `0e5afc1eae616bb0f736a82b5ff75944176811b2`

## Governing instruction

**Make Mouth → Compression → physical Bend visually legible using appearance only. Preserve spatial truth exactly. Stop rather than alter geometry or mechanics.**

Appearance may change.

Spatial truth may not.

---

## A. Before implementation

- [ ] Confirm worktree is `C:\Threshold`.
- [ ] Confirm baseline is `0e5afc1eae616bb0f736a82b5ff75944176811b2`.
- [ ] Record current `HEAD`.
- [ ] Record current dirty paths before making Pass 1 changes.
- [ ] Read the Visual Gate Grant.
- [ ] Read `CAVE_CORRIDOR_PASS_1_STRUCTURAL_VERIFICATION_CHECKLIST.md`.
- [ ] Read `CAVE_CORRIDOR_PASS_1_FRAME_REVIEW_RUBRIC.md`.
- [ ] Confirm Deep is deferred.
- [ ] Confirm Wildflower Drift is untouched.
- [ ] Confirm existing Cave mechanics are protected.

---

## B. Protected structural boundary

These must remain unchanged:

- [ ] `CaveCorridorGeometry.js`
- [ ] `CaveCorridorState.js`

Also preserve:

- [ ] Corridor vertex positions.
- [ ] Corridor width.
- [ ] Corridor height.
- [ ] Mouth position.
- [ ] Bend position.
- [ ] Existing corridor sampler.
- [ ] Render/sightline spatial correspondence.
- [ ] Traveler position.
- [ ] Camera positional relationship to `position`.
- [ ] House & Garden severance mechanics.
- [ ] Existing Cave progression mechanics.
- [ ] Canyon handoff.

### Forbidden

- [ ] No vertex displacement.
- [ ] No position noise.
- [ ] No fudged width.
- [ ] No fudged height.
- [ ] No independent repositioning of rendered Bend walls.
- [ ] No camera translation introduced to manufacture Bend legibility.
- [ ] No new derived state field.
- [ ] No Deep redesign.
- [ ] No Canyon influence pulled backward to solve Pass 1.

Any required violation of this section is a **STOP**, not an implementation option.

---

## C. Permitted Pass 1 craft

Appearance-only changes may include:

- [ ] Materials.
- [ ] Lighting.
- [ ] Normals.
- [ ] Vertex colour.
- [ ] Fog.
- [ ] Non-displacing surface treatment.
- [ ] Tessellation-density changes that preserve underlying spatial coordinates.

For every technique used:

**Technique:**

**Changed file:**

**Why appearance-only:**

---

## D. Mouth

Goal:

**The beginning must read as an entrance into a physical Cave corridor.**

Check during implementation:

- [ ] Floor/wall/ceiling relationships are legible.
- [ ] Forward passage is perceptible.
- [ ] Depth is perceptible.
- [ ] The scene does not primarily read as disconnected shards or planes.
- [ ] The scene does not depend on Canyon identity for visual interest.

---

## E. Compression

Goal:

**Moving inward must visibly increase enclosure.**

Check:

- [ ] Compression is distinguishable from Mouth.
- [ ] The traveler still appears to occupy the same continuous corridor.
- [ ] Physical enclosure becomes stronger.
- [ ] Darkness alone is not being used as compression.
- [ ] Fog alone is not being used as compression.
- [ ] Loss of visibility remains attributable to the Cave's presentation of its existing physical structure.

---

## F. Physical Bend

Goal:

**The Bend must read as a physical turn in the corridor.**

Check:

- [ ] Direction change is visually perceptible.
- [ ] Intervening Cave structure is visible.
- [ ] Loss of the previous sightline reads as physical occlusion.
- [ ] Forward continuation survives around the turn.
- [ ] Darkness is not substituting for the Bend.
- [ ] Fog is not substituting for the Bend.
- [ ] Vignette/overlay effects are not substituting for the Bend.
- [ ] Bend legibility does not depend on moving the camera off its authorized position.

---

## G. Stop and return to Doug only if

- [ ] A required material treatment needs a new derived field.
- [ ] The intended reading cannot work without changing width or height.
- [ ] The Bend cannot become visually legible without changing camera position.

If none apply, continue as craft work.

Do not escalate ordinary material, lighting, fog, normal, colour, or other appearance decisions.

---

## H. Structural verification

After implementation and **before visual review**:

- [ ] Run `CAVE_CORRIDOR_PASS_1_STRUCTURAL_VERIFICATION_CHECKLIST.md`.
- [ ] Confirm protected-file byte identity.
- [ ] Inspect complete Pass 1 diff.
- [ ] Confirm spatial-truth preservation.
- [ ] Confirm render/sightline correspondence.
- [ ] Confirm camera integrity.
- [ ] Run focused Cave regression validation.
- [ ] Record actual test results and exit codes.
- [ ] Record changed-file inventory.

Record exactly one:

- [ ] **STRUCTURAL PASS**
- [ ] **NOT REVIEWABLE**
- [ ] **FAIL**

Only **STRUCTURAL PASS** opens the visual-review gate.

---

## I. Frame evidence package

Capture the four authorized progress values defined by the grant.

For **each progress value**:

### Desktop

- [ ] Frame captured.
- [ ] Exact progress recorded.
- [ ] Derived state displayed/recorded.
- [ ] Commit recorded.
- [ ] Served URL recorded.
- [ ] Build marker readable.
- [ ] Evidence tied to the structurally verified build.

### 390 px

- [ ] Frame captured.
- [ ] Exact progress recorded.
- [ ] Derived state displayed/recorded.
- [ ] Commit recorded.
- [ ] Served URL recorded.
- [ ] Build marker readable.
- [ ] Evidence tied to the structurally verified build.

Expected package:

**4 progress values × 2 viewports = 8 attributable frames.**

Missing attribution makes the affected evidence **NOT REVIEWABLE**.

---

## J. Kesh return packet

Return:

- [ ] Changed-file list.
- [ ] Implementation diff.
- [ ] Protected-file identity results.
- [ ] Structural verification record.
- [ ] Focused regression-test results.
- [ ] Eight attributable frames.
- [ ] Short implementation description.
- [ ] Any unresolved structural question.
- [ ] Any Doug escalation trigger encountered.

Kesh's description is **prose, not evidence**.

Do not self-certify visual acceptance.

---

# Pass 1 gate sequence

**Implement**

→ **Structural verification**

→ **STRUCTURAL PASS / NOT REVIEWABLE / FAIL**

Only after:

**STRUCTURAL PASS**

→ **Frame Review Rubric**

→ **Visual PASS / HOLD**

A visual HOLD authorizes only appearance-level correction inside the existing grant.

A structural FAIL does not proceed to visual review.

## Completion condition

Pass 1 is complete only when:

**spatial truth remains proven + Mouth reads + Compression reads + the Bend reads physically at desktop and 390 px.**
