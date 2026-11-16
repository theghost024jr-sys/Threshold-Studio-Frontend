# Cave Corridor — Revision 3 Structural Eligibility Record

**Purpose:** Establish whether the current Cave Corridor build is structurally eligible to enter A6 Bend Non-Rescue evidence production.  
**Scope:** Revision 3 structural eligibility only  
**A6 status before this record passes:** **NOT REVIEWABLE**  
**Recorded:** 2026-11-15

This record does not judge visual quality, score A6, create blinded frames, or apply R7.

---

## 1. Build identity

| Field | Observed value |
| --- | --- |
| Workspace | `C:\Threshold` |
| Branch | `cave-bend-walkthrough` |
| HEAD / commit | `0e5afc1eae616bb0f736a82b5ff75944176811b2` |
| Baseline | `0e5afc1eae616bb0f736a82b5ff75944176811b2` |
| Served URL | `http://127.0.0.1:8790/portal/cave-corridor` |
| Build marker | Not recorded |

Observed worktree changes include:

- modified `website/portal/cave-corridor`;
- modified `website/portal/cave-corridor-prototype`;
- modified `website/portal/src/pages/CaveCorridorViewport.jsx`;
- modified Cave test files;
- untracked governance documents and pre-existing artifacts.

| Check | Result | Evidence |
| --- | --- | --- |
| Implementation is committed | **FAIL** | `CaveCorridorViewport.jsx` is modified in the worktree. |
| Commit resolves | PASS | `HEAD` and the stated baseline both resolve to `0e5afc1eae616bb0f736a82b5ff75944176811b2`. |
| Worktree status recorded | PASS | Status recorded above. |
| Served URL recorded | PASS | URL recorded above. |
| Build marker readable | **NOT ESTABLISHED** | No build marker was captured. |
| Served build corresponds to recorded commit | **NOT ESTABLISHED** | The served working tree contains uncommitted changes and no verified build marker. |

**Build identity: NOT ESTABLISHED**

---

## 2. Floor return to sampler

Revision 3 grants no floor displacement.

The current renderer calls `caveShellPoint` for every floor vertex. Its floor branch applies:

```js
point[1] + Math.max(-0.035, relief * 0.3)
```

with the current two-term relief field bounded by `±0.1595 m`. Therefore the observed floor displacement range is `-0.035 m` to `+0.04785 m`, with a maximum absolute deviation of **`0.04785 m`**.

| Check | Result |
| --- | --- |
| Floor uses sampler coordinates unchanged | **FAIL** |
| Maximum deviation = exactly `0` | **FAIL** |
| No floor displacement term remains | **FAIL** |
| No floor-specific noise remains | **FAIL** |
| No per-sample floor offset remains | **FAIL** |

**Maximum floor deviation from sampler: `0.04785 m`**  
**Floor eligibility: FAIL**

---

## 3. Ceiling return to sampler

Revision 3 grants no ceiling displacement.

The current renderer calls `caveShellPoint` for every ceiling vertex. Its ceiling branch applies:

```js
point[1] - Math.max(-0.04, relief * 0.75)
```

with the current two-term relief field bounded by `±0.1595 m`. Therefore the observed ceiling displacement range is `-0.119625 m` to `+0.04 m`, with a maximum absolute deviation of **`0.119625 m`**.

| Check | Result |
| --- | --- |
| Ceiling uses sampler coordinates unchanged | **FAIL** |
| Maximum deviation = exactly `0` | **FAIL** |
| No ceiling displacement term remains | **FAIL** |
| No ceiling-specific noise remains | **FAIL** |
| No per-sample ceiling offset remains | **FAIL** |

**Maximum ceiling deviation from sampler: `0.119625 m`**  
**Ceiling eligibility: FAIL**

---

## 4. Frozen wall field

The current wall field is:

```js
(
  Math.sin(sample.distance * 1.9 + point[1] * 2.7)
  + Math.sin(sample.distance * 4.1 - point[1] * 1.6) * 0.45
) * 0.11
```

| Parameter | Required | Observed | Result |
| --- | ---: | ---: | --- |
| Primary coefficient | `0.11` | `0.11` | PASS |
| Wall vertical factor | `0.45` | `0.45` | PASS |
| Frequency 1 | `1.9` | `1.9` | PASS |
| Frequency 2 | `4.1` | `4.1` | PASS |
| Frequency 3 | `2.7` | `2.7` | PASS |
| Frequency 4 | `1.6` | `1.6` | PASS |

