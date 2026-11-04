# Entry Hub restore — 2026-11-03

## What this restores

The route panel on `website/index.html` (`.entry-nav`): "Choose A Route", the ten route links, the
`hub-topology` reading, the Engine door, and the Returned Seeds archive.

## Why

The panel was hidden, then deleted, and never replaced on the page that owns it.

| commit | what it did |
|---|---|
| `57ec438f` | `.entry-nav` is visible — `border`, `background: var(--panel-strong)`, `align-self: center`; markup present |
| `c1c1ce5b` "hub" | adds `.entry-nav { display: none; }`. The panel is hidden, but `.entry-panel` keeps `grid-template-columns: 1.1fr 0.9fr` — so the right-hand grid column stays allocated and empty |
| `737cb04c` Revert "hub" | does not touch `website/index.html`; the hidden panel stays hidden |
| `03d2c98d` "hub stuff" | deletes the `<aside class="entry-nav">` markup from `index.html`, moves a copy into `hub.html`, and keeps `display: none` on both `.entry-nav` rules |

Consequences still live at the time of this record:

- `index.html` L133 still declares a two-column grid with one child.
- `scripts/entry-warmth.js` L299–303 still queries `.entry-actions a` and `[data-hub-topology]` — no matches, so route constellations and the topology reading never run.
- `scripts/fibonacci-entry.js` L19 and L28 still query `[data-hub-seed-archive]` and `[data-prime-door]` — no matches, so the seed archive and the Engine door never initialise.
- ~600 lines of `.entry-nav`, `.entry-actions`, `.hub-topology`, `.entry-engine`, `.entry-archive` CSS remain with no markup to style.

## What changed

`website/index.html` only.

1. `<aside class="entry-nav">` markup restored inside `.entry-panel`, after `.entry-copy`.
2. `.entry-nav { display: none }` → `display: flex` (desktop rule and the `max-width: 900px` rule).
3. `.entry-map-link` returns to its own purpose: `href="world-map.html"`, label "Open World Map".
4. The crossing moves back to `.entry-crossing`: `href="housegarden.html"`, label "Cross the first threshold", carrying `data-main-hub-first-crossing`.

`data-main-hub-first-crossing` and `href="housegarden.html"` are both preserved on the same element, so
`main-hub-runtime-ownership.test.js` MHR-022 still holds.

## Undo

```
cd C:\Threshold
git checkout 03d2c98d -- website/index.html
```

That returns the file to the exact state before this record. Nothing was deleted; the markup restored
here is a copy of `c1c1ce5b:website/index.html` L1578–1611.

## Not done here

- `hub.html` still carries its own copy of the route menu. Whether both pages should have one is a
  design question (see `Return Hub — Interaction Grammar`), not a regression fix.
- No JavaScript was changed.

---

# Addendum — 2026-11-03, mobile

## The restored crossing does not render, and cannot fire

Step 4 above put the crossing back under `.entry-crossing`. That class is `display: none` in its base
rule (`website/index.html` L1469), and **no rule anywhere sets it to a visible value** — there is no
`body[data-main-hub-crossing-state]` selector. `main-hub-engine-binding.js` L21 writes that attribute
and nothing reads it.

It has been hidden since `c1c1ce5b` added the class and the anchor together. At `03d2c98d` the anchor
was deleted and the CSS orphaned. The restore re-attached an anchor to a class that was never visible.
**This is a consequence of the restore, not a pre-existing bug.**

It would also not navigate if it were visible. `main-hub-engine-binding.js` L38 calls
`event.preventDefault()` before asking the runtime, and `main-hub-runtime.js` navigates only on
`state-changed` (L82–94). The engine endpoint is `http://127.0.0.1:8000` (`index.html` L1606), so on
any device that is not the machine running the Python engine the runtime emits `engine-unavailable`
(L24–27) and the tap is swallowed with no effect.

**Decision: leave it hidden.** A visible crossing on a phone is a dead button, which is worse than an
absent one. The route list is the path into the world. Recorded in `Movement Vocabulary` → *Mobile —
workable, not complete*.

## Mobile layout: a grid that never becomes a grid

`website/index.html` L1519–1522, inside `@media (max-width: 900px)`:

```css
.entry-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}
```

