# Threshold Engine

This directory is the modular publication root.

- `core/` is the versioned Anchor and is never generated from branch content.
- `branches/<branch>/src/` is private Obsidian-derived input.
- `branches/<branch>/build/` is disposable branch output.
- `builder/` builds and validates exactly one requested target.
- `publish/` is disposable public output.
- `worker/` controls activation and private R2 reads.
- `r2/` mirrors bucket prefixes locally but contains no committed payloads.

The workflow is manual. A core run replaces the complete Pages artifact. A branch run writes only `branches/<branch>/` in R2 because GitHub Pages cannot preserve untouched directories during a partial deployment. GitHub executes the workflows in the repository-root `.github/workflows/`; `threshold/.github/workflows/build.yml` records the module-local deployment contract.

Build and validate the Anchor manually:

```powershell
py -3.14 builder/build_core.py
py -3.14 builder/validate_core.py
```

Build and validate one Drift branch:

```powershell
py -3.14 builder/build_branch.py mythology
py -3.14 builder/validate_branch.py mythology
```