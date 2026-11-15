# Cave Corridor — Build Attribution Protocol

**Purpose:** Attribute a served Cave Corridor build to one immutable Git commit before Revision 3 eligibility evidence is collected.
**Scope:** Build identity, commit verification, and evidence retention only.
**A6 authority created here:** NONE

This protocol must pass before the Revision 3 Structural Eligibility Checklist can mark build identity as PASS.

**Implementation status:** The Portal build now writes this marker and the Worker serves it at the specified endpoint. Attribution remains incomplete until a clean committed build produces, serves, and retains the required evidence.

## 1. Build-marker format

The served build exposes one machine-readable marker at:

```text
/portal/build-marker.json
```

Its response must be JSON with exactly these required fields:

```json
{
  "schema": "threshold-build-marker/v1",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "tree": "0123456789abcdef0123456789abcdef01234567",
  "worktree": "clean",
  "builtAtUtc": "2026-11-15T06:30:32Z"
}
```

### Field rules

| Field | Format | Rule |
| --- | --- | --- |
| `schema` | Exact literal | Must equal `threshold-build-marker/v1`. |
| `commit` | 40 lowercase hexadecimal characters | Must name the Git commit used for the build. |
| `tree` | 40 lowercase hexadecimal characters | Must equal `git rev-parse <commit>^{tree}`. |
| `worktree` | Exact literal `clean` | The marker must never be emitted from an uncommitted source tree. |
| `builtAtUtc` | UTC ISO 8601 timestamp ending in `Z` | Records when the attributable build was produced. |

The marker is invalid if any required field is missing, a hash is abbreviated, `worktree` is not `clean`, or the served marker cannot be retrieved from the Cave URL origin.

### Served-page discovery

The Cave page must link its marker without depending on visual presentation:

```html
<link rel="alternate" type="application/json" title="Threshold build marker" href="/portal/build-marker.json">
```

The marker endpoint is authoritative. The link only makes discovery inspectable in the served document. A visible overlay, screenshot label, URL query parameter, or manually typed commit hash is **not** a build marker.

## 2. Commit verification checklist

Complete this checklist from `C:\Threshold` before evidence capture.

### A. Verify the candidate commit

```powershell
$commit = '<40-character candidate commit>'
git rev-parse --verify "$commit^{commit}"
git rev-parse "$commit^{tree}"
git show --format=fuller --stat --no-ext-diff $commit
```

- [ ] Candidate resolves to a commit object.
- [ ] Full 40-character commit hash recorded.
- [ ] Tree hash recorded.
- [ ] Commit metadata and changed-file summary retained.

**Commit:**
**Tree:**
**Commit evidence location:**

### B. Verify source cleanliness before build

```powershell
$checkedOutCommit = git rev-parse HEAD
if ($checkedOutCommit -ne $commit) { throw 'The current checkout is not the candidate commit.' }
git status --porcelain=v1 --untracked-files=all
git diff --check
```

- [ ] Current checkout is exactly the candidate commit.
- [ ] `git status --porcelain=v1 --untracked-files=all` produces no output.
- [ ] `git diff --check` produces no output.

**Clean-status evidence location:**

If any command reports a change: **STOP — BUILD NOT ATTRIBUTABLE**

### C. Build the served Portal

```powershell
npm --prefix website/portal run build:site
```

- [ ] Build exit code is `0`.
- [ ] Complete build output retained.
- [ ] Output was produced from the clean candidate checkout.

**Build-log evidence location:**
**Build exit code:**

### D. Start and identify the served build

Use the repository-standard Pages command for the static output:

```powershell
npx wrangler pages dev website --port 8790
```

From a second PowerShell session, retrieve the marker:

```powershell
$origin = 'http://127.0.0.1:8790'
$markerUrl = "$origin/portal/build-marker.json"
$markerResponse = Invoke-WebRequest -UseBasicParsing $markerUrl
$marker = $markerResponse.Content | ConvertFrom-Json

$markerResponse.StatusCode
$markerResponse.Headers
$marker | ConvertTo-Json -Compress
```

