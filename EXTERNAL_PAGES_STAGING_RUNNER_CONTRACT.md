# External Pages-Staging Runner Contract

## Status

**Defined, not implemented.**

This runner is the only permitted way to assemble and attest an exact Cave candidate with v2
publication infrastructure. It must preserve three distinct identities:

1. candidate source identity;
2. runner tooling identity;
3. external publication-output identity.

It does not authorize an attribution experiment, serving, deployment, Revision 3 eligibility, A6,
or R7.

## Required module interface

The runner module must expose an explicit-root entrypoint. It must not infer the candidate from its
current working directory, its own module directory, or an environment default.

```js
export async function stageCandidatePages({
  candidateRoot,
  runnerRoot,
  stagingRoot,
  expectedCandidate,
  expectedRunner,
  allowedIgnoredInput,
  runnerModulePaths,
  runGitCommand,
  runVite,
  now,
})
```

### Input contract

| Input | Required rule |
| --- | --- |
| `candidateRoot` | Absolute path to the exact candidate build overlay. Every candidate Git call and marker source field uses this root explicitly. |
| `runnerRoot` | Absolute path to the separate v2 runner checkout. |
| `stagingRoot` | Absolute new, empty external Pages output root. It must not be equal to or nested within either worktree. |
| `expectedCandidate` | Required `{ commit, tree }`; runner verifies both against `candidateRoot` before work. |
| `expectedRunner` | Required `{ commit, tree }`; runner verifies both against `runnerRoot` before work. |
| `allowedIgnoredInput` | Required descriptor for only `website/data/vault-index.json`, including its candidate-derived command and expected source path. |
| `runnerModulePaths` | Relative paths of the runner modules the process may execute. Each is hashed and retained. |
| `runGitCommand` | Explicit testable Git adapter. It receives the root to inspect; it may never default to process CWD. |
| `runVite` | Explicit testable adapter that invokes the candidate's pinned Vite executable and candidate config with an external `outDir`. |
| `now` | Used only for marker `builtAtUtc`. It must not enter repeatable manifests. |

### Return contract

```js
{
  candidate: { commit, tree },
  runner: { commit, tree, modules },
  ignoredInput: { path, sourceSha256, outputSha256, generatorSha256 },
  assembly: {
    placeholderManifestSha256,
    outputManifestSha256,
    placeholderCount,
  },
  stagingRoot,
  markerPath,
}
```

`runner.modules` is an ordered list of `{ path, sha256 }`. It must include the runner entrypoint,
the assembly module, the marker module, and any staging-copy module actually imported by the run.

### Interface edge-case requirements

- Roots must be canonicalized through their existing real parent directories before containment
  checks. Simple string-prefix checks are insufficient on Windows and do not protect against
  symlink or junction escapes.
- `candidateRoot` and `runnerRoot` must each resolve to their own Git top-level directory. They may
  share a Git common directory through linked worktrees, but they must not resolve to the same
  worktree.
- `expectedCandidate` and `expectedRunner` must contain full lowercase 40-character hashes. The
  runner reads actual identities from the explicit roots and rejects caller-supplied mismatches.
- `runGitCommand` must receive `{ root, args }`; it may not accept an implicit current directory.
- `runVite` must receive `{ candidateRoot, viteExecutable, configPath, outDir, args }`. It must not
  accept a raw shell command or an `npm` script name, which would permit legacy post-build assembly.
- `viteExecutable` and `configPath` must resolve beneath `candidateRoot`; `outDir` must resolve
  beneath `stagingRoot`.
- All manifest paths use normalized `/` separators relative to their declared root. Absolute paths,
  drive letters, `.` segments, and `..` segments are invalid manifest data.
- The runner must reject symlinks or junctions encountered in source-copy input unless a later
  contract explicitly defines their provenance and copy semantics.
- Before generating the permitted ignored index, the runner records candidate ignored-input state
  beneath `website/data`. After generation it verifies that the only newly accepted ignored input is
  `website/data/vault-index.json`.
- `now` must be a validated `Date` and may affect only marker `builtAtUtc`. It must not affect
  manifests, runner provenance, or output hashes.
- The marker temporary file and final marker must be on the same staging filesystem. Finalization
  uses a same-directory rename; all failure handlers remove both paths.

## Isolation checklist

### A. Preflight

- [ ] `candidateRoot`, `runnerRoot`, and `stagingRoot` are absolute, distinct paths.
- [ ] `stagingRoot` does not exist or is empty and newly created by the runner.
- [ ] `stagingRoot` is not nested inside `candidateRoot` or `runnerRoot`.
- [ ] Candidate HEAD/tree equal `expectedCandidate`.
- [ ] Candidate Git status is empty before ignored-input generation.
- [ ] Runner HEAD/tree equal `expectedRunner`.
- [ ] Runner Git status is empty.
- [ ] Every `runnerModulePaths` entry is within `runnerRoot`, exists, and has a retained SHA-256.
- [ ] No input originates from the primary worktree or an earlier publication output.

### B. Candidate-derived ignored input

