# External Pages-Staging Runner Test Plan

## Status

**Documentation-only test plan.** No runner implementation is created or exercised by this plan.

Each eventual test uses real temporary Git repositories for the candidate and runner, a fresh
external staging root, and injected Git/Vite adapters. Tests must never use `C:\Threshold`, a
preserved Cave worktree, global Vite resolution, or prior publication output.

## Shared fixtures

| Fixture | Construction | Required assertions |
| --- | --- | --- |
| `candidate` | Temporary committed Git worktree containing tracked fallback placeholders, public vault data, `worker.js`, candidate-local Vite fixture, and ignored `website/data/vault-index.json`. | Returns explicit root, full commit, tree, source hashes, and initial ignored-input snapshot. |
| `runner` | Separate temporary committed Git worktree containing every declared runner module. | Returns explicit root, full commit, tree, ordered executed-module hashes, and clean status. |
| `stage` | New empty directory outside both fixture roots. | Canonical parent path is distinct from candidate and runner; no marker exists initially. |
| `vite` | Injected adapter that records explicit executable/config/output arguments and writes deterministic output only to stage. | Rejects an executable/config outside candidate, an output outside stage, raw shell commands, and `npm` script names. |

## Success cases

### ER-01 — Explicit-root identity

**Arrange:** Create clean candidate and runner fixtures plus an external stage.
**Act:** Invoke the runner with all required roots and matching expected commit/tree values.
**Assert:**

- Every Git adapter call contains either candidate or runner root explicitly.
- Candidate marker commit/tree equal candidate fixture identity.
- Runner identity is retained only in runner provenance.
- Candidate, runner, and stage paths do not appear as absolute manifest values.

### ER-02 — Candidate clean before and after

**Arrange:** Clean candidate fixture with tracked placeholders.
**Act:** Run staging assembly.
**Assert:**

- Candidate status is empty before ignored-input generation.
- Candidate status is empty after final marker rename.
- Candidate tracked placeholder bytes are unchanged.
- No candidate `portal-dist`, `_worker.js`, or staged route shell is created.

### ER-03 — Permitted ignored input provenance

**Arrange:** Candidate public vault data and ignored-index generator fixture.
**Act:** Generate the index through the explicit allowed-input descriptor.
**Assert:**

- Only `website/data/vault-index.json` is newly accepted beneath candidate `website/data`.
- Retained provenance records command identifier, generator hash, public-vault hash, generated-index
  hash, and document count.
- The generated index remains in place after success.

### ER-04 — Direct external Vite output

**Arrange:** Candidate-local Vite fixture.
**Act:** Run assembly.
**Assert:**

- Vite receives candidate-local executable/config paths.
- Vite `outDir` is `<stage>/portal-dist`.
- No candidate `npm run build:site` invocation occurs.
- Candidate source tree receives no Vite output.

### ER-05 — Staged publication content

**Arrange:** Candidate fixture with both declared fallback placeholders.
**Act:** Run assembly.
**Assert:**

- `<stage>/_worker.js` derives from candidate `worker.js`.
- `<stage>/portal/cave-corridor` and `<stage>/portal/cave-corridor-prototype` contain the built
  shell.
- Source placeholders retain exact fallback bytes.
- Placeholder/output manifests and runner provenance exist only under `<stage>/portal-dist`.

### ER-06 — Deterministic provenance

**Arrange:** Unchanged fixtures and fixed Vite output.
**Act:** Run assembly twice into separate fresh stages with distinct `now` values.
**Assert:**

- Placeholder manifests are byte-identical.
- Output manifests are byte-identical.
- Runner provenance manifests are byte-identical.
- Markers differ only in `builtAtUtc`.

### ER-07 — Atomic marker finalization

**Arrange:** Successful fixture run.
**Act:** Instrument marker writing.
**Assert:**

- Marker temporary file is created in `<stage>/portal-dist`.
- The final marker appears only after source, manifest, and runner checks succeed.
- A same-directory atomic rename creates final `build-marker.json`.

## Failure cases

| ID | Fault | Required result |
| --- | --- | --- |
| ER-08 | Candidate root is wrong, dirty, or expected commit/tree mismatch. | Fail before Vite; no marker or staging package. |
| ER-09 | Runner root is wrong, dirty, same worktree as candidate, or expected identity mismatch. | Fail before Vite; no marker or staging package. |
| ER-10 | Stage is non-empty, nested beneath candidate/runner, aliases either through symlink/junction, or reuses a prior output root. | Fail before any copy; no marker. |
| ER-11 | Candidate placeholder differs from exact fallback sentinel. | Fail before route materialization; source unchanged; no marker. |
| ER-12 | Unexpected ignored input appears beneath candidate `website/data`. | Fail before Vite; generated allowed input is retained for inspection; no marker. |
| ER-13 | Vite adapter receives global/out-of-candidate executable/config, raw command, `npm` script, or out-of-stage output. | Reject invocation; no marker. |
| ER-14 | Vite fails after writing partial stage output. | Remove temporary/final marker; candidate remains clean. |
| ER-15 | Source identity changes or becomes dirty after assembly. | Remove temporary/final marker; record failure; candidate tracked files are not changed by runner. |
| ER-16 | Manifest hash mismatch, invalid manifest path, runner module hash mismatch, or runner provenance contains a timestamp. | Remove temporary/final marker; no admissible stage. |
| ER-17 | Marker temporary-file write or rename fails. | Remove both temporary and final marker paths; preserve other output only for diagnosis. |

## Documentation-only change summary

This plan adds no executable test, runner code, candidate workspace, publication output, or attribution
claim. It translates the external Pages-staging runner contract into implementation-ready fixture,
success, and failure cases, and adds edge-case constraints for root canonicalization, Windows path
handling, symlink/junction rejection, explicit Vite invocation, ignored-input allowlisting, atomic
marker finalization, and timestamp-free repeatable provenance.
