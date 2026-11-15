# Cave Corridor — Revision 3 Structural Eligibility Checklist

**Purpose:** Collect the evidence required to determine whether a Cave Corridor build may enter A6 Bend Non-Rescue evidence production.  
**Scope:** Revision 3 structural eligibility only  
**A6 status until this checklist passes:** **NOT REVIEWABLE**  
**Implementation authority created here:** NONE

This is a fillable evidence checklist. Record observed values, command output locations, and a disposition for every applicable item. It does not judge visual quality, create blinded frames, or apply R7.

## 1. Build identity

### Evidence commands

Run from `C:\Threshold`:

```powershell
$baseline = '0e5afc1eae616bb0f736a82b5ff75944176811b2'
git branch --show-current
git rev-parse HEAD
git rev-parse $baseline
git status --short

$servedUrl = 'http://127.0.0.1:8790/portal/cave-corridor'
$response = Invoke-WebRequest -UseBasicParsing $servedUrl
Write-Output "HTTP status: $($response.StatusCode)"
Write-Output "Served URL: $servedUrl"
Write-Output "Build marker: <record the marker exposed by the served page, or NOT PRESENT>"
```

### Record

**Workspace:** `C:\Threshold`  
**Branch:**  
**Commit:**  
**Baseline:** `0e5afc1eae616bb0f736a82b5ff75944176811b2`  
**Worktree status evidence:**  
**Served URL:**  
**Build marker:**  
**Build-marker evidence:**  

- [ ] Implementation is committed.
- [ ] Commit resolves.
- [ ] Worktree status recorded.
- [ ] Served URL recorded.
- [ ] Build marker readable.
- [ ] Served build corresponds to the recorded commit.

**Build identity:** [ ] PASS  [ ] NOT ESTABLISHED

If build identity is uncertain: **STOP — NOT REVIEWABLE**

## 2. Floor return to sampler

Revision 3 grants no floor displacement.

### Evidence commands

```powershell
rg -n "function caveShellPoint|kind === 'floor'|kind === 'ceiling'|vertices.push" website\portal\src\pages\CaveCorridorViewport.jsx
```

**Measurement method / script:**  
**Measurement output location:**  
**Maximum floor deviation from sampler:** ______ m

- [ ] Floor uses sampler coordinates unchanged.
- [ ] Maximum deviation = exactly `0`.
- [ ] No floor displacement term remains.
- [ ] No floor-specific noise remains.
- [ ] No per-sample floor offset remains.

**Floor eligibility:** [ ] PASS  [ ] FAIL

## 3. Ceiling return to sampler

Revision 3 grants no ceiling displacement.

**Measurement method / script:**  
**Measurement output location:**  
**Maximum ceiling deviation from sampler:** ______ m

- [ ] Ceiling uses sampler coordinates unchanged.
- [ ] Maximum deviation = exactly `0`.
- [ ] No ceiling displacement term remains.
- [ ] No ceiling-specific noise remains.
- [ ] No per-sample ceiling offset remains.

**Ceiling eligibility:** [ ] PASS  [ ] FAIL

## 4. Frozen wall field

### Required field parameters

| Parameter | Required | Observed | Result |
| --- | ---: | ---: | --- |
| Primary coefficient | `0.11` |  | PASS / FAIL |
| Wall vertical factor | `0.45` |  | PASS / FAIL |
| Frequency 1 | `1.9` |  | PASS / FAIL |
| Frequency 2 | `4.1` |  | PASS / FAIL |
| Frequency 3 | `2.7` |  | PASS / FAIL |
| Frequency 4 | `1.6` |  | PASS / FAIL |

### Evidence commands

```powershell
rg -n "function caveShellPoint|0\.11|0\.45|1\.9|4\.1|2\.7|1\.6" website\portal\src\pages\CaveCorridorViewport.jsx
```

**Source evidence location:**  

- [ ] Signs unchanged.
- [ ] Phases unchanged.
- [ ] No third relief term introduced.
- [ ] No new noise source introduced.
- [ ] No per-sample positional offset introduced.

### Reference samples

| Sample | Required value | Observed value | Evidence location | Result |
| --- | --- | --- | --- | --- |
| 1 |  |  |  | PASS / FAIL |
| 2 |  |  |  | PASS / FAIL |
| 3 |  |  |  | PASS / FAIL |

