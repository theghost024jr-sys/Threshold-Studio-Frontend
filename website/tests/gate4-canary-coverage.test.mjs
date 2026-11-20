import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

// Law: every NEW place is either watched by Gate 4 or explicitly accounted
// for. The gap between "what the gate protects" and "what exists" must never
// widen silently.
test("every NEW place is a Gate 4 canary or declared out of canary scope", async () => {
  const [topology, spec, scope] = await Promise.all([
    read("../config/world-topology.json").then(JSON.parse),
    read("./gate4-six-canary-acceptance.spec.mjs"),
    read("../config/gate4-canary-scope.json").then(JSON.parse),
  ]);

  const canaryBlock = spec.match(/GATE4_CANARIES = \[([\s\S]*?)\];/);
  assert.ok(canaryBlock, "the Gate 4 spec declares its canaries");
  const canaryRoutes = new Set(
    [...canaryBlock[1].matchAll(/route: "([^"]+)"/g)].map(([, route]) => route)
  );
  assert.ok(canaryRoutes.size >= 6, "the six-canary floor holds");

  const declared = new Map(scope.outOfScope.map((entry) => [entry.id, entry]));

  const unaccounted = topology.places
    .filter((place) => place.classification === "NEW")
    .filter((place) => !canaryRoutes.has(place.route))
    .filter((place) => {
      const declaration = declared.get(place.id);
      return !declaration || typeof declaration.reason !== "string" || declaration.reason.trim() === "";
    });

  assert.deepEqual(
    unaccounted.map((place) => `${place.id} -> ${place.route}`),
    [],
    "NEW places must be canary-covered or carry a reasoned out-of-scope declaration"
  );

  // Declarations stay honest: no stale ids, no double accounting.
  const placeIds = new Set(topology.places.map((place) => place.id));
  for (const entry of scope.outOfScope) {
    assert.ok(placeIds.has(entry.id), `${entry.id} declaration refers to a declared place`);
    const place = topology.places.find((candidate) => candidate.id === entry.id);
    assert.ok(
      !canaryRoutes.has(place.route),
      `${entry.id} cannot be both a canary and out of scope`
    );
  }
});
