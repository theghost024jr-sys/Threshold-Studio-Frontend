import assert from "node:assert/strict";
import test from "node:test";

import {
  GlyphRegistry,
  glyphRegistry,
  normalizeGlyphSignals,
  resolveGlyphState,
} from "../scripts/glyph-system.js";

test("normalizes glyph signals into supported ranges", () => {
  assert.deepEqual(normalizeGlyphSignals({ resonance: 2, drift: -1, anchored: 1 }), {
    resonance: 1,
    drift: 0,
    anchored: false,
  });
});

test("resolves all field signal states", () => {
  assert.equal(resolveGlyphState({ resonance: 0.4, drift: 0.1, anchored: true }), "anchored");
  assert.equal(resolveGlyphState({ resonance: 0.4, drift: 0.8, anchored: true }), "drifting");
  assert.equal(resolveGlyphState({ resonance: 0.8, drift: 0.3 }), "resonant");
  assert.equal(resolveGlyphState({ resonance: 0.4, drift: 0.3 }), "stable");
});

test("registers immutable definitions and rejects duplicates", () => {
  const registry = new GlyphRegistry();
  const definition = registry.register({ id: "test", elements: [{ tag: "circle" }] });

  assert.equal(registry.get("test"), definition);
  assert.equal(Object.isFrozen(definition), true);
  assert.throws(() => registry.register({ id: "test", elements: [{ tag: "path" }] }), /already registered/);
});

test("ships the field signal glyph", () => {
  assert.equal(glyphRegistry.has("field-signal"), true);
  assert.deepEqual(glyphRegistry.list(), ["field-signal"]);
});