The base rule is `display: flex` (L862). `grid-template-columns` and the `:first-child { grid-column:
1 / -1 }` at L1536 are therefore inert — the links wrap as pills instead of forming the two-column
block the author wrote.

## What changed

`website/index.html`, one line: `display: grid;` added to `.entry-actions` in the `max-width: 900px`
block. This makes the already-written layout take effect; it adds no new design.

## Undo (addendum only)

Delete the line `display: grid;` from `.entry-actions` in the `max-width: 900px` block (currently
L1520). To revert the restore as well:

```
cd C:\Threshold
git checkout 03d2c98d -- website/index.html
```

---

# Addendum 2 - the crossing had no reveal rule

Written before the change, per archive discipline.

## The finding

`website/index.html` L1468:

```css
.entry-crossing {
  display: none;
  ...
}
```

No rule anywhere sets it to anything else. Meanwhile `website/scripts/main-hub-runtime.js`
L11-22 publishes every state transition, and `main-hub-engine-binding.js` L20-22 writes it to
the document:

```js
onStateChange({ state }) {
  root.dataset.mainHubCrossingState = state;
}
```

So the runtime has been publishing `ready` / `crossing-pending` / `crossing-unavailable` /
`engine-unavailable` to `body[data-main-hub-crossing-state]` since it was written. Nothing
consumed it. The gate was complete except for the last wire.

## Proof the gate works

Engine started (`python -m uvicorn engine.api:app --port 8000`), then:

    POST /input/housegarden {"type":"node.activate"}
    -> {"status":"ok","recorded":true,"responded":true,"reason":"state-changed"}

    POST again
    -> {"status":"ok","recorded":true,"responded":false,"reason":"recorded-only"}

`state-changed` is the branch that calls `navigate(destination)` (runtime L82-93). The adapter
activates `housegarden` (adapter L1, L40), which is present in the engine registry.

## What changed

`website/index.html`, one rule added after the `.entry-crossing` base block:

```css
body[data-main-hub-crossing-state="ready"] .entry-crossing {
  display: inline-block;
}
```

The anchor is revealed only when the engine has answered `/tick` successfully. With no engine,
the attribute never becomes `ready` and the anchor stays hidden - which is the honest rendering.

## Undo (addendum 2 only)

Delete the rule `body[data-main-hub-crossing-state="ready"] .entry-crossing { ... }` from
`website/index.html` (immediately after the `.entry-crossing` base block).

---

# Addendum 3 - the Engine door came off the player Hub

Written before the change.

## The finding

`website/index.html` L1687 and `website/hub.html` L1887 both carry:

```html
<a class="entry-engine" data-prime-door data-door-state="sealed"
   href="deep-system/engine.html" aria-label="Enter the next Engine ring">Enter Engine</a>
```

`deep-system/engine.html` (9,323 B) is "Threshold Engine - Mechanics": an Engine Telemetry Matrix and a
Calibration panel (Inner Speed, Inner Volume, Outer Speed, Outer Volume, Damping, Pull Cap px/s,
Scale Cap /s, Retire Start/End ms). It is a makers' instrument, not a room.

`deep-system/` contains no other pages, so `descentRings = {13:8, 8:5, 5:3, 3:1}` in
`scripts/fibonacci-entry.js` L32 has nowhere to descend to. The "ring descent" is an animation
(`revealThemes["enter engine"]`, L60) whose only destination is the console.

## Second finding (not fixed here)

`.entry-engine` is inert by default (`pointer-events: none`, L907) and opens on
`[data-door-state="open"]` **or `:focus-visible`** (L916-921). A keyboard user could tab onto a
sealed door and open it. With the element removed, the hole has no instances.

## What changed

The anchor was deleted from both Hubs. Nothing else was touched: the CSS block, the
`primeDoor` binding (which is null-guarded), and the `ring-descent` theme all remain.

Consequence: `deep-system/engine.html` is now reachable by direct URL only, until the Studio
surface links it. Adding that link is a separate change (the portal is a built bundle).

## Undo (addendum 3 only)

Re-insert, immediately before `<section class="entry-archive" data-hub-seed-archive ...>` in
`website/index.html` (was L1687) and in `website/hub.html` (was L1887):

    <a class="entry-engine" data-prime-door data-door-state="sealed" href="deep-system/engine.html" aria-label="Enter the next Engine ring">Enter Engine</a>
