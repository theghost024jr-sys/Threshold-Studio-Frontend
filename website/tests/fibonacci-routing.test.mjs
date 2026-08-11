import assert from "node:assert/strict";
import test from "node:test";

import routes from "../config/fibonacci-routes.json" with { type: "json" };
import {
  buildFibonacciUrl,
  canShimmer,
  createLevelState,
  createNodePulse,
  createThresholdPass,
  crownLevel,
  FIBONACCI_SEQUENCE,
  navigateSettlingZone,
  nextFibonacciFib,
  readFibonacciLineage,
  rotateLevel,
  updateLevelState,
  resolveFibonacciRoute
} from "../scripts/fibonacci-routing.js";

function level(overrides = {}) {
  return createLevelState({
    fib: 8,
    versions: ["v1-green-box", "v2-black-shapers", "v3-vines"],
    version: "v1-green-box",
    fields: ["version", "choice", "shimmer"],
    required: ["version", "choice"],
    pass: ["version", "choice"],
    state: { shimmer: false },
    ...overrides
  });
}

function settlingLevel(overrides = {}) {
  return level({
    fields: ["version", "choice", "shimmer", "stays"],
    state: { choice: "snail", shimmer: true, stays: 0 },
    ...overrides
  });
}

test("uses the decreasing Fibonacci layering law", () => {
  assert.deepEqual(FIBONACCI_SEQUENCE, [13, 8, 5, 3, 2, 1]);
  assert.deepEqual(routes.sequence, FIBONACCI_SEQUENCE);
});

test("maps House and Garden paths to Fib 8 versions", () => {
  assert.equal(resolveFibonacciRoute(routes, "house-garden", "garden").version, "v3-vines");
  assert.equal(resolveFibonacciRoute(routes, "house-garden", "shaper").version, "v2-black-shapers");
  assert.equal(resolveFibonacciRoute(routes, "house-garden", "chamber").version, "v1-green-box");
});

test("carries route lineage into the spoke URL", () => {
  const lineage = resolveFibonacciRoute(routes, "house-garden", "garden");
  const url = buildFibonacciUrl(lineage);
  assert.deepEqual(readFibonacciLineage(url.slice(url.indexOf("?"))), {
    spoke: "house-garden",
    path: "garden",
    version: "v3-vines",
    fib: 8
  });
});

test("rejects routes that do not move inward", () => {
  const invalid = structuredClone(routes);
  invalid.spokes["house-garden"].routes[0].targetFib = 13;
  assert.throws(
    () => resolveFibonacciRoute(invalid, "house-garden", "garden"),
    /must move inward/
  );
});

test("moves inward one Fibonacci ring at a time", () => {
  assert.equal(nextFibonacciFib(13), 8);
  assert.equal(nextFibonacciFib(8), 5);
  assert.equal(nextFibonacciFib(5), 3);
  assert.equal(nextFibonacciFib(3), 2);
  assert.equal(nextFibonacciFib(2), 1);
  assert.equal(nextFibonacciFib(1), 1);
});

test("keeps each level self-contained", () => {
  assert.throws(
    () => updateLevelState(level(), { vault: { assets: ["heavy.png"] } }),
    /undeclared fields: vault/
  );
});

test("rotates only through the level's valid versions and resets local state", () => {
  const completed = updateLevelState(level(), { choice: "mist-gate" });
  const rotated = rotateLevel(crownLevel(completed));
  assert.equal(rotated.state.version, "v2-black-shapers");
  assert.equal(rotated.state.choice, undefined);
  assert.equal(rotated.crowned, false);
  assert.equal(rotated.rotation, 1);
});

test("crowns only when required local state is complete", () => {
  assert.throws(() => crownLevel(level()), /incomplete: choice/);
  assert.equal(crownLevel(updateLevelState(level(), { choice: "mist-gate" })).crowned, true);
});

