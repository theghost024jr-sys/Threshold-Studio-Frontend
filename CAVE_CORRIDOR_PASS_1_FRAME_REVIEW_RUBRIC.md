# Cave Corridor — Pass 1 Frame Review Rubric

## Purpose

Determine whether the authorized Pass 1 visual work makes:

**Mouth → Compression → physical Bend**

visually legible **without altering spatial truth**.

This is a visual acceptance review, not a mechanics review and not a redesign opportunity.

A visually successful frame cannot override a failed structural check.

---

## 0. Evidence admissibility

Before judging appearance, every submitted frame must be attributable.

Each frame must include or be accompanied by:

- pinned commit
- served URL
- readable build marker
- exact progress value
- derived Cave state for that progress value
- viewport class: desktop or 390 px

If any required attribution is missing:

**Result: NOT REVIEWABLE**

The frame is not evidence.

Kesh's prose may explain intent or implementation, but prose is **description, not visual evidence**.

---

## 1. Structural prerequisite

Before visual PASS can be issued:

- `CaveCorridorGeometry.js` must be byte-identical to the authorized baseline.
- `CaveCorridorState.js` must be byte-identical to the authorized baseline.
- Neither file may appear in the implementation diff.
- Rendered geometry must preserve the existing corridor sample positions.
- No vertex displacement or position noise may have been introduced.
- No width or height may have been fudged for visual effect.
- Camera position must remain derived from the existing position.
- Raising rendering tessellation density is permitted only if the existing sampler and resulting spatial truth remain unchanged.

If any structural prerequisite fails:

**PASS 1: FAIL**

Do not visually rationalize the result.

---

# Visual review

Judge the frames as a **sequence**, not merely as attractive individual images.

The viewer should be able to understand increasing enclosure and the existence of a real turn from the rendered world itself.

## 2. Mouth

### Required reading

The Mouth must read as the beginning of a traversable physical corridor.

Look for:

- an understandable opening into space
- floor/wall/ceiling relationships sufficient to establish enclosure
- a forward route that can be visually followed
- enough depth information to distinguish passage from abstract layered shapes
- Cave-local material and lighting behavior

### Must not read primarily as

- floating shards
- disconnected planes
- an abstract dark composition
- a Portal effect
- an indistinct void
- Canyon influence

**Decision: PASS / HOLD**

**Observed evidence:**

Record only what is visible in the frame.

---

## 3. Compression

### Required reading

Compared with the Mouth, the corridor must visibly become **more constrained**.

The distinction should be understandable without reading the progress value.

Look for:

- stronger enclosure
- reduced apparent openness
- increasing wall/ceiling presence
- perspective or lighting cues that reinforce narrowing
- continued physical continuity with the Mouth

The test is relational:

Does this frame unmistakably read as farther into the **same corridor**, under increasing physical constraint?

A darker image by itself is not compression.

More fog by itself is not compression.

Less visibility caused only by lighting is not sufficient if the physical corridor remains visually unreadable.

**Decision: PASS / HOLD**

**Observed evidence:**

Record the visible change from Mouth.

---

## 4. Physical Bend

This is the critical Pass 1 frame.

### Required reading

The Bend must appear to be a consequence of the corridor's **physical form**.

The viewer should perceive that:

- the corridor changes direction
- intervening cave structure produces the turn
- the previous straight sightline is being physically lost
- movement continues into space beyond the turn
- occlusion reads as wall geometry rather than a screen effect

### Critical question

If all labels, progress numbers, and explanatory prose disappeared, would the frame itself give a reasonable viewer visual evidence that the corridor physically bends?

If **no**:

**BEND: HOLD**

### Automatic visual HOLD conditions

Hold if the apparent Bend depends primarily on:

- darkness
- fog
- contrast loss
- a vignette
- an opaque-looking overlay
- an abrupt stylistic transition
- disappearance without visible intervening structure

Those techniques may support the Bend.

They may not substitute for the Bend.

---