- [ ] Served marker endpoint returns HTTP `200`.
- [ ] `schema` equals `threshold-build-marker/v1`.
- [ ] `commit` equals the candidate commit exactly.
- [ ] `tree` equals the recorded candidate tree exactly.
- [ ] `worktree` equals `clean`.
- [ ] Served Cave page contains the alternate marker link.

**Served URL:**
**Marker URL:**
**Marker response SHA-256:**
**Page-link evidence location:**

### E. Verify marker/commit agreement

```powershell
$markerCommit = $marker.commit
$markerTree = $marker.tree

git rev-parse --verify "$markerCommit^{commit}"
$actualTree = git rev-parse "$markerCommit^{tree}"

if ($markerCommit -ne $commit) { throw 'Marker commit does not match candidate commit.' }
if ($markerTree -ne $actualTree) { throw 'Marker tree does not match Git.' }
if ($marker.worktree -ne 'clean') { throw 'Marker does not certify a clean source tree.' }
```

- [ ] Marker commit resolves.
- [ ] Marker commit equals candidate commit.
- [ ] Marker tree equals the Git commit tree.
- [ ] Marker certifies a clean source tree.

**Marker agreement:** [ ] PASS  [ ] FAIL

## 3. Retained build evidence

Retain the following immutable artifacts beneath the evidence package’s commit-specific directory:

```text
evidence/cave-corridor/revision-3/<commit>/
```

The evidence directory name uses the full 40-character commit hash. Do not mix artifacts from different commits in one directory.

| ID | Retained artifact | Minimum content |
| --- | --- | --- |
| B-01 | `commit.txt` | Full output of `git show --format=fuller --stat --no-ext-diff <commit>`. |
| B-02 | `source-status.txt` | Output of `git status --porcelain=v1 --untracked-files=all` and `git diff --check` from the candidate checkout. |
| B-03 | `portal-build.log` | Complete `npm --prefix website/portal run build:site` output and exit code. |
| B-04 | `served-marker.json` | Exact response body from `/portal/build-marker.json`, unmodified. |
| B-05 | `served-marker-headers.txt` | HTTP status and response headers for the marker request. |
| B-06 | `served-marker.sha256` | SHA-256 of `served-marker.json`. |
| B-07 | `cave-page-marker-link.html` | The retained served-page fragment containing the alternate marker link. |
| B-08 | `protected-file-hashes.txt` | SHA-256 values for `CaveCorridorGeometry.js` and `CaveCorridorState.js`. |
| B-09 | `viewport-diff.patch` | `git diff <baseline> -- website/portal/src/pages/CaveCorridorViewport.jsx`. |
| B-10 | `verification-summary.txt` | Candidate commit, tree, marker URL, marker verification result, and all command exit codes. |

### Retention rules

- [ ] Every retained text artifact uses UTF-8.
- [ ] Raw command output is retained before interpretation or summarization.
- [ ] Every retained file has a SHA-256 recorded in the Revision 3 manifest.
- [ ] The marker response is retained unchanged.
- [ ] The build removes any existing ignored `portal-dist/build-marker.json` before attempting generation; a failed dirty build therefore leaves no stale marker to serve.
- [ ] Evidence directories are immutable after final disposition; corrections create a new evidence package.
- [ ] A new commit creates a new package. Evidence must not be copied forward as proof for another commit.

## 4. Build-attribution disposition

Select exactly one:

- [ ] **ATTRIBUTED — READY FOR REVISION 3 ELIGIBILITY CHECKS**
- [ ] **NOT ATTRIBUTED — STOP**

**Commit:**
**Tree:**
**Marker URL:**
**Retention directory:**
**Missing or invalid evidence:**
**One-sentence finding:**

## Governing rule

**One clean commit, one matching tree, one served marker, and one retained evidence package.**

If any of those identities differ, the build is not attributable and Revision 3 eligibility—and therefore A6—remains **NOT REVIEWABLE**.