test("passes only the whitelisted final state to the next level", () => {
  const crowned = crownLevel(updateLevelState(level(), {
    choice: "mist-gate",
    shimmer: true
  }));
  assert.deepEqual(createThresholdPass(crowned), {
    fromFib: 8,
    toFib: 5,
    state: {
      version: "v1-green-box",
      choice: "mist-gate"
    }
  });
  assert.equal(canShimmer(crowned), true);
  assert.equal("shimmer" in createThresholdPass(crowned).state, false);
});

test("keeps east and west inside the settling zone", () => {
  const east = navigateSettlingZone(settlingLevel(), "east");
  assert.equal(east.action, "lateral");
  assert.equal(east.level.fib, 8);
  assert.equal(east.level.state.version, "v2-black-shapers");
  assert.equal(east.relic.direction, "east");

  const west = navigateSettlingZone(settlingLevel(), "west");
  assert.equal(west.level.fib, 8);
  assert.equal(west.level.state.version, "v3-vines");
  assert.equal(west.relic.direction, "west");
});

test("makes staying local and leaves no relic", () => {
  const result = navigateSettlingZone(settlingLevel(), "stay");
  assert.equal(result.action, "stay");
  assert.equal(result.level.state.stays, 1);
  assert.equal(result.relic, null);
  assert.equal(result.seed, null);
});

test("compresses a return into a hub seed and relic", () => {
  const result = navigateSettlingZone(settlingLevel(), "south");
  assert.equal(result.action, "return");
  assert.deepEqual(result.seed, {
    kind: "return",
    fromFib: 8,
    state: {
      version: "v1-green-box",
      choice: "snail",
      shimmer: true,
      stays: 0
    },
    relic: result.relic
  });
  assert.equal("vault" in result.seed.state, false);
});

test("limits settling navigation to Fib 5-8", () => {
  assert.equal(navigateSettlingZone(settlingLevel({ fib: 5 }), "north").action, "proceed");
  assert.throws(
    () => navigateSettlingZone(settlingLevel({ fib: 3 }), "stay"),
    /only in Fib 5-8/
  );
});

test("accepts only state seed and signal in a crowned pulse", () => {
  const crowned = crownLevel(settlingLevel());
  const movement = navigateSettlingZone(crowned, "north");
  const pulse = createNodePulse(crowned, movement, "north");
  assert.deepEqual(Object.keys(pulse), ["state", "seed", "signal"]);
  assert.deepEqual(pulse.state, {
    version: "v1-green-box",
    choice: "snail",
    direction: "north"
  });
  assert.equal(pulse.seed.kind, "relic");
  assert.equal(pulse.seed.relic.direction, "north");
  assert.equal(pulse.signal, "proceed");
});

test("accepts stay without transferring a relic", () => {
  const crowned = crownLevel(settlingLevel());
  const pulse = createNodePulse(crowned, navigateSettlingZone(crowned, "stay"), "stay");
  assert.equal(pulse.seed, null);
  assert.equal(pulse.signal, "stay");
});

test("rejects a pulse unless crown state seed and signal are valid", () => {
  const uncrowned = settlingLevel();
  const movement = navigateSettlingZone(uncrowned, "south");
  assert.throws(
    () => createNodePulse(uncrowned, movement, "south"),
    /previous node is not crowned/
  );

  const crowned = crownLevel(uncrowned);
  assert.throws(
    () => createNodePulse(crowned, { ...movement, action: "lateral" }, "south"),
    /signal does not match direction/
  );
  assert.throws(
    () => createNodePulse(crowned, { ...movement, seed: { kind: "return" } }, "south"),
    /seed is invalid/
  );
  const contaminatedState = { ...movement.seed.state, vault: { heavy: true } };
  assert.throws(
    () => createNodePulse(crowned, {
      ...movement,
      seed: {
        ...movement.seed,
        state: contaminatedState,
        relic: { ...movement.seed.relic, state: contaminatedState }
      }
    }, "south"),
    /seed is invalid/
  );
});