## 5. Sequential legibility

Now compare all four progress values together.

The central Pass 1 question is:

Can the sequence itself be read as travel from an opening, through increasing compression, into a physical turn?

Required sequence:

**Mouth**

↓

**increasing enclosure**

↓

**Compression**

↓

**physical Bend becomes dominant**

↓

**forward continuation survives while the prior sightline is lost**

The sequence must not look like four unrelated visual treatments of approximately the same abstract scene.

**Decision: PASS / HOLD**

---

## 6. Zero-foreign-influence check

For Mouth, Narrowing, and Bend, the submitted imagery must remain consistent with the authorized zero-foreign-influence state.

Do not visually introduce Canyon identity into Pass 1 merely to make the Cave more interesting.

Specifically review for unintended readings of:

- Canyon light
- warmth
- sand
- exterior openness
- directional pull toward Canyon
- other environmental language belonging beyond Pass 1

Ambiguous ordinary Cave illumination is not automatically foreign influence.

The question is whether the image visually begins telling the **Canyon story before the existing state permits it**.

**Decision: PASS / HOLD**

---

## 7. Desktop ↔ 390 px identity

Desktop and 390 px are not required to produce identical compositions.

They are required to preserve the same **spatial reading**.

At 390 px:

- Mouth must still read as Mouth.
- Compression must remain perceptible.
- Bend must remain physically legible.
- responsive framing must not convert physical occlusion into apparent cropping.
- the corridor must not lose its identity and become an abstract composition because less of the scene is visible.

A mobile frame may be tighter.

It may not tell a different spatial story.

**Decision: PASS / HOLD**

---

## 8. Craft observations

Only after the gate questions have been judged, record secondary visual observations such as:

- material readability
- surface differentiation
- lighting balance
- normal response
- fog contribution
- depth cues
- visual noise
- excessive darkness
- excessive uniformity

These observations are **craft feedback**, not independent authority to change geometry or state.

If fixing a craft problem appears to require changing spatial truth, stop and escalate rather than recommending the change.

---

# Final disposition

## PASS

Pass 1 passes only when all of the following are true:

- evidence is attributable;
- structural prerequisites pass;
- Mouth reads as entrance to a physical corridor;
- Compression is visibly stronger than Mouth;
- Bend reads as physical geometry;
- the four progress frames form a coherent traversal;
- zero foreign influence remains visually credible through the authorized stretch;
- desktop and 390 px preserve the same fundamental spatial reading.

## HOLD

Use HOLD when the implementation remains inside the grant but the rendered result does not yet satisfy the visual contract.

State the smallest visible reason for HOLD.

Example form:

**HOLD — Bend occlusion is visible, but the intervening wall does not read strongly enough for the loss of the previous sightline to be understood as physical geometry.**

A HOLD is not authorization to change geometry, state, width, height, camera position, or deferred Deep behavior.

Revise appearance only.

## FAIL

Use FAIL when the implementation violates the protected structural boundary, including a byte-identity failure of the protected geometry/state files or an alteration of spatial truth.

Visual quality cannot convert FAIL into HOLD or PASS.

---

# Reviewer record

For each frame:

**Progress:**

**Viewport:**

**Build attribution:** PASS / NOT REVIEWABLE

**Mouth reading:** PASS / N/A / HOLD

**Compression reading:** PASS / N/A / HOLD

**Physical Bend reading:** PASS / N/A / HOLD

**Foreign influence:** CLEAR / HOLD

**Observed evidence:**

**Craft observations:**

Then record the sequence:

**Structural integrity:** PASS / FAIL

**Desktop sequence:** PASS / HOLD

**390 px sequence:** PASS / HOLD

**Cross-viewport identity:** PASS / HOLD

**Pass 1 visual gate:** **PASS / HOLD / FAIL**

## Governing rule

**Do not reward intention. Do not reward explanation. Do not reward technical cleverness. Judge the attributable rendered frames against the authorized spatial truth.**