| Additional check | Result | Evidence |
| --- | --- | --- |
| Signs unchanged | PASS | Current expression matches the frozen two-term sign structure. |
| Phases unchanged | PASS | Current expression contains no additional phase offset. |
| No third relief term | PASS | Two sinusoidal terms only. |
| No new noise source | PASS | No noise source present in the field. |
| No per-sample positional offset | PASS | Wall position derives from this field; no additional wall-only offset was observed. |

### Reference samples

The three Revision 3 handoff sample coordinates and required values were not supplied in the current record inputs. They were therefore **not measured**.

| Sample | Required | Observed | Result |
| --- | --- | --- | --- |
| 1 | Not available | Not measured | NOT ESTABLISHED |
| 2 | Not available | Not measured | NOT ESTABLISHED |
| 3 | Not available | Not measured | NOT ESTABLISHED |

**Frozen wall field: NOT ESTABLISHED**

---

## 5. Wall envelope

| Field | Required | Observed |
| --- | ---: | ---: |
| Maximum lateral relief | `±0.1595 m` | `±0.1595 m` theoretical field bound |
| Maximum vertical wall relief | `±0.0718 m` | `±0.071775 m` theoretical field bound |
| Narrowest sampler half-width | `0.75 m` | Not independently measured |
| Minimum resulting half-width | `0.5905 m` | Not independently measured |

The observed wall formula produces the stated theoretical relief bounds. The sampler half-width and resulting minimum half-width were not numerically sampled in this record.

| Check | Result |
| --- | --- |
| Lateral field remains within Revision 3 baseline | PASS |
| Vertical wall field remains within Revision 3 baseline | PASS |
| No additional displacement expands the envelope | NOT ESTABLISHED |
| Pass 1 envelope has not been treated as Pass 2 authority | NOT ESTABLISHED |

**Wall envelope: NOT ESTABLISHED**

---

## 6. Station spacing

The renderer obtains samples with `corridorSamples(0.1)`.

| Check | Result |
| --- | --- |
| Maximum observed station spacing | `0.1 m` |
| Maximum spacing ≤ `0.25 m` | PASS |
| Reduced spacing converges on the same frozen field | NOT ESTABLISHED |
| Sampling-density change does not retune the field | PASS |

**Station spacing: PASS**

---

## 7. Inside-Bend guard

Required guard:

| Field | Required |
| --- | --- |
| Applicable surface | Inside wall only |
| Zero-relief span | `14.000 → 18.712 m` |
| Approach / exit ramp | Approximately `1.5 m` each |
| Form | Frozen wall field × factor |
| Factor range | `[0,1]` |

No distance-bounded guard or factor application was found in the current `caveShellPoint` implementation. The same wall displacement is applied to both sides after determining `side`.

| Check | Result |
| --- | --- |
| Guard factor exactly `0` throughout the zero span | **FAIL** |
| No residual wall relief in zero span | **FAIL** |
| Monotonic approach ramp | **FAIL** |
| Monotonic exit ramp | **FAIL** |
| Guard affects inside wall only | **FAIL** |
| Outside wall retains frozen field | **NOT ESTABLISHED** |
| Inside/outside requires no unresolved guess | **NOT ESTABLISHED** |

**Inside-Bend guard: FAIL**

---

## 8. Sampler authority

| Check | Result | Evidence |
| --- | --- | --- |
| Route authority remains with the existing sampler | PASS | Existing sampler supplies `corridorSamples(0.1)`. |
| Relief consumes sampler geometry rather than authoring route geometry | PASS | The renderer starts from sampler edge points. |
| Guard suppresses rendered relief only | **FAIL** | Required guard is absent. |
| Guard does not alter sampler coordinates | NOT APPLICABLE | Required guard is absent. |
| Derived state does not author geometry | PASS | No state-derived geometry authority observed. |
| No Pass 2 geometry authority has entered Revision 3 | **NOT ESTABLISHED** | Floor and ceiling shell displacement exceed the stated Revision 3 grant. |

**Sampler authority: FAIL**

---

## 9. Protected files

| File | Current SHA-256 | Baseline comparison |
| --- | --- | --- |
| `CaveCorridorGeometry.js` | `583C265C00C68E7CFDD534FFCAE109CE71EBE33DCD0684A45B795BB977D817CA` | Unchanged from baseline by Git diff |
| `CaveCorridorState.js` | `290D7FFF52E6B2C75D3031F5C35BB4E7BDB818D6032A415CF742C273D8620F1C` | Unchanged from baseline by Git diff |

| Check | Result |
| --- | --- |
| Geometry hash matches required protected state | PASS |
| State hash matches required protected state | PASS |
| No unauthorized protected-file change exists | PASS |

