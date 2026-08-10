import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import routes from "./website/config/fibonacci-routes.json" with { type: "json" };
import {
  buildFibonacciUrl,
  canShimmer,
  createLevelState,
  createThresholdPass,
  crownLevel,
  FIBONACCI_SEQUENCE,
  nextFibonacciFib,
  readFibonacciLineage,
  rotateLevel,
  updateLevelState,
  resolveFibonacciRoute
} from "./website/scripts/fibonacci-routing.js";

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

test("keeps Fib 8 route manifests aligned with the loader contract", async () => {
  const spoke = routes.spokes["house-garden"];
  for (const route of spoke.routes) {
    const source = await readFile(
      new URL(`./vault-holding/website-history/house-and-garden/fib8/${route.version}/route.json`, import.meta.url),
      "utf8"
    );
    const manifest = JSON.parse(source);
    assert.equal(manifest.spoke, "house-garden");
    assert.equal(manifest.path, route.id);
    assert.equal(manifest.version, route.version);
    assert.equal(manifest.fib, route.targetFib);
  }
  assert.deepEqual(Object.keys(spoke.continuation).map(Number), [1, 2, 3, 5]);
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