# Threshold Spoke Wheel Archive

This archive preserves discovered HTML versions by architectural level without moving, merging, or overwriting the active website.

## Levels

- `level-1-hub/home`: Home, Root Sigil, index, and historic hub variants.
- `level-2-spokes`: Current manifest spokes plus legacy/extended engine branches.
- `website/house-and-garden`: Detailed multi-file House & Garden chamber archive, linked from the spoke archive.

The current `website/config/spokes.json` manifest defines House & Garden, Ethos, Discover, Invitation, Mythology, Glyphs, Contact, and Engine. Learning Wheel, Ledger, and Dialogues remain in the engine's historical branch inventory and are preserved at the same wheel level with that distinction recorded.

## Version Rules

1. Git-history snapshots are deduplicated by blob ID.
2. Current, core, and legacy-construct files are preserved as exact `source.html` snapshots.
3. Duplicate paths with identical content are aliases in `manifest.json`, not extra copied files.
4. Snapshot HTML is archival source and is not rewritten to make relative dependencies runnable.
5. Active website pages remain in `website/` and are not replaced by archive files.

## Fibonacci Layering Law

Active routes move inward through `13 -> 8 -> 5 -> 3 -> 2 -> 1`. Fib 13 is the shared entry layer; a path choice selects a spoke version at Fib 8, and that lineage must remain attached to later activations. Multiple versions may coexist at any ring.

`website/config/fibonacci-routes.json` is the runtime route contract. The folders under `website/house-and-garden/fib*/` are the implementation scaffold. Historical snapshots are not assigned to named runtime versions until their provenance and intended experience are both verified.