**Frozen wall field:** [ ] PASS  [ ] FAIL

## 5. Wall envelope

| Measure | Required | Observed | Evidence location | Result |
| --- | ---: | ---: | --- | --- |
| Maximum lateral relief | `±0.1595 m` |  |  | PASS / FAIL |
| Maximum vertical wall relief | `±0.0718 m` |  |  | PASS / FAIL |
| Narrowest sampler half-width | `0.75 m` |  |  | PASS / FAIL |
| Minimum resulting half-width | `0.5905 m` |  |  | PASS / FAIL |

- [ ] Lateral field remains within Revision 3 baseline.
- [ ] Vertical wall field remains within Revision 3 baseline.
- [ ] No additional displacement expands the envelope.
- [ ] Pass 1 envelope has not been treated as Pass 2 authority.

**Wall envelope:** [ ] PASS  [ ] FAIL

## 6. Station spacing

### Evidence commands

```powershell
rg -n "corridorSamples\(" website\portal\src\pages\CaveCorridorViewport.jsx
```

**Maximum observed station spacing:** ______ m  
**Evidence location:**  

- [ ] Maximum spacing ≤ `0.25 m`.
- [ ] Reduced spacing converges on the same frozen field.
- [ ] Sampling-density change does not retune the field.

**Station spacing:** [ ] PASS  [ ] FAIL

## 7. Inside-Bend guard

| Guard property | Required | Observed | Evidence location | Result |
| --- | --- | --- | --- | --- |
| Applicable surface | Inside wall only |  |  | PASS / FAIL |
| Zero-relief span | `14.000 → 18.712 m` |  |  | PASS / FAIL |
| Approach ramp | Approximately `1.5 m` |  |  | PASS / FAIL |
| Exit ramp | Approximately `1.5 m` |  |  | PASS / FAIL |
| Guard form | Frozen wall field × factor |  |  | PASS / FAIL |
| Factor range | `[0,1]` |  |  | PASS / FAIL |

### Evidence commands

```powershell
rg -n "14\.000|18\.712|guard|inside|outside|factor" website\portal\src\pages\CaveCorridorViewport.jsx
```

- [ ] Guard factor exactly `0` throughout the zero span.
- [ ] No residual protected-wall relief remains inside the zero span.
- [ ] Approach ramp transitions monotonically toward `0`.
- [ ] Exit ramp transitions monotonically from `0` toward the frozen field.
- [ ] Guard never adds or inverts relief.
- [ ] Outside wall retains the frozen field.
- [ ] Inside/outside determination required no unresolved implementation guess.

If inside/outside determination is ambiguous: **STOP — ELIGIBILITY NOT ESTABLISHED**

**Inside-Bend guard:** [ ] PASS  [ ] FAIL  [ ] STOP

## 8. Sampler authority

- [ ] Route authority remains with the existing sampler.
- [ ] Relief consumes sampler geometry rather than authoring route geometry.
- [ ] Guard suppresses rendered relief only.
- [ ] Guard does not alter sampler coordinates.
- [ ] Derived state does not author geometry.
- [ ] No Pass 2 geometry authority has entered Revision 3 implementation.

**Evidence location:**  
**Sampler authority:** [ ] PASS  [ ] FAIL

## 9. Protected files

### Evidence commands

```powershell
$baseline = '0e5afc1eae616bb0f736a82b5ff75944176811b2'
Get-FileHash `
  website\portal\src\pages\CaveCorridorGeometry.js, `
  website\portal\src\pages\CaveCorridorState.js `
  -Algorithm SHA256

git diff --quiet $baseline -- `
  website/portal/src/pages/CaveCorridorGeometry.js `
  website/portal/src/pages/CaveCorridorState.js

