# Cave Corridor — Revision 3 Eligibility Evidence Manifest

**Purpose:** Index the immutable evidence used to complete the Revision 3 Structural Eligibility Checklist.  
**Scope:** Structural eligibility only; not an A6 reviewer packet.  
**Eligibility checklist:** `CAVE_CORRIDOR_REVISION_3_STRUCTURAL_ELIGIBILITY_CHECKLIST.md`

Complete this manifest only with retained command output, source snapshots, build evidence, or test reports. Do not substitute recollection for an evidence location.

## 1. Build and provenance evidence

| ID | Required evidence | Capture command or source | Artifact path / URL | SHA-256 | Captured by | Date/time |
| --- | --- | --- | --- | --- | --- | --- |
| R3-01 | Branch, HEAD, baseline resolution, worktree status | Checklist §1 command |  |  |  |  |
| R3-02 | Commit object / implementation commit | `git show --stat <commit>` |  |  |  |  |
| R3-03 | Served URL and build marker | Browser capture or terminal output |  |  |  |  |

## 2. Numeric shell evidence

| ID | Required evidence | Capture command or source | Artifact path / URL | SHA-256 | Captured by | Date/time |
| --- | --- | --- | --- | --- | --- | --- |
| R3-04 | Floor sampler-deviation measurement | Checklist §2 method |  |  |  |  |
| R3-05 | Ceiling sampler-deviation measurement | Checklist §3 method |  |  |  |  |
| R3-06 | Frozen wall-field source and reference samples | Checklist §4 command and samples |  |  |  |  |
| R3-07 | Wall envelope extrema and minimum half-width | Checklist §5 measurement |  |  |  |  |
| R3-08 | Station-spacing measurement | Checklist §6 command |  |  |  |  |

## 3. Guard and sampler-authority evidence

| ID | Required evidence | Capture command or source | Artifact path / URL | SHA-256 | Captured by | Date/time |
| --- | --- | --- | --- | --- | --- | --- |
| R3-09 | Inside-Bend zero span, ramps, and factor bounds | Checklist §7 command and measurement |  |  |  |  |
| R3-10 | Inside/outside wall classification | Source derivation / test output |  |  |  |  |
| R3-11 | Sampler-authority inspection | Checklist §8 evidence |  |  |  |  |

## 4. Protected identity and regression evidence

| ID | Required evidence | Capture command or source | Artifact path / URL | SHA-256 | Captured by | Date/time |
| --- | --- | --- | --- | --- | --- | --- |
| R3-12 | Protected-file hashes and baseline comparison | Checklist §9 command |  |  |  |  |
| R3-13 | Focused Vitest output | Checklist §10 Vitest command |  |  |  |  |
| R3-14 | Native Node regression output | Checklist §10 Node command |  |  |  |  |
| R3-15 | Viewport diff and unauthorized-change inspection | Checklist §11 command |  |  |  |  |

## 5. Disposition record

| Field | Value |
| --- | --- |
| Checklist completed by |  |
| Checklist completion date/time |  |
| Final disposition | ELIGIBLE / NOT ELIGIBLE / STOP |
| Missing or invalid evidence |  |
| One-sentence structural finding |  |

## Manifest completeness

- [ ] Every applicable `R3-01` through `R3-15` row has an artifact location or an explicitly recorded reason it is inapplicable.
- [ ] Artifact hashes are recorded for retained files.
- [ ] Evidence predates the final disposition.
- [ ] The checklist’s final disposition agrees with this manifest.
- [ ] No A6 master, X/Y frame, scorecard, or R7 analysis is included.

**Manifest status:** [ ] COMPLETE  [ ] INCOMPLETE  [ ] INVALID
