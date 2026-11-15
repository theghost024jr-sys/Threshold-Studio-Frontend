# Cave Corridor — A6 Evidence Checklist

**Study:** A6 — Bend Non-Rescue  
**Pass:** Visual Gate Pass 1 — Surface Language  
**Authority:** Revision 3  
**Review protocol:** Blinded X/Y → locked C1–C5 → unblind → R7  
**Implementation authority created here:** NONE

## Purpose

Produce a complete, attributable, and controlled A6 evidence package.

**This checklist prepares evidence. It does not score A6.**

## 1. Commit and build identity

Before capture:

- [ ] Implementation is committed.
- [ ] Commit hash recorded.
- [ ] Worktree status recorded.
- [ ] Served URL recorded.
- [ ] Build marker recorded.
- [ ] Served page exposes the expected build marker.
- [ ] Capture session uses that verified build.

**Commit:**  
**Build marker:**  
**Served URL:**  

If build identity is uncertain:

**STOP — NOT REVIEWABLE**

## 2. Revision 3 structural eligibility

Verify before any A6 frame counts.

### Floor / ceiling

- [ ] Floor returns to sampler exactly.
- [ ] Floor deviation = `0`.
- [ ] Ceiling returns to sampler exactly.
- [ ] Ceiling deviation = `0`.

### Frozen wall field

- [ ] Wall relief preserves the frozen Revision 3 field.
- [ ] Coefficient `0.11` unchanged.
- [ ] Vertical wall factor `0.45` unchanged.
- [ ] Frequencies `1.9 / 4.1 / 2.7 / 1.6` unchanged.
- [ ] Signs unchanged.
- [ ] Phases unchanged.
- [ ] No third term.
- [ ] No new noise source.
- [ ] No per-sample positional offset.
- [ ] Station spacing does not exceed `0.25 m`.

### Inside-Bend guard

- [ ] Inside wall only.
- [ ] Guard factor = `0` across `14.000 → 18.712 m`.
- [ ] Approximately `1.5 m` ramp before guarded span.
- [ ] Approximately `1.5 m` ramp after guarded span.
- [ ] Guard factor remains within `[0,1]`.
- [ ] Guard suppresses existing relief only.
- [ ] Guard never adds relief.
- [ ] Guard never inverts relief.
- [ ] Inside/outside determination required no unauthorized guess.

If inside/outside classification is ambiguous:

**STOP AND ASK**

## 3. Protected evidence

- [ ] Protected geometry hash recorded and valid.
- [ ] Protected state hash recorded and valid.
- [ ] Protected files satisfy the current grant.
- [ ] Focused Cave regression suites run.
- [ ] Actual passed/failed counts recorded.
- [ ] Exit codes recorded.

**Geometry hash:**  
**State hash:**  

**Regression result:**  

A sampler-only severance test is structural evidence. It is **not** visual A6 evidence.

## 4. Establish the capture state

Use one Bend state for both treatments.

Record:

- [ ] Exact progress.
- [ ] Dominant zone.
- [ ] Derived state.
- [ ] Traveler position.
- [ ] Look direction.
- [ ] Camera position.
- [ ] FOV.
- [ ] Exposure.
- [ ] Viewport dimensions.

These values become the frozen A/B capture conditions.

**Progress:**  
**Traveler position:**  
**Look direction:**  
**Camera position:**  
**FOV:**  
**Exposure:**  
**Viewport:**  

## 5. Capture crystal-present master

Capture the verified Bend with authorized crystal expression present.

- [ ] State matches Section 4.
- [ ] Build identity visible or recorded.
- [ ] No post-capture manipulation changes spatial content.
- [ ] Original master preserved.

Identify internally as:

**A6 — CRYSTAL PRESENT**

Do not expose that identity to the blinded reviewer.

## 6. Capture crystal-absent master

Remove **crystal expression only**.

Remove where applicable:

- [ ] Crystal geometry/expression.
- [ ] Crystal-specific emissive response.
- [ ] Crystal-specific cyan response.
- [ ] Crystal glints/sparkle.
- [ ] Crystal-specific light contribution.
- [ ] Crystal-derived aperture/route cue.

Do not change:

- [ ] Progress.
- [ ] Derived state.
- [ ] Traveler position.
- [ ] Look direction.
- [ ] Camera position.
- [ ] FOV.
- [ ] Exposure.
- [ ] Viewport.
- [ ] Shell.
- [ ] Bend guard.
- [ ] Stone treatment.
- [ ] Non-crystal lighting.
- [ ] Fog.

Capture and preserve the original master.

Identify internally as:

**A6 — CRYSTAL ABSENT**

## 7. A/B equivalence check

Before blinding, verify:

