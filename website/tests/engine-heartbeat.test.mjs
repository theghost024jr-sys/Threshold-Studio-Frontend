import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceHeartbeatClock,
  createHeartbeatClock,
  FLICKER_MAX_MS,
  FLICKER_MIN_MS,
  HEARTBEAT_PHASES,
  heartbeatEnvelope
} from "../scripts/engine-heartbeat.js";

test("emits micro-pulses every three seconds and a primary heartbeat every twelve", () => {
  const clock = createHeartbeatClock({ startedAt: 0, random: () => 0.5 });
  const events = advanceHeartbeatClock(clock, 12000, () => 0.5);
  assert.deepEqual(events.map((event) => [event.phase, event.occurredAt]), [
    ["micro-pulse", 3000],
    ["micro-pulse", 6000],
    ["micro-pulse", 9000],
    ["micro-pulse", 12000],
    ["heartbeat", 12000]
  ]);
});

test("schedules each flicker anomaly inside the eighteen to twenty-four second window", () => {
  const earliest = createHeartbeatClock({ startedAt: 1000, random: () => 0 });
  const latest = createHeartbeatClock({ startedAt: 1000, random: () => 1 });
  assert.equal(earliest.nextFlickerAt, 1000 + FLICKER_MIN_MS);
  assert.equal(latest.nextFlickerAt, 1000 + FLICKER_MAX_MS);
  assert.equal(
    advanceHeartbeatClock(earliest, 19000, () => 0).find((event) => event.phase === "flicker").occurredAt,
    19000
  );
});

test("carries every field subsystem in each heartbeat phase", () => {
  const systems = [
    "primeAtom", "hub", "voidField", "fieldFrame", "engineCore",
    "logo", "orbitNodes", "revealEngine", "descentEngine"
  ];
  Object.values(HEARTBEAT_PHASES).forEach((phase) => {
    assert.deepEqual(systems.filter((system) => phase[system]), systems);
  });
});

test("produces a bounded event envelope", () => {
  const event = { occurredAt: 100, durationMs: 1000 };
  assert.equal(heartbeatEnvelope(event, 99), 0);
  assert.equal(heartbeatEnvelope(event, 100), 0);
  assert.equal(heartbeatEnvelope(event, 600), 1);
  assert.equal(heartbeatEnvelope(event, 1101), 0);
});