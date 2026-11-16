# Cave Corridor — Pass 1 Implementation Diff Boundary

**Baseline commit:** `0e5afc1eae616bb0f736a82b5ff75944176811b2`

**Workspace:** `C:\Threshold`

**Scope:** Cave Corridor Visual Gate Pass 1

**Authorized visual stretch:** Mouth → Compression → physical Bend

**Deep:** DEFERRED

## Governing rule

**The Pass 1 implementation diff contains only changes made to execute the issued appearance-only visual grant.**

Pre-existing dirty worktree changes, governance documents, evidence artifacts, and unrelated repository changes are not implementation simply because they appear after the pinned baseline.

---

## 1. Pre-existing worktree exclusions

Before Pass 1 implementation, these modified test files already existed:

- `website/tests/cave-corridor-chamber.test.mjs`
- `website/tests/cave-corridor.test.mjs`

These are the previously identified Wildflower/non-ownership static-assertion corrections.

They are:

- [ ] preserved;
- [ ] excluded from the Pass 1 implementation diff;
- [ ] not attributed to Kesh's visual work;
- [ ] still permitted to execute as regression evidence where applicable.

Pass 1 must not absorb these existing changes into its ownership record.

---

## 2. Governance-document exclusions

These four new files establish authority and review procedure. They are not Cave implementation:

- `CAVE_CORRIDOR_PASS_1_FRAME_REVIEW_RUBRIC.md`
- `CAVE_CORRIDOR_PASS_1_STRUCTURAL_VERIFICATION_CHECKLIST.md`
- `CAVE_CORRIDOR_VISUAL_GATE_PASS_1_CHECKLIST.md`
- `KESH_CAVE_CORRIDOR_VISUAL_GATE_PASS_1_HANDOFF.md`

Recorded documentation deltas:

- Frame Review Rubric: 346 additions
- Structural Verification Checklist: 315 additions
- Visual Gate Pass 1 Checklist: 262 additions
- Kesh Pass 1 Handoff: 260 additions

All four remain outside the implementation diff.

Their presence in git status must not be counted as visual implementation.

---

## 3. Protected files

The following files must remain byte-identical to the pinned baseline:

- `website/portal/src/pages/CaveCorridorGeometry.js`
- `website/portal/src/pages/CaveCorridorState.js`

Required result:

- [ ] Geometry byte identity: PASS
- [ ] State byte identity: PASS
- [ ] Geometry absent from implementation diff
- [ ] State absent from implementation diff

If either protected file changes:

**STRUCTURAL FAIL**

Do not redefine that change as implementation.

---

## 4. What may enter the implementation diff

A changed line or file belongs to Pass 1 implementation only if all of the following are true:

- [ ] Kesh changed it after the issued handoff.
- [ ] The change directly serves Mouth/Compression/Bend visual legibility.
- [ ] The change is appearance-level.
- [ ] The change remains inside the issued grant.
- [ ] The change does not alter protected spatial truth.
- [ ] The change does not implement deferred Deep work.
- [ ] The change does not alter another Threshold surface.

Authorized craft may include:

- materials;
- lighting;
- normals;
- vertex colour;
- fog;
- non-displacing surface treatment;
- rendering tessellation-density changes that preserve underlying spatial coordinates.

Authorization of a technique does not automatically authorize every implementation of that technique.

---

## 5. What may not enter the implementation diff

The Pass 1 implementation diff must contain no change whose effect is to alter:

- corridor vertex positions;
- corridor width;
- corridor height;
- Mouth position;
- Bend position;
- authoritative corridor sampling;
- traveler position;
- spatial camera position;
- House & Garden severance;
- Cave progression mechanics;
- Canyon handoff;
- state derivation;
- Wildflower ownership/topology;
- Wildflower Drift;
- deferred Deep behavior.

Also forbidden:

- vertex displacement;
- position noise;
- independently repositioned visible Bend geometry;
- hidden camera translation;
- a new derived state field;
- geometry changes disguised as visual craft.

If such a change is required:

**STOP**

Do not broaden the implementation boundary.

---

## 6. Evidence/instrumentation changes

Evidence code is not automatically implementation code.

Any new instrumentation required for:

- progress identification;
- derived-state display;
- build-marker display;
- frame attribution;

must be separately classified as:

**EVIDENCE / INSTRUMENTATION**

For every such change record:

**File:**

**Purpose:**

**Runtime effect:**

**Why it does not affect Cave spatial truth:**

Evidence instrumentation must not become a back door for modifying the visual result being evaluated.

---

## 7. Generated evidence

The following may be produced by Pass 1 but are not implementation:

- screenshots;
- frame captures;
- capture records;
- hashes;
- test output;
- structural-verification records;
- build-attribution records.

Classify them as:

**EVIDENCE ARTIFACT**

Do not mix their additions into the implementation-diff inventory.

---

## 8. Implementation inventory

At return, Kesh must provide a positive inventory of the actual implementation files.

For each:

**File:**

**Classification:** IMPLEMENTATION

**Purpose:**

**Authorized visual technique:**

**Spatial effect:** NONE

**Pass 1 stage served:** MOUTH / COMPRESSION / BEND / MULTIPLE

There must be no unexplained changed file.

---

## 9. Repository delta classification

Every path differing from the pinned baseline/current pre-Pass-1 state must resolve into exactly one class:

- **PRE-EXISTING**
- **GOVERNANCE**
- **IMPLEMENTATION**
- **EVIDENCE / INSTRUMENTATION**
- **EVIDENCE ARTIFACT**
- **UNAUTHORIZED / UNEXPLAINED**

No path may be silently ignored.

Any **UNAUTHORIZED / UNEXPLAINED** implementation-affecting path blocks structural PASS until resolved.

---

## 10. Two comparisons are required

Do not treat one Git diff as the complete ownership record.

### Baseline comparison

Compare the completed worktree against:

`0e5afc1eae616bb0f736a82b5ff75944176811b2`

Purpose:

**Determine whether protected baseline truth still holds.**

### Pass 1 ownership comparison

Compare the completed worktree against the recorded worktree state immediately before Kesh begins implementation.

Purpose:

**Determine what Pass 1 itself actually changed.**

These comparisons answer different questions.

**Baseline comparison = integrity.**

**Pre-Pass-1 comparison = ownership.**

Neither substitutes for the other.

---

# Acceptance condition

The implementation diff boundary passes only when:

- protected geometry/state remain byte-identical;
- every changed path is classified;
- pre-existing test changes remain separated;
- governance documents remain separated;
- evidence artifacts remain separated;
- every implementation delta is appearance-only;
- no Deep work entered the pass;
- no spatial-truth change entered the pass;
- no unrelated repository change is attributed to Pass 1.

## Final implementation-diff disposition

- [ ] **BOUNDARY PASS**
- [ ] **BOUNDARY HOLD**
- [ ] **BOUNDARY FAIL**

### BOUNDARY PASS

Every delta has known provenance and the implementation subset remains entirely inside the issued grant.

### BOUNDARY HOLD

One or more deltas cannot yet be classified or attributed confidently.

Do not proceed to structural PASS until resolved.

### BOUNDARY FAIL

Pass 1 implementation altered protected spatial truth or exceeded its authorized boundary.

Do not proceed to frame review.

---

## Final rule

**Git tells us what differs. Provenance tells us which differences belong to Pass 1.**

Do not confuse the two.