if ($LASTEXITCODE -eq 0) {
  Write-Output 'Protected files: unchanged from baseline'
} else {
  Write-Output 'Protected files: changed from baseline'
}
```

| File | Current SHA-256 | Baseline/reference evidence | Result |
| --- | --- | --- | --- |
| `CaveCorridorGeometry.js` |  |  | PASS / FAIL |
| `CaveCorridorState.js` |  |  | PASS / FAIL |

- [ ] Geometry hash matches required protected state.
- [ ] State hash matches required protected state.
- [ ] No unauthorized protected-file change exists.

**Protected-file identity:** [ ] PASS  [ ] FAIL

## 10. Focused Cave regressions

Run the Vitest suites and the native Node suite separately.

### Vitest evidence command

```powershell
npx vitest run `
  website/tests/cave-corridor-manifest.test.mjs `
  website/tests/cave-corridor-chamber.test.mjs `
  website/tests/cave-corridor-bend-severance.test.mjs
```

**Vitest output location:**  
**Tests passed:**  
**Tests failed:**  
**Exit code:**  

### Node evidence command

```powershell
node --test website/tests/cave-corridor.test.mjs
```

**Node output location:**  
**Tests passed:**  
**Tests failed:**  
**Exit code:**  

- [ ] Focused Vitest Cave tests pass.
- [ ] Focused Node Cave tests pass.
- [ ] Bend mechanical severance remains intact.
- [ ] Existing progression mechanics remain intact.
- [ ] Existing handoff behavior remains intact where covered.

**Regression validation:** [ ] PASS  [ ] FAIL

> A green sampler/severance test is structural evidence. It does not prove that the rendered Bend is visually legible; that question belongs to A6.

## 11. Unauthorized-change check

### Evidence commands

```powershell
$baseline = '0e5afc1eae616bb0f736a82b5ff75944176811b2'
git diff --stat $baseline -- website/portal/src/pages/CaveCorridorViewport.jsx
git diff --check $baseline -- website/portal/src/pages/CaveCorridorViewport.jsx
git diff $baseline -- website/portal/src/pages/CaveCorridorViewport.jsx
```

- [ ] Protected state unchanged.
- [ ] Route authority unchanged.
- [ ] Progression mechanics unchanged.
- [ ] Deep unchanged.
- [ ] Strata, joints, ribs, and fractures unchanged.
- [ ] No Pass 2 geometry entered Revision 3.
- [ ] No unrelated Threshold surfaces changed.

**Diff/provenance evidence location:**  
**Unauthorized-change check:** [ ] PASS  [ ] FAIL

# Revision 3 eligibility summary

| Check | Result | Evidence location |
| --- | --- | --- |
| Build identity | PASS / NOT ESTABLISHED |  |
| Floor = sampler | PASS / FAIL |  |
| Ceiling = sampler | PASS / FAIL |  |
| Frozen wall field | PASS / FAIL |  |
| Wall envelope | PASS / FAIL |  |
| Station spacing | PASS / FAIL |  |
| Inside-Bend guard | PASS / FAIL / STOP |  |
| Sampler authority | PASS / FAIL |  |
| Protected-file identity | PASS / FAIL |  |
| Focused regressions | PASS / FAIL |  |
| Unauthorized-change check | PASS / FAIL |  |

# Final disposition

Select exactly one:

- [ ] **REVISION 3 STRUCTURALLY ELIGIBLE**
- [ ] **REVISION 3 NOT ELIGIBLE**
- [ ] **STOP — ELIGIBILITY UNRESOLVED**

**Commit/build evidence:**  
**Numeric shell evidence:**  
**Guard evidence:**  
**Protected-file evidence:**  
**Regression evidence:**  
**Diff/provenance evidence:**  
**Unresolved items:**  
**Final finding:**  

## Eligibility rule

**REVISION 3 STRUCTURALLY ELIGIBLE** requires every applicable check above to PASS.

A visual result cannot cure a structural failure. A sampler test cannot certify the rendered Bend. An unresolved inside/outside wall determination remains a STOP.

## Consequence

### If REVISION 3 STRUCTURALLY ELIGIBLE

**A6 becomes eligible for evidence production.** Proceed to:

**A/B equivalence → crystal-present/absent masters → blinded X/Y → locked C1–C5 → unblind → R7**

No visual disposition is implied by structural eligibility.

### If REVISION 3 NOT ELIGIBLE or STOP — ELIGIBILITY UNRESOLVED

**A6 remains NOT REVIEWABLE.**

Correct only within existing authority. Do not produce masters, blinded frames, scorecards, or an R7 disposition.

## Governing rule

**Revision 3 eligibility proves that the shell being shown to A6 is the shell that was actually granted. Nothing more.**