- [ ] Same commit/build.
- [ ] Same progress.
- [ ] Same derived state.
- [ ] Same viewpoint.
- [ ] Same camera.
- [ ] Same FOV/exposure.
- [ ] Same dimensions.
- [ ] Same shell.
- [ ] Same guard.
- [ ] Same non-crystal environment.
- [ ] Only intended crystal expression differs.

Any uncontrolled material difference:

**STOP — A/B CONTROL INVALID**

Do not submit the pair.

## 8. Prepare blinded pair

Randomly assign the two master frames:

- [ ] Frame X.
- [ ] Frame Y.

Ensure blinded files reveal neither treatment through:

- [ ] Filename.
- [ ] Caption.
- [ ] Metadata presented to reviewer.
- [ ] Ordering description.
- [ ] Surrounding instructions.

Create a separate identity key:

**Frame X =** ____________________  
**Frame Y =** ____________________

Seal the key until scores are locked.

## 9. Blinded-review packet

Give the reviewer only:

- [ ] Frame X.
- [ ] Frame Y.
- [ ] C1–C5 scoring definitions.
- [ ] Space for observations.
- [ ] Space for confidence.
- [ ] Space to state which frame reads the Bend more clearly.

Do **not** give the reviewer:

- [ ] Crystal identities.
- [ ] R7 pass threshold.
- [ ] Required C1–C3 scores.
- [ ] Allowed delta.
- [ ] Desired disposition.
- [ ] Any hint about which result is expected.

## 10. Lock review

Before unblinding, obtain:

- [ ] X C1 score.
- [ ] X C2 score.
- [ ] X C3 score.
- [ ] X C4 score.
- [ ] X C5 score.
- [ ] X total.
- [ ] Y C1 score.
- [ ] Y C2 score.
- [ ] Y C3 score.
- [ ] Y C4 score.
- [ ] Y C5 score.
- [ ] Y total.
- [ ] Reviewer observations.
- [ ] Reviewer comparison.
- [ ] Reviewer confidence.
- [ ] Confirmation scoring is locked.

**Scores locked:** YES / NO

If NO:

**DO NOT UNBLIND**

## 11. Unblind

Only after Section 10 is complete:

- [ ] Reveal X/Y identity.
- [ ] Assign crystal-absent score as **A**.
- [ ] Assign crystal-present score as **B′**.
- [ ] Record signed delta `B′ − A`.
- [ ] Record absolute delta `|A − B′|`.
- [ ] Record material richness separately.

**A:** __ / 10  
**B′:** __ / 10  
**B′ − A:** __  
**|A − B′|:** __  

**Richness enters C1–C5:** **NO**

## 12. Apply R7

Only now apply the recorded R7 analysis rule.

Record one:

- [ ] **PASS ELIGIBLE**
- [ ] **FAIL — CRYSTAL CARRIES**
- [ ] **FAIL — CRYSTAL MISDIRECTS**
- [ ] **FAIL — RENDERED BEND INSUFFICIENT**
- [ ] **HOLD — CRYSTAL DEPENDENCY**
- [ ] **HOLD — CRYSTAL DEGRADATION**
- [ ] **NOT REVIEWABLE**

Check separately:

- [ ] No automatic non-pass condition triggered.
- [ ] Blinding remained valid.
- [ ] Attribution remained valid.
- [ ] A/B control remained valid.

# A6 evidence manifest

The completed evidence package contains:

- [ ] Commit/build record.
- [ ] Revision 3 numeric structural checks.
- [ ] Protected hashes.
- [ ] Focused regression results.
- [ ] Capture-state record.
- [ ] Crystal-present master.
- [ ] Crystal-absent master.
- [ ] Blinded Frame X.
- [ ] Blinded Frame Y.
- [ ] Sealed X/Y identity key.
- [ ] Locked C1–C5 scorecard.
- [ ] Reviewer observations and confidence.
- [ ] Unblinded A/B′ record.
- [ ] Signed and absolute delta.
- [ ] Automatic non-pass check.
- [ ] R7 disposition.
- [ ] One-sentence finding.

## Final evidence status

- [ ] **COMPLETE — READY FOR R7 DISPOSITION**
- [ ] **INCOMPLETE — NOT REVIEWABLE**
- [ ] **INVALID — RECAPTURE REQUIRED**

**Missing/invalid evidence:**  

**Final finding:**  

## Governing evidence rule

**One build. One Bend state. Two treatments. One changed variable. Blind first, score second, unblind third, R7 last.**

The A/B equivalence check is its own gate before blinding. If the crystal-free capture quietly differs in camera, fog, exposure, shell, or state, careful blinded scoring cannot repair the experiment afterward.
