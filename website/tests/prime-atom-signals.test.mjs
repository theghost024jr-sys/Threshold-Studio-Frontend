import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPrimeAtomSignalChain,
  createChamberContext,
  createDirectionVector,
  DIRECTION_PROFILES,
  ENGINE_HEARTBEAT_MS
} from "../scripts/prime-atom-signals.js";

test("maps every approach to its canonical spin, color, and pressure wave", () => {
  assert.deepEqual(DIRECTION_PROFILES.left, {
    spinDirective: "clockwise", colorPulse: "blue", pressureWave: "horizontal"
  });
  assert.deepEqual(DIRECTION_PROFILES.right, {
    spinDirective: "counter-clockwise", colorPulse: "gold", pressureWave: "horizontal"
  });
  assert.deepEqual(DIRECTION_PROFILES.top, {
    spinDirective: "tilt-down", colorPulse: "cyan", pressureWave: "vertical"
  });
  assert.deepEqual(DIRECTION_PROFILES.bottom, {
    spinDirective: "tilt-up", colorPulse: "amber", pressureWave: "vertical"
  });
});

test("measures direction, angle, speed, and proximity as one input vector", () => {
  const vector = createDirectionVector({
    pointerX: 40, pointerY: 100, previousX: 30, previousY: 100,
    elapsedMs: 20, centerX: 100, centerY: 100, radius: 40
  });
  assert.equal(vector.direction, "left");
  assert.equal(vector.angle, Math.PI);
  assert.equal(vector.speed, 0.5);
  assert.equal(vector.proximity, 10 / 11);
});

test("maps each Hub chamber to its ritual request", () => {
  const rituals = {
    "House and Garden": "petals",
    Ethos: "glyphfall",
    "Learning Wheel": "cycle-burst",
    Discover: "drift-scatter",
    Invitation: "threshold-opening",
    Mythology: "firefall",
    Glyphs: "symbol-cascade",
    Dialogues: "signal-oscillation",
    Contact: "transmission-burst"
  };
  Object.entries(rituals).forEach(([chamber, ritual]) => {
    assert.equal(createChamberContext(chamber).ritual, ritual);
  });
});

test("carries the complete five-layer signal chain", () => {
  const directionVector = createDirectionVector({
    pointerX: 100, pointerY: 20, centerX: 100, centerY: 100, radius: 40
  });
  const input = {
    directionVector,
    activation: "gesture",
    chamberContext: createChamberContext("Mythology")
  };
  const chain = buildPrimeAtomSignalChain(input);

  assert.equal(chain.primeAtom.spinDirective, "tilt-down");
  assert.equal(chain.primeAtom.colorPulse, "cyan");
  assert.equal(chain.primeAtom.ritualRequest, "firefall");
  assert.equal(chain.engine.heartbeatSync.intervalMs, ENGINE_HEARTBEAT_MS);
  assert.ok(chain.engine.heartbeatSync.timingScale > 1);
  assert.equal(chain.engine.pressureWave, "vertical");
  assert.equal(chain.hub.ritualTrigger, "firefall");
  assert.equal(chain.environment.revealEngine.ritual, "firefall");
  assert.equal(chain.environment.voidField.distortion, "compress-vertical");
});