**Protected-file identity: PASS**

---

## 10. Focused Cave regressions

### Vitest

| Field | Observed value |
| --- | --- |
| Command | `npx vitest run website/tests/cave-corridor.test.mjs website/tests/cave-corridor-manifest.test.mjs website/tests/cave-corridor-chamber.test.mjs website/tests/cave-corridor-bend-severance.test.mjs` |
| Tests passed | `19` |
| Tests failed | `0` |
| Test files | `3 passed`, `1 failed` |
| Exit code | `1` |

The three Vitest suites passed their 19 tests. The native Node test file was included in the Vitest command and failed as a suite because it contains no Vitest suite.

### Node

| Field | Observed value |
| --- | --- |
| Command | `node --test website/tests/cave-corridor.test.mjs website/tests/cave-corridor-manifest.test.mjs website/tests/cave-corridor-chamber.test.mjs website/tests/cave-corridor-bend-severance.test.mjs` |
| Tests passed | `2` |
| Tests failed | `4` |
| Exit code | `1` |

This invocation was not a valid runner for the three Vitest suites. The native `cave-corridor.test.mjs` also failed one route-fallback assertion against the current served portal response.

| Check | Result |
| --- | --- |
| Focused Vitest Cave tests pass | **NOT ESTABLISHED** |
| Focused Node Cave tests pass | **FAIL** |
| Bend mechanical severance remains intact | NOT ESTABLISHED |
| Existing progression mechanics remain intact | NOT ESTABLISHED |
| Existing handoff behavior remains intact where covered | **FAIL** |

**Regression validation: FAIL**

### Evidence boundary

A green sampler/severance test proves sampler/mechanical behavior. It does **not** prove that the rendered Bend is visually legible. That question belongs to A6.

---

## 11. Unauthorized-change check

The implementation delta contains 181 additions and 33 deletions in `CaveCorridorViewport.jsx` relative to the baseline. It includes crystal presentation changes and the floor, ceiling, and wall render-shell displacement function.

| Check | Result |
| --- | --- |
| Protected state unchanged | PASS |
| Route authority unchanged | PASS |
| Progression mechanics unchanged | PASS |
| Deep unchanged | **NOT ESTABLISHED** |
| Strata, joints, ribs, and fractures unchanged | NOT ESTABLISHED |
| No Pass 2 geometry | **FAIL** — render-only floor and ceiling displacement remains. |
| No unrelated Threshold surfaces changed | NOT ESTABLISHED |

**Unauthorized-change check: FAIL**

---

# Revision 3 eligibility summary

| Check | Result |
| --- | --- |
| Build identity | NOT ESTABLISHED |
| Floor = sampler | FAIL |
| Ceiling = sampler | FAIL |
| Frozen wall field | NOT ESTABLISHED |
| Wall envelope | NOT ESTABLISHED |
| Station spacing | PASS |
| Inside-Bend guard | FAIL |
| Sampler authority | FAIL |
| Protected-file identity | PASS |
| Focused regressions | FAIL |
| Unauthorized-change check | FAIL |

# Final disposition

- [ ] **REVISION 3 STRUCTURALLY ELIGIBLE**
- [x] **REVISION 3 NOT ELIGIBLE**
- [ ] **STOP — ELIGIBILITY UNRESOLVED**

## Evidence supporting disposition

**Commit/build evidence:** The visual implementation is uncommitted, no build marker was captured, and the served build cannot be attributed to the recorded commit.  

**Numeric shell evidence:** Floor deviation is `0.04785 m` maximum absolute; ceiling deviation is `0.119625 m` maximum absolute. Revision 3 requires exactly `0` for both.  

**Guard evidence:** No inside-wall-only zero span or transition ramps were present in the current render-shell function.  

**Protected-file evidence:** Both protected files remain unchanged from the stated baseline.  

**Regression evidence:** The three Vitest suites recorded 19 passing tests, but the complete focused command exited `1`; the native route-fallback test also failed against the served portal response.  

**Diff/provenance evidence:** The current viewport worktree delta includes non-Revision-3 floor and ceiling render displacement.  

**Unresolved items:** Build marker, reference wall samples, numerical width sampling, and a valid focused Node regression invocation remain incomplete. These unresolved items do not cure the recorded structural failures.

## Consequence

**A6 remains NOT REVIEWABLE.**

Do not produce crystal-present or crystal-absent masters, blinded frames, scorecards, or an R7 disposition from this build.

## Governing rule

**Revision 3 eligibility proves that the shell being shown to A6 is the shell that was actually granted. Nothing more.**