- [ ] Only `website/data/vault-index.json` may be generated in the candidate overlay.
- [ ] Its source is the candidate overlay's committed `website/data/threshold-vault.json`.
- [ ] The generation command, generator SHA-256, source SHA-256, output SHA-256, and document count are retained.
- [ ] Candidate tracked status remains clean after generation.
- [ ] No other ignored file is created or accepted as a build input.
- [ ] The generated index is retained until explicit later authority removes it; attribution does not delete it.

### C. External assembly

- [ ] Vite is invoked directly, not through candidate `npm run build:site`.
- [ ] The executable and config resolve beneath `candidateRoot`.
- [ ] Vite writes only to `<stagingRoot>/portal-dist`.
- [ ] The runner copies candidate website inputs into staging using an explicit exclusion manifest.
- [ ] Candidate `website/portal-dist`, candidate generated Worker output, and prior staging output are excluded.
- [ ] Candidate `worker.js` is copied only to `<stagingRoot>/_worker.js`.
- [ ] Source placeholders are verified in `candidateRoot` and materialized only under `<stagingRoot>/portal`.
- [ ] Placeholder and output manifests are written only under `<stagingRoot>/portal-dist`.

### D. Atomic marker finalization

- [ ] Candidate source identity is rechecked after all assembly and manifest writes.
- [ ] Runner identity and executed-module hashes are rechecked or retained before marker finalization.
- [ ] Manifest SHA-256 values are recomputed from their retained bytes.
- [ ] `build-marker.json` is written last to a temporary file in `<stagingRoot>/portal-dist`.
- [ ] The temporary marker is atomically renamed to `build-marker.json` only after every check passes.
- [ ] Every failure removes any temporary or final marker; no inadmissible marker survives.

### E. Postconditions

- [ ] Candidate tracked Git status remains empty after the runner returns.
- [ ] Candidate source placeholders retain exact fallback bytes.
- [ ] The served marker commit/tree equal `expectedCandidate`, never `expectedRunner`.
- [ ] `attestation-runner.json` records runner commit/tree and executed-module hashes without a live timestamp.
- [ ] Run-specific time appears only in marker `builtAtUtc`.
- [ ] The Pages server, if authorized later, serves only `stagingRoot`.

## Isolation test fixtures

All runner integration tests use fresh temporary directories and real temporary Git repositories.
They must not use `C:\Threshold`, the preserved Cave workspace, global Vite resolution, or prior
publication output.

### `createCandidateFixture()`

Creates a temporary candidate repository with:

- tracked `website/portal/cave-corridor` and `cave-corridor-prototype` fallback placeholders;
- tracked `website/data/threshold-vault.json`;
- ignored `website/data/vault-index.json`;
- tracked `worker.js`;
- candidate-local Vite executable/config fixture;
- committed expected candidate HEAD/tree.

It returns `{ candidateRoot, commit, tree, sourceHashes }`.

### `createRunnerFixture()`

Creates a separate temporary Git repository containing the runner entrypoint and every declared
runner module. It returns `{ runnerRoot, commit, tree, moduleHashes }`.

### `createStagingFixture()`

Returns a new empty directory outside both fixture repositories. Tests also create invalid staging
paths nested under candidate and runner roots.

### `runViteFixture()`

Receives explicit `candidateRoot`, `configPath`, and `outDir`. It writes deterministic fixture
Portal assets only to `outDir` and records received arguments. It must fail if:

- the executable/config path is outside `candidateRoot`;
- `outDir` is outside `stagingRoot`;
- a legacy candidate build-script command is requested.

### Required test cases

1. Clean candidate before, external assembly only, clean candidate after.
2. Candidate marker identity differs from runner provenance identity.
3. Candidate source placeholders and tracked files remain byte-for-byte unchanged.
4. Candidate-derived ignored index provenance is retained; no other ignored input is accepted.
5. Candidate Vite executable/config and external `outDir` are passed explicitly.
6. Materialized route shells, Worker output, manifests, and marker exist only in staging.
7. Runner manifest contains exact executed module hashes and no live timestamp.
8. Repeated unchanged runs produce byte-identical runner, placeholder, and output manifests.
9. Dirty/wrong candidate, dirty/wrong runner, nested/non-empty staging root, changed placeholder,
   invalid ignored input, failed Vite, and post-assembly source mutation all fail loudly.
10. Every failure leaves no final `build-marker.json` and no temporary marker in staging.

## Required implementation changes

1. Add an external-runner module/CLI under the v2 infrastructure line.
2. Make candidate, runner, and staging roots required explicit arguments everywhere.
3. Refactor publication assembly to accept independent source, staging-route, and manifest roots.
4. Add a safe website-input copier with an explicit exclusion manifest.
5. Add direct candidate-local Vite execution with an external output directory.
6. Add candidate-derived ignored-input generation and provenance capture.
7. Add deterministic `attestation-runner.json` generation with executed-module hashes.
8. Add atomic marker write/rename and failure cleanup.
9. Add real-Git external-staging integration fixtures and the complete isolation suite.

## Gate

**Implement runner → pass complete isolation suite → review runner diff → commit runner infrastructure → authorize first attribution experiment.**
