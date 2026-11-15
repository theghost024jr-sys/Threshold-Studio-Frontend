# External Pages-Staging Runner Implementation Authorization Gate

## Status

**AUTHORIZED FOR RUNNER IMPLEMENTATION AND EXECUTABLE ER TESTS ONLY.** This does not authorize
candidate assembly, serving, deployment, a marker-based attribution claim, Revision 3 eligibility,
A6, or R7.

This authorization permits only implementation and executable isolation tests for the external
Pages-staging runner specified in
[the runner contract](EXTERNAL_PAGES_STAGING_RUNNER_CONTRACT.md).

## Authorization scope

An implementation authorization must be limited to:

- external runner modules and CLI entrypoint;
- direct candidate-local Vite adapter;
- external staging copier and explicit exclusion manifest;
- candidate-derived ignored-index provenance;
- deterministic runner provenance manifest;
- atomic marker finalization;
- tests mapped below;
- directly related contract and protocol updates.

It must not authorize:

- a build of `678d0bc84ff16a2eeb9178b5422e74ed698417b4`;
- any use of `C:\Threshold` as candidate, input, output, or staging;
- serving, deployment, or a marker-based attribution claim;
- Cave renderer, geometry, state, crystal, A6, R7, or visual changes;
- cleanup or modification of preserved candidate worktrees.

## Preconditions for authorization

- [ ] v2 infrastructure commit `2d84ecb4239e132fb20c676cc24bbcc95794cdd3` is recorded as runner
  provenance baseline, not candidate identity.
- [ ] Candidate `678d0bc84ff16a2eeb9178b5422e74ed698417b4` remains **NOT ATTRIBUTED**.
- [ ] The runner contract and ER-01 through ER-17 test plan are accepted without a new architecture
  change.
- [ ] The implementation boundary names exact source, test, and documentation files before staging.
- [ ] The implementation does not reuse legacy candidate `npm run build:site`.

## Required implementation acceptance

- [ ] Every candidate Git identity check receives `candidateRoot` explicitly.
- [ ] Every runner Git identity check receives `runnerRoot` explicitly.
- [ ] Candidate, runner, and staging roots are canonicalized and protected from junction/symlink
  escapes.
- [ ] Candidate-local Vite is invoked directly with external `outDir`.
- [ ] Only the declared ignored index may be generated in a candidate overlay.
- [ ] Output exists only in external staging.
- [ ] Runner modules executed by the process are retained with SHA-256 hashes.
- [ ] Repeatable manifests contain no run timestamp.
- [ ] Marker write is temporary-file plus same-directory atomic rename.
- [ ] All failure paths remove final and temporary markers.
- [ ] Every ER case below passes before runner-diff review.

## ER implementation test map

| ER case | Primary future test file | Primary assertion |
| --- | --- | --- |
| ER-01 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Explicit roots, correct candidate marker identity, separate runner provenance. |
| ER-02 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Real-Git clean candidate before and after staging. |
| ER-03 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Allowed ignored-index derivation and retained input provenance. |
| ER-04 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Candidate-local direct Vite with external output only. |
| ER-05 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Worker, route shells, manifests, and marker exist only in staging. |
| ER-06 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Two unchanged runs have byte-identical non-marker provenance manifests. |
| ER-07 | `website/tests/build-marker.test.mjs` | Temporary-marker ordering and same-directory atomic finalization. |
| ER-08 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Wrong or dirty candidate fails before Vite. |
| ER-09 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Wrong, dirty, or aliased runner fails before Vite. |
| ER-10 | `website/tests/external-pages-staging-runner.unit.test.mjs` | Non-empty, nested, and junction/symlink staging roots are rejected. |
| ER-11 | `website/tests/portal-publication-assembly.test.mjs` | Non-sentinel source placeholder is refused without source mutation. |
| ER-12 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Unexpected candidate ignored input fails before Vite. |
| ER-13 | `website/tests/external-pages-staging-runner.unit.test.mjs` | Global/out-of-root Vite, raw command, npm script, and invalid output root are rejected. |
| ER-14 | `website/tests/external-pages-staging-runner.integration.test.mjs` | Failed Vite removes markers and preserves candidate cleanliness. |
| ER-15 | `website/tests/build-marker.test.mjs` | Post-assembly source identity or cleanliness change prevents marker finalization. |
| ER-16 | `website/tests/external-pages-staging-runner.unit.test.mjs` | Invalid manifests, module hashes, paths, or timestamps are rejected. |
| ER-17 | `website/tests/build-marker.test.mjs` | Temporary-marker write/rename failure removes all marker paths. |

`portal-publication-assembly.test.mjs` remains a focused component suite. The external-runner
integration suite is the authoritative proof that component behavior is correctly isolated across
candidate, runner, and staging roots.

## Post-implementation boundary

Passing the complete isolation suite authorizes only runner-diff review. It does not authorize a
candidate attribution experiment. A separate explicit authorization is required after runner review
and its isolated infrastructure commit.
