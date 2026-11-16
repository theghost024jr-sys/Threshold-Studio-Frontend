# Kesh — A6 / R7 Blinded Review Handoff

**Status:** ISSUED REVIEW INSTRUCTION  
**Scope:** Cave Corridor A6 — Bend Non-Rescue  
**Rule:** R7 post-unblind threshold  
**Implementation authority:** NONE

## Purpose

Produce and hand off the A6 evidence so a blinded reviewer can determine whether the rendered Bend remains physically legible without crystal assistance.

R7 is an **analysis rule**, not a target for the reviewer.

## 1. A6 prerequisite

Do not submit A6 frames until Revision 3 structural eligibility is established:

- floor deviation from sampler = `0`;
- ceiling deviation from sampler = `0`;
- frozen wall field preserved outside the authorized guard;
- inside-wall guard satisfies Revision 3;
- protected hashes pass;
- focused Cave regressions pass;
- build attribution is complete.

Failure here means: **NOT REVIEWABLE**.

## 2. Produce the matched A/B pair

From the same verified build produce:

- **Crystal-present frame:** normal authorized crystal expression.
- **Crystal-absent frame:** all crystal expression removed.

Hold constant:

- progress;
- derived state;
- traveler position;
- look direction;
- camera position;
- FOV;
- exposure;
- viewport;
- shell;
- Bend guard;
- stone treatment;
- non-crystal lighting;
- fog.

**Only crystal expression may differ.**

## 3. Prepare blinded copies

Create randomized **Frame X** and **Frame Y**. The reviewer must not be able to determine from metadata, filename, label, or surrounding instructions which is crystal-present.

Keep the X/Y identity key separate. Do not reveal which contains crystal, the expected score, the R7 ≥8 threshold, the required C1–C3 values, or the allowed score delta.

## 4. Reviewer scores C1–C5

Each criterion is scored:

- `0` = absent / fails
- `1` = ambiguous / weak
- `2` = clearly present

| Criterion | Reading |
| --- | --- |
| C1 | Physical turn |
| C2 | Physical severance |
| C3 | Credible continuation |
| C4 | Occlusion reads as stone, not darkness |
| C5 | Spatial coherence |

Maximum: **10 points per frame**.

Material richness may be recorded separately. **Richness never enters the score.**

## 5. Lock before unblinding

Before revealing X/Y identity, obtain:

- [ ] X C1–C5 scores.
- [ ] Y C1–C5 scores.
- [ ] X total.
- [ ] Y total.
- [ ] Reviewer observations.
- [ ] Which frame, if either, reads the Bend more clearly.
- [ ] Reviewer confidence.
- [ ] Confirmation that scoring is locked.

Only then reveal which frame contains crystal.

## 6. Apply R7 after unblinding

Define:

- **A** = crystal-absent total
- **B′** = crystal-present total

Record:

- **Signed delta:** `B′ − A`
- **Absolute delta:** `|A − B′|`

### PASS ELIGIBLE

Requires:

- `A ≥ 8`
- `B′ ≥ 8`
- `|A − B′| ≤ 1`
- crystal-absent C1 = `2`
- crystal-absent C2 = `2`
- crystal-absent C3 = `2`
- no criterion in either frame = `0`
- no automatic non-pass condition
- valid attribution and A/B control

| Result | Disposition |
| --- | --- |
| Both ≥8 and delta ≤1 | **PASS ELIGIBLE** |
| A <8, B′ ≥8 | **FAIL — CRYSTAL CARRIES** |
| A ≥8, B′ <8 | **FAIL — CRYSTAL MISDIRECTS** |
| Both <8 | **FAIL — RENDERED BEND INSUFFICIENT** |
| Both ≥8 and B′ − A >1 | **HOLD — CRYSTAL DEPENDENCY** |
| Both ≥8 and A − B′ >1 | **HOLD — CRYSTAL DEGRADATION** |
| Invalid attribution/blind/control | **NOT REVIEWABLE** |

## 7. Automatic non-pass

Regardless of score, A6 does not pass if crystal:

- provides the light required to understand the Bend;
- marks the aperture;
- marks the route;
- explains severance;
- restores credible continuation that disappears without crystal;

or if:

- darkness, fog, or cropping substitutes for physical stone;
- the Revision 3 guard becomes the visible Bend cue;
- structural eligibility fails;
- attribution fails;
- A/B variable control fails.

## 8. Return packet

Return:

- [ ] Structural eligibility record.
- [ ] Build/commit attribution.
- [ ] Original crystal-present frame.
- [ ] Original crystal-absent frame.
- [ ] Blinded Frame X.
- [ ] Blinded Frame Y.
- [ ] Sealed X/Y identity key.
- [ ] Locked C1–C5 scores.
- [ ] Reviewer observations.
- [ ] Reviewer confidence.
- [ ] Unblinded A and B′ totals.
- [ ] Signed delta.
- [ ] Absolute delta.
- [ ] R7 disposition.
- [ ] Automatic non-pass check.
- [ ] One-sentence finding.

## Boundary

Kesh prepares attributable evidence. The blinded reviewer scores what is visible. R7 interprets the locked scores after unblinding.

**No participant may use knowledge of the R7 threshold to manufacture a passing review.**

R7 creates no authority to change geometry, state, crystal behavior, or the Revision 3 grant.

## Governing distinction

**CRYSTAL CARRIES:** crystal makes an insufficient Bend work.

**CRYSTAL MISDIRECTS / DEGRADES:** the Bend already works and crystal makes the spatial reading worse.

**PASS:** the Bend stands on stone in both treatments.

The safeguard is procedural separation: **Kesh controls evidence production, the reviewer controls blinded C1–C5 scoring, and R7 operates only after scores are locked and treatment identity is revealed.**
