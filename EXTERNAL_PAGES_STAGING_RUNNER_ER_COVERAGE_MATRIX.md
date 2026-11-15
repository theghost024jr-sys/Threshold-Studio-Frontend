# External Pages-Staging Runner ER Coverage Matrix

**Status: verified executable coverage.** Every ER row below has a named passing test in the
complete runner suite.

| ER | Named executable test | Assertion |
| --- | --- | --- |
| ER-01 | **VERIFIED** — `ER-01 stages an exact candidate with explicit roots and separate runner provenance`; `rejects relative roots and incomplete runner-module provenance before Vite` | Every Git call names canonical candidate or runner root; all roots must be absolute; the marker identifies the candidate; manifests retain no absolute roots; and all executed runner modules are attested. |
| ER-02 | **VERIFIED** — `ER-02 keeps the candidate clean before generation and after marker finalization` | Candidate status is clean before index generation and after final marker publication; both fallbacks and generated-output absence are preserved. |
| ER-03 | **VERIFIED** — `ER-03 rejects an unexpected ignored candidate data input before Vite` | Index allowlist rejects an injected ignored sibling before Vite. |
| ER-04 | **VERIFIED** — `ER-04 captures candidate-local Vite paths and exact external output root` | Captured adapter call uses candidate-local executable/config and exact stage `portal-dist`. |
| ER-05 | **VERIFIED** — `ER-05 writes publication content only to external staging` | Worker, shells, manifests, and marker are outside candidate. |
| ER-06 | **VERIFIED** — `ER-06 repeats unchanged staging with identical provenance manifests` | Runner, placeholder, and output manifests are byte-identical. |
| ER-07 | **VERIFIED** — `ER-07 finalizes the marker only after source checks and temporary write` | Final marker appears only after clean-source checks and temporary-marker write. |
| ER-08 | **VERIFIED** — `ER-08 rejects wrong or dirty candidate identity before Vite` | Both mismatched expected identity and dirty candidate reject before Vite or marker creation. |
| ER-09 | **VERIFIED** — `ER-09 rejects wrong, dirty, same-worktree, or aliased runner identity before Vite` | Mismatched and dirty runner identity, direct candidate reuse, and a candidate junction alias all reject before Vite or marker creation. |
| ER-10 | **VERIFIED** — `ER-10 rejects existing, nested, and junction-aliased staging roots before Vite` | Existing, candidate-nested, runner-nested, and junction-aliased staging roots reject before Vite or marker creation. |
| ER-11 | **VERIFIED** — `ER-11 rejects a non-sentinel source placeholder without source mutation` | The changed source is retained, no route output is materialized, and no marker exists. |
| ER-12 | **VERIFIED** — `ER-12 rejects and preserves a preexisting unexpected ignored input before Vite` | The diagnostic ignored file is retained; generation, Vite, and marker creation do not occur. |
| ER-13 | **VERIFIED** — `ER-13 rejects global, raw, legacy, and out-of-stage Vite invocation` | Candidate-external executable/config, redirected output, raw command, legacy script, and extra arguments reject. |
| ER-14 | **VERIFIED** — `ER-14 removes markers after Vite writes partial staging output then fails` | Partial stage output is retained for diagnosis; temporary/final markers are removed and candidate remains clean. |
| ER-15 | **VERIFIED** — `ER-15 rejects post-assembly candidate mutation and removes the marker` | A tracked candidate mutation immediately before marker finalization blocks both marker paths. |
| ER-16 | **VERIFIED** — `ER-16 rejects invalid manifests, module hashes, paths, and timestamps`; `ER-16 rejects a runner module hash mutation before marker finalization` | Hash mismatch, invalid manifest path, malformed module hash, timestamped provenance, an incomplete module declaration, and a changed runner module all reject before marker finalization. |
| ER-17 | **VERIFIED** — `ER-17 removes temporary and final markers when atomic rename fails` | Both marker paths are absent after rename failure. |

All ER-01 through ER-17 rows are independently executable and passing. This opens runner-diff
review only; it does not authorize an attribution experiment.
