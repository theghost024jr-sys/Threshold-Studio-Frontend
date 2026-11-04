# Give the Garden a vault source — 2026-11-03

## Why

`website/environment/herbroom.html` L140 holds the Garden projection gate:

```js
const isGardenCluster = /^_publish\/housegarden(?:_|\/|\.md)/i.test(note.relativePath || '');
const source = `${note.title || ''} ${note.body}`;
return isGardenCluster
  && /\b(flora|flower|pollinator|butterfly|bee|insect)\b/i.test(source)
  && /\b(move|motion|drift|sway|wind|appear|emerge|flight|fly|growth)\b/i.test(source);
```

then:

```js
const flora = choose(/\b(flora|flower|growth)\b/i);
const pollinator = choose(/\b(pollinator|butterfly|bee|insect)\b/i);
```

Five notes match `isGardenCluster`. All five bodies were one line —
`"Warmth biome in the House & Garden cluster."` — containing no flora word and no
motion word. The candidate list has always been empty, so `has-garden-flora` and
`has-garden-pollinator` have never been set. The window has never projected
anything. The West Window note calls this "the projection is dead".

## The vault that actually builds the site

`threshold.config.json` L2:

```json
"vaultRoot": "C:\\Users\\James Romeo\\Threshold\\Threshold-Studio-Content\\publish"
```

That is a **third** vault, not the OneDrive vault this work has been auditing and
not the `C:\Threshold\theghost` mirror. It is a git repository with its own
`_publish`, `_publish_candidates`, `_archive`, and 5,712 files. The five
`housegarden*` notes live there:

- `_publish/housegarden.md` — 492 B
- `_publish/housegarden_greenhouse.md` — 482 B
- `_publish/housegarden_herb_room.md` — 468 B
- `_publish/housegarden_lagoon.md` — 457 B
- `_publish/housegarden_camp.md` — 456 B

Each is frontmatter (id, physics, `weather.pollen_pulse`, connections) plus a
one-line body. The frontmatter already declares pollen as a property of the
cluster — `pollen_pulse: 0.2` on the hub, `0.4` on the greenhouse. The bodies never
say what pollen does. This change says it.

## What changed

Two bodies. No frontmatter touched. No new notes. No new fields.

### `_publish/housegarden_greenhouse.md`

Before:

```
# Greenhouse

Formation biome in the House & Garden cluster.
```

After:

```
# Greenhouse

Formation biome in the House & Garden cluster.

Growth here is not planned. The flower emerges where the humidity holds, and the
glass keeps the air still enough for it to stay. Pollen settles on the panes and
is not cleaned off.

This is the only place in the cluster where a seed becomes a plant without
anyone deciding it should.
```

Satisfies: `growth`, `flower` (flora) and `emerge` (motion).

### `_publish/housegarden.md`

Before:

```
# House & Garden

Hub biome for the Herb Room, Greenhouse, Lagoon, and Camp.
```

After:

```
# House & Garden

Hub biome for the Herb Room, Greenhouse, Lagoon, and Camp.

Pollen moves through the cluster on the garden channel. The bee crosses from the
greenhouse to the herb room and back. The butterfly drifts over the lagoon and
does not land. Nothing here is pollinated on purpose.

The house keeps the wind out. The garden is what the wind does anyway.
```

Satisfies: `bee`, `butterfly` (pollinator) and `wind`, `moves` (motion).

### Why singular nouns

The gate is `\bbee\b`, not `\bbees?\b`. `"bees"` fails the boundary — the `s` is a
word character. Same for `"flowers"`, `"butterflies"`, `"pollinators"`. The prose
uses definite singular (`The bee`, `The flower`), which is already Threshold's
register — *The Echo*, *The Snail*, *The Threshold*.

### Resulting split

- flora ← `housegarden_greenhouse.md` (only note matching `flower|growth`)
- pollinator ← `housegarden.md` (only note matching `bee|butterfly`)

So `data-garden-flora-source` and `data-garden-pollinator-source` differ. Both
booleans true means the window shows the flower and the pollinator.

## Rebuild

`website/data/threshold-vault.json` is generated. It was regenerated with:

```powershell
cd C:\Threshold
python tools/build_vault_data.py
```

Baseline before the rebuild: 21 documents, 60,953 B. The rebuild is expected to
produce the same 21 documents — 20 notes with `publish: true` under `_publish`,
plus `_publish/organs/hub/hub-visual-spec.md`, which carries no `publish` field
and is included as-is.

## Verify

```powershell
cd C:\Threshold
node -e "const d=require('./website/data/threshold-vault.json'); const g=d.documents.filter(n=>/^_publish\/housegarden(?:_|\/|\.md)/i.test(n.relativePath||'')); for(const n of g) console.log(n.relativePath, /\b(flora|flower|pollinator|butterfly|bee|insect)\b/i.test(n.title+' '+n.body), /\b(move|motion|drift|sway|wind|appear|emerge|flight|fly|growth)\b/i.test(n.title+' '+n.body));"
npm test
```

Expected: `housegarden_greenhouse.md` → `true true`; `housegarden.md` → `true true`;
the other three → `false false`. Full suite unchanged at the known 5 failures.

## Undo

```powershell
$v = 'C:\Users\James Romeo\Threshold\Threshold-Studio-Content\publish\_publish'
Copy-Item 'C:\Threshold\_archive\garden-vault-source-20261103\housegarden.md' "$v\housegarden.md" -Force
Copy-Item 'C:\Threshold\_archive\garden-vault-source-20261103\housegarden_greenhouse.md' "$v\housegarden_greenhouse.md" -Force
Copy-Item 'C:\Threshold\_archive\garden-vault-source-20261103\threshold-vault.json' 'C:\Threshold\website\data\threshold-vault.json' -Force
```

Byte copies of all three originals sit beside this README.

## Not changed, and why

- `_publish/housegarden_herb_room.md`, `_lagoon.md`, `_camp.md` — left as stubs.
  The gate picks one flora source and one pollinator source; three more candidates
  would only randomise which note the window cites. `choose()` picks at random
  from all matches, so adding candidates makes the provenance unstable.
- `weather.pollen_pulse` on the hub is `0.2` and on the greenhouse `0.4`. The new
  prose says pollen settles and moves; it does not claim a rate. The numbers stay
  in frontmatter where the engine reads them.
- The Herb Room's own note (`_publish/Herb Room.md`, 539 B) is a chamber record
  with `exits: [basin]`. The window is not a biome and does not belong in the
  garden cluster.
