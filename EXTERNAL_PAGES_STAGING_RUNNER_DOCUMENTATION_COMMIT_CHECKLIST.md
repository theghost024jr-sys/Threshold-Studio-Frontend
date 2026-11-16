# External Pages-Staging Runner Documentation Commit Checklist

## Status

**Documentation-only commit checklist.** Completion of this checklist does not authorize runner
implementation, executable ER tests, a candidate build, serving, deployment, attribution, Revision
3 eligibility, A6, or R7.

## Expected commit boundary

Stage exactly these documentation files:

1. `PORTAL_PUBLICATION_PLACEHOLDER_CONTRACT.md`
2. `EXTERNAL_PAGES_STAGING_RUNNER_CONTRACT.md`
3. `EXTERNAL_PAGES_STAGING_RUNNER_TEST_PLAN.md`
4. `EXTERNAL_PAGES_STAGING_RUNNER_IMPLEMENTATION_AUTHORIZATION_GATE.md`
5. `EXTERNAL_PAGES_STAGING_RUNNER_DOCUMENTATION_COMMIT_CHECKLIST.md`

Do not stage runner source, test implementation, candidate source, build output, evidence artifacts,
or unrelated governance material.

## Content review

- [ ] Placeholder contract distinguishes legacy in-place candidate behavior from committed v2 Portal
  assembly and unimplemented external Pages staging.
- [ ] Runner contract requires explicit `candidateRoot`, `runnerRoot`, and `stagingRoot`.
- [ ] Runner contract prohibits implicit-CWD Git calls, raw Vite shell commands, and candidate
  `npm run build:site`.
- [ ] Runner contract defines candidate-derived ignored-input provenance, deterministic runner-module
  hashes, and atomic marker finalization.
- [ ] Test plan defines real temporary-Git candidate, runner, staging, and Vite fixtures.
- [ ] ER-01 through ER-17 each appear in the test plan and authorization-gate map.
- [ ] Authorization gate permits implementation and executable tests only after later explicit
  approval.
- [ ] Authorization gate makes the integration suite authoritative for identity isolation.
- [ ] Every document preserves `678d0bc8…` as **NOT ATTRIBUTED**.

## Staged audit

```powershell
git status --short
git --no-pager diff --cached --stat
git --no-pager diff --cached --check
git --no-pager diff --cached --name-only
```

- [ ] The staged inventory contains exactly the five expected documentation files.
- [ ] No expected documentation file has an unstaged overlay.
- [ ] `git diff --cached --check` passes.
- [ ] No Cave implementation, v2 infrastructure source, executable test, generated file, candidate
  workspace artifact, or unrelated existing change is staged.

## Commit disposition

- [ ] **READY FOR SEPARATE DOCUMENTATION-COMMIT AUTHORIZATION**
- [ ] **NOT AUTHORIZED — STOP**

If authorized, the commit records architecture and test intent only. It must not be cited as
evidence that the external runner exists or that the Cave candidate is attributable.
