# Archive record - Hub Return retirement (2026-11-03)

The legacy public Hub page and its exclusive runtime were removed after the Main
Hub was proven to own the Return contract.

## Why this was safe

- `hub-return.html` was already a redirect stub: line 7 `rel="canonical" href="/hub.html"`,
  line 8 meta refresh, line 9 `window.location.replace("/hub.html")`. Nothing could
  reach its body.
- No HTML file in `website/` linked to it, and no `<link rel="canonical">` pointed at it.
- Its useful Return work already lives in `hub.html`:
  - `hub.html` line 1884: `<p data-hub-return-reading>`
  - `hub.html` line 1885: `<a data-hub-return-continuation href="/portal/motion">`
  - `hub.html` line 1901: loads `/scripts/hub-return-state.js`
- `hub.html` does not link `styles/hub-public.css` and carries its own inline
  `<style>` block (lines 11-1795), so the stylesheet was orphaned.
- The removed runtime contained an unguarded crossing:
  `hub-public-runtime.js` line 43 `engine.navigateTo("housegarden", { reveal: true })`,
  which bypassed `main-hub-engine-adapter.js`. Removing the page removes that path.

## Originals (byte-identical copies live in this tree, paths preserved)

| original path | SHA256 | bytes |
|---|---|---|
| website\hub-return.html | 7196D4E25E53DD23A4DF7B84F6B2C374754AE3CCDB24610A2E9BA99E5CB65F1D | 5476 |
| website\scripts\hub-public-runtime.js | 8D8C61EB8477AF176DCA1883F967474DB7CAA6634F2B1F2B7F7B8A99CBEAF720 | 1532 |
| website\scripts\hub-public-experience.js | D978758717F5D1C4AED3F6C7E48B42DF40BE7481BD2AAC6D62CF27CACC3B9F4B | 16108 |
| website\styles\hub-public.css | 97EA4C0C1A03956B6C1B797E653953C27AA886A4097DDE0BB78BD4E39B4ABD57 | 17541 |

Note: `website\hub-return.html` was untracked in git, so this tree is its only copy.
The other three were tracked and remain recoverable from git history as well.

## Undo

```powershell
$root = (Get-Location).Path
$arch = Join-Path $root "_archive\hub-return-retirement-20261103"
Get-ChildItem -LiteralPath $arch -Recurse -File |
  Where-Object { $_.Name -ne 'README.md' } |
  ForEach-Object {
    $rel  = $_.FullName.Substring($arch.Length + 1)
    $live = Join-Path $root $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $live -Parent) | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $live -Force
  }
```

Then revert the three reference edits:

- `website/config/page-echoes.js` - restore the `hub-return` pageEcho entry.
- `website/tests/destination-routing.test.mjs` - restore the two removed tests.
- `website/tests/page-complexity.test.mjs` - restore the `hubReturn` read and its assertion.

## Known non-goals

- This does not remove any `/portal/*` route. Those are separate pages.
- This does not touch the Main Hub spectacle mechanics (`main-hub-experience.js`,
  `hub.html` inline styles, `hub-graph.js`).
