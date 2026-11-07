# Contributing to Threshold

Threshold is a shared project. Keep integration history explicit, preserve the canonical source boundaries, and validate the surface affected by your change.

## Before You Start

Use Node.js 22 or newer. For engine work, also install the Python dependencies:

```powershell
npm ci
python -m pip install -r requirements.txt
```

Read [REPOSITORY_CONTRACT.md](REPOSITORY_CONTRACT.md) before changing vault paths, generated data, publication behavior, or the engine interface.

## Branch Workflow

`main` is the shared integration branch. Do not start unintegrated work or make direct commits on `main`.

Start each change from an up-to-date `main`:

```powershell
git switch main
git pull --ff-only origin main
git switch -c <short-change-name>
```

Commit freely on your feature branch. Before integration, fetch the current shared history:

```powershell
git fetch origin
git rebase origin/main
```

Rebase only a private feature branch that no other contributor has based work on. If the feature branch is shared, coordinate before rewriting its history.

Integrate through an explicit pull request, merge, or agreed fast-forward. Do not resolve divergence by discarding history or force-pushing `main`.

### When a Pull Cannot Fast-Forward

`git pull --ff-only` intentionally fails when both local and remote branches contain commits absent from the other history. Stop and inspect the divergence:

```powershell
git status --short --branch
git fetch origin
git log --oneline --left-right HEAD...origin/main
```

If the local commits are private feature-branch work, rebase that branch onto `origin/main`. If either history is shared, agree on the integration path before merging or rebasing.

## Validation

Run the smallest relevant validation before opening a pull request.

| Change area | Required validation |
|---|---|
| Website or generated public data | `npm run build` |
| Browser behavior or JavaScript | `npm test` |
| Engine API or graph behavior | `python -m pytest tests\test_engine_api.py` |
| Broad cross-surface change | `npm run build`, `npm test`, and `python -m pytest tests\test_engine_api.py` |

The current GitHub Actions workflow validates the frontend build and frontend tests. Run the Python engine test locally until it is added to CI.

## Engine Boundary

The frontend may emit validated intent and render authoritative engine results. It must not invent backend-owned state.

When adding or changing an engine intent, define all of the following before implementation:

1. A strict frontend schema and validator.
2. An authorized backend state transition or event.
3. A user-visible consequence rendered from the authoritative result.
4. Acceptance, rejection, and no-mutation tests.

Do not add generic payload paths, legacy authority fields, or UI-originated world-state values.

## Generated Data and Vault Safety

- Treat `threshold.config.json` as the path authority.
- Do not manually edit generated public data unless the change explicitly requires it.
- Do not copy private vault content, `.obsidian` state, environment files, credentials, or unrelated media into public outputs.
- Keep raw vault content outside the public website boundary.

## Recommended GitHub Protection

Repository administrators should protect `main` with:

- pull requests required before merging;
- required passing checks;
- force-pushes disabled;
- branch deletion disabled;
- review required when both authors are active.

Local Git settings such as `pull.ff=only` provide workstation guidance only. GitHub branch protection is the shared enforcement layer.
