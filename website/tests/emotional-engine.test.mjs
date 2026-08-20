import assert from "node:assert/strict";
import test from "node:test";

await import("../scripts/emotional-engine.js");

const { createEmotionalEngine, checkGlyphAppearance } = globalThis.ThresholdEmotionEngine;

test("starts with four neutral emotional flags", () => {
  const engine = createEmotionalEngine();
  assert.deepEqual(engine.getState().emotion, {
    fear: 0,
    relief: 0,
    confusion: 0,
    reflection: 0
  });
});

test("accepts every emotional input source", () => {
  const engine = createEmotionalEngine();
  engine.transitionChamber({ id: "clearing", force: "soil" }, { reflection: 1 });
  engine.interactSpecies({ species: "cindervox", emotion: { fear: 1 } });
  engine.receiveSpiritSignal({ species: "porpoise", emotion: "relief", amount: 2 });
  engine.applyNarrativeBeat({ id: "lost-path", emotion: { confusion: 1 } });
  engine.choose({ id: "stay", emotion: { reflection: 1 } });
  assert.deepEqual(engine.getState().emotion, {
    fear: 1,
    relief: 2,
    confusion: 1,
    reflection: 2
  });
});

test("matches glyph appearance to chamber force and emotion", () => {
  const cases = [
    ["collapse", "fear"],
    ["expand", "relief"],
    ["fog", "confusion"],
    ["soil", "reflection"]
  ];
  for (const [force, emotion] of cases) {
    assert.equal(checkGlyphAppearance({ force }, { [emotion]: 1 }), force);
    assert.equal(checkGlyphAppearance({ force }, {}), null);
  }
});

test("requires appearance before activation and applies each chamber effect", () => {
  const expected = {
    collapse: ["unstable", "cracks"],
    expand: ["open", "new-paths"],
    fog: ["obscured", "hidden-routes"],
    soil: ["grounded", "memory"]
  };
  for (const [glyph, [status, effect]] of Object.entries(expected)) {
    const engine = createEmotionalEngine();
    assert.equal(engine.activateGlyph(glyph), null);
    engine.transitionChamber({ id: glyph, force: glyph });
    engine.choose({ emotion: { [{ collapse: "fear", expand: "relief", fog: "confusion", soil: "reflection" }[glyph]]: 1 } });
    const chamber = engine.activateGlyph(glyph);
    assert.equal(chamber.status, status);
    assert.ok(chamber.effects.includes(effect));
  }
});

test("spirit signals can amplify and dampen emotion", () => {
  const engine = createEmotionalEngine();
  engine.receiveSpiritSignal({ emotion: "confusion", amount: 3, mode: "amplify" });
  engine.receiveSpiritSignal({ emotion: "confusion", amount: 1, mode: "dampen" });
  assert.equal(engine.getState().emotion.confusion, 2);
});