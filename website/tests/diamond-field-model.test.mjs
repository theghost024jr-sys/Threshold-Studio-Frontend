import assert from "node:assert/strict";
import test from "node:test";
import {
  DIAMOND_SPIRAL_CORNERS,
  diamondCornerEmphasis,
  diamondCornerPulse
} from "../scripts/diamond-field-model.js";

test("maps each compass corner to its documented directional spiral", () => {
  assert.deepEqual(
    DIAMOND_SPIRAL_CORNERS.map(({ direction, spiral }) => [direction, spiral]),
    [
      ["NW", "Circulation Spiral"],
      ["NE", "Effort Spiral"],
      ["SE", "Receptive Spiral"],
      ["SW", "Metabolic Spiral"]
    ]
  );
});

test("preserves current channel emphasis and passive SE balancing behavior", () => {
  assert.deepEqual(
    DIAMOND_SPIRAL_CORNERS.map(({ direction, channel }) => [direction, channel]),
    [
      ["NW", "wake"],
      ["NE", "fold"],
      ["SE", null],
      ["SW", "spire"]
    ]
  );
  assert.equal(diamondCornerEmphasis(DIAMOND_SPIRAL_CORNERS[0], "wake"), 1.18);
  assert.equal(diamondCornerEmphasis(DIAMOND_SPIRAL_CORNERS[2], "wake"), 0.88);
});

test("routes the existing inner, blended, and outer pulses to their corners", () => {
  const pulse = { inner: 0.2, blend: 0.9, outer: -0.4 };
  assert.deepEqual(
    DIAMOND_SPIRAL_CORNERS.map((corner) => diamondCornerPulse(corner, pulse)),
    [0.2, 0.9, 0.738, -0.4]
  );
});

test("rejects malformed pulse telemetry", () => {
  assert.throws(
    () => diamondCornerPulse(DIAMOND_SPIRAL_CORNERS[0], { inner: Number.NaN }),
    /finite configured pulse/
  );
});
