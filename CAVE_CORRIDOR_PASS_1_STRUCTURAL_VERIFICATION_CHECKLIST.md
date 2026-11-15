# Cave Corridor — Pass 1 Structural Verification Checklist

**Purpose:** Verify that Pass 1 preserved the proven Cave Corridor system while changing appearance only.

**Governing rule:** **Appearance may change. Spatial truth may not.**

**Visual acceptance is out of scope for this checklist.**

---

## 1. Build identity

- [ ] Workspace root is `C:\Threshold`.
- [ ] Commit is recorded.
- [ ] Branch/worktree state is recorded.
- [ ] Served URL is recorded.
- [ ] Build marker is readable from the served page.
- [ ] Build marker corresponds to the build under review.
- [ ] Submitted frames identify the same commit/build.

**If build/frame identity cannot be established:** **NOT REVIEWABLE**.

---

## 2. Protected-file byte identity

Protected:

- `CaveCorridorGeometry.js`
- `CaveCorridorState.js`

Verify:

- [ ] `CaveCorridorGeometry.js` is byte-identical to the authorized baseline.
- [ ] `CaveCorridorState.js` is byte-identical to the authorized baseline.
- [ ] `CaveCorridorGeometry.js` does not appear in the Pass 1 implementation diff.
- [ ] `CaveCorridorState.js` does not appear in the Pass 1 implementation diff.

**If either protected file changed:** **FAIL**.

Do not proceed to visual acceptance.

---

## 3. Changed-file boundary

Inventory every Pass 1 changed file and classify it:

- [ ] appearance
- [ ] evidence/instrumentation
- [ ] test/verification
- [ ] unauthorized structural change

Verify:

- [ ] Every implementation change is inside the issued Pass 1 scope.
- [ ] No unrelated Threshold surface changed.
- [ ] No deferred Deep implementation was introduced.
- [ ] House & Garden topology is unchanged.
- [ ] Canyon handoff behavior is unchanged.
- [ ] No Wildflower ownership/topology assumption was introduced.
- [ ] Wildflower Drift is untouched.

**Any unauthorized structural change:** **FAIL**.

---

## 4. Spatial-truth preservation

Verify:

- [ ] No corridor vertex position was displaced.
- [ ] No position noise was introduced.
- [ ] No shader/material technique displaces geometry.
- [ ] No visual mesh falsely represents a different corridor boundary.
- [ ] Corridor width is unchanged.
- [ ] Corridor height is unchanged.
- [ ] Bend position is unchanged.
- [ ] Mouth position is unchanged.
- [ ] Traveler position is unchanged for presentation purposes.
- [ ] Camera position remains tied to existing position.
- [ ] No screen-space effect substitutes for physical Bend occlusion.

**Any spatial-truth violation:** **FAIL**.

---

## 5. Render/sightline correspondence

Verify:

- [ ] Rendered corridor geometry still originates from the existing corridor sampler.
- [ ] No alternate positional Bend geometry was introduced.
- [ ] Sightline geometry and rendered geometry continue to describe the same underlying corridor coordinates.
- [ ] Tessellation-density differences do not alter those coordinates.
- [ ] Increased render density, if any, changes resolution only.
- [ ] Rendered Bend walls were not independently repositioned to strengthen apparent severance.

**Required invariant:**

**Rendered Bend and tested Bend remain two representations of the same spatial truth.**

**If the two diverge:** **FAIL**.

---

## 6. Appearance-only implementation

For each technique actually changed, verify that it remains appearance-only:

- [ ] Materials
- [ ] Lighting
- [ ] Normals
- [ ] Vertex colour
- [ ] Fog
- [ ] Non-displacing surface treatment
- [ ] Tessellation density preserving spatial coordinates
- [ ] Other explicitly authorized appearance-only treatment

For each changed technique record:

**Technique:**

**File:**

**Why appearance-only:**

**Spatial effect:** NONE / REVIEW REQUIRED

- [ ] Every changed technique resolves to NONE.

Any REVIEW REQUIRED item must be resolved before frame review.

---

## 7. Camera integrity

Verify:

