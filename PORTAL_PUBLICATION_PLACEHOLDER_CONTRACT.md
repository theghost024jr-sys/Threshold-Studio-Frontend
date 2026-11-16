# Portal Publication Placeholder Contract

## Status

**Decision:** Isolated assembly outside the tracked source worktree.

**Implementation status:** The v2 isolated-assembly implementation is committed in `2d84ecb4…`. It has not been applied to a clean Cave candidate, and it does not remediate the inadmissible marker previously produced for `678d0bc8…`. Exact-candidate publication requires the separate [external Pages-staging runner contract](EXTERNAL_PAGES_STAGING_RUNNER_CONTRACT.md).

## Tracked publication placeholders

Files whose complete committed content is exactly:

```text
Portal route fallback.
```

are tracked publication placeholders. They are neither ordinary authored route source nor ordinary untracked generated output.

The established Portal publication behavior recognizes this sentinel and materializes an HTML shell for the route. Current examples include:

- `website/portal/cave-corridor`
- `website/portal/cave-corridor-prototype`

The placeholder paths are repository content and therefore part of the candidate commit and tree. The materialized HTML is publication output and must not overwrite those paths in the source checkout.

## Boundary

An attributable build has two separate areas:

1. **Candidate source checkout:** The exact commit and tree being attributed. It must remain Git-clean before, during, and after the build.
2. **Publication assembly output:** A separate staging/output location populated from the candidate's built Portal assets and the declared placeholders. It is the only location where route-shell materialization may occur.

The source checkout must not be used as publication staging. A marker must never claim a clean source worktree if later build steps mutate tracked source paths.

## Required implementation contract

The eventual implementation must:

- preserve the exact candidate commit and tree as the only source identity;
- fail before publication if the source checkout is not clean;
- enumerate the placeholder paths it intends to materialize;
- verify each declared source placeholder still contains exactly `Portal route fallback.`;
- write materialized route shells only to isolated publication output;
- leave every tracked source path byte-for-byte unchanged after the build;
- generate the marker only for a build satisfying those conditions;
- retain source status, declared placeholder paths, assembled output location, and marker response with the build evidence.

No broad rule may treat post-build tracked modifications as acceptable merely because a path contains the placeholder sentinel.

## Current entrypoint and required boundary change

The current CI entrypoint is:

```text
npm run build:ci
  -> npm --prefix website/portal run build:site
  -> node scripts/build-pages.mjs --static
```

At exact candidate `678d0bc8…`, `build:site` runs Vite into `website/portal-dist` and then calls a
legacy shell-copy step that scans the tracked `website/portal` source tree and rewrites every file
whose content is the placeholder sentinel. The v2 infrastructure commit `2d84ecb4…` replaces that
in-place mutation with isolated Portal output, but it does not provide external Pages staging for
the exact candidate.

The isolated implementation must instead take a declared placeholder manifest and write materialized
route shells only into the publication staging root that is later packaged for Pages. The source-tree
paths remain inputs to the manifest; they are never outputs of the build.

## Implemented v2 assembly provenance marker

The v2 marker contract is implemented by `2d84ecb4…`. No served exact-candidate marker has been
produced, and the marker alone does not authorize a build.

```json
{
  "schema": "threshold-build-marker/v2",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "tree": "0123456789abcdef0123456789abcdef01234567",
  "sourceWorktreeBefore": "clean",
  "sourceWorktreeAfter": "clean",
  "assembly": {
    "mode": "isolated-publication-output",
    "placeholderManifestSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "placeholderCount": 2,
    "outputManifestSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  },
  "builtAtUtc": "2026-11-15T06:30:32Z"
}
```

| Field | Rule |
| --- | --- |
| `schema` | Exact literal `threshold-build-marker/v2`. |
| `commit`, `tree` | Exact source commit and its Git tree, as in v1. |
| `sourceWorktreeBefore`, `sourceWorktreeAfter` | Both must equal `clean`. |
| `assembly.mode` | Exact literal `isolated-publication-output`. |
| `assembly.placeholderManifestSha256` | SHA-256 of a retained UTF-8 manifest listing each source placeholder path, its source SHA-256, and its isolated output path and SHA-256. |
| `assembly.placeholderCount` | Number of manifest entries. |
| `assembly.outputManifestSha256` | SHA-256 of a retained UTF-8 publication-output manifest containing the Portal shell and all materialized placeholder outputs. The marker is excluded to avoid a self-referential hash. |
| `builtAtUtc` | UTC ISO 8601 timestamp ending in `Z`. |

Absolute machine paths, unverified environment variables, and mutable source-worktree paths must not
be marker provenance fields.

## Test requirements

Focused isolated-assembly tests must prove that:

1. A clean candidate builds and materializes only declared placeholders in isolated output.
2. The candidate checkout is clean both before and after the build.
3. Source placeholder files retain their exact committed fallback bytes after the build.
4. A changed or non-sentinel declared placeholder causes a loud failure before marker generation.
5. An undeclared sentinel file is not materialized.
6. A duplicate output path or output outside the publication staging root causes a loud failure.
7. The placeholder manifest records every declared source and output path with matching SHA-256 values.
8. Repeating an unchanged build produces the same placeholder and output manifests.
9. The served v2 marker identifies the exact candidate commit and tree and records clean source status
   both before and after assembly.
10. The served marker's manifest hashes resolve to retained evidence artifacts.
11. A failed isolated assembly removes any stale marker and leaves the candidate checkout unchanged.

## Attribution consequence

Until the external Pages-staging runner is implemented and its isolation suite passes, no marker is
admissible for exact-candidate attribution. A marker produced by in-place source-worktree
materialization is always **not admissible**. Build attribution remains **NOT ATTRIBUTED**.