- [ ] Camera position remains derived from existing traveler position.
- [ ] No translation offset was added to improve Bend composition.
- [ ] Existing derived FOV remains state-derived.
- [ ] Exposure changes remain presentational.
- [ ] Forward bias has not become hidden positional displacement.
- [ ] Desktop and 390 px use the same spatial camera rules.

**If Bend legibility depends on unauthorized camera repositioning:** **FAIL**.

---

## 8. Pass 1 boundary

Authorized scope:

**Mouth → Compression → physical Bend**

Verify:

- [ ] Work targets Mouth/Narrowing/Bend legibility.
- [ ] Deep remains deferred.
- [ ] Existing Deep content was not redesigned.
- [ ] Existing crystals beyond the Bend were not used to broaden Pass 1.
- [ ] Canyon visual language was not intentionally pulled backward into Mouth/Narrowing/Bend.
- [ ] No new derived state field was created to support the visual treatment.

### Doug escalation triggers

Stop and return to Doug only if:

- [ ] A material treatment requires a new derived field.
- [ ] The required reading depends on changing width or height.
- [ ] Bend legibility requires changing camera position rather than appearance.

If triggered:

**STOP — DOUG AMBIGUITY**

Otherwise:

**Doug escalation required:** **NO**

---

## 9. Focused Cave regression validation

Run the authorized focused Cave validation against the completed Pass 1 worktree.

### Runner 1

**Command:**

**Passed:**

**Failed:**

**Exit code:**

### Runner 2

**Command:**

**Passed:**

**Failed:**

**Exit code:**

Verify:

- [ ] Existing Cave progression remains green.
- [ ] Bend severance remains green.
- [ ] House & Garden unavailability remains green.
- [ ] Existing traversal/state behavior remains green.
- [ ] Existing Canyon handoff remains green where covered by the authorized validation.

**Protected Cave regression:** **FAIL**.

Do not repair mechanics under the visual grant.

---

## 10. Frame evidence package

For **each required progress value**, verify both desktop and 390 px evidence.

Each frame must contain or be tied to:

- [ ] Exact progress value.
- [ ] Derived state.
- [ ] Commit.
- [ ] Served URL.
- [ ] Build marker.
- [ ] Verified Pass 1 implementation.
- [ ] No unexplained build mismatch.

Kesh's prose is **description, not evidence**.

Missing attribution:

**NOT REVIEWABLE**

---

# Structural verification record

**Workspace:** `C:\Threshold`

**Commit:**

**Branch:**

**Build marker:**

**Served URL:**

**Changed files:**

- [ ] Inventory attached/recorded.

| Check | Result |
| --- | --- |
| Build identity | PASS / NOT REVIEWABLE |
| Protected-file byte identity | PASS / FAIL |
| Changed-file boundary | PASS / FAIL |
| Spatial-truth preservation | PASS / FAIL |
| Render/sightline correspondence | PASS / FAIL |
| Camera integrity | PASS / FAIL |
| Pass 1 scope | PASS / FAIL |
| Focused Cave validation | PASS / FAIL |
| Evidence attribution | COMPLETE / INCOMPLETE |
| Doug escalation required | YES / NO |

## Final structural disposition

- [ ] **STRUCTURAL PASS**
- [ ] **NOT REVIEWABLE**
- [ ] **FAIL**

### Evidence supporting disposition

Record concrete diff, hash/byte-identity, test, build, and attribution evidence only.

### Unresolved items

Record unresolved structural/evidence issues only.

---

## Disposition rules

### STRUCTURAL PASS

Protected files are byte-identical, spatial truth is intact, Pass 1 stayed within scope, focused validation passes, and evidence attribution is complete.

**Next:** Send attributable frames to the Pass 1 Frame Review Rubric.

### NOT REVIEWABLE

No structural violation has been established, but build/frame attribution is incomplete.

**Next:** Correct the evidence package. Do not judge the frames.

### FAIL

Protected geometry/state changed, spatial truth changed, protected mechanics regressed, or implementation exceeded the grant.

**Next:** Stop. Do not perform visual acceptance.

---

## Final rule

**This checklist does not decide whether Cave Corridor looks correct.**

It decides whether the rendered evidence is structurally legitimate enough to be judged.
