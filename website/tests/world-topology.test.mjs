import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import spokes from "../config/spokes.json" with { type: "json" };
import {
  topologyById,
  validateWorldTopology,
  WORLD_TOPOLOGY_CLASSIFICATIONS
} from "../scripts/world-topology-contract.js";

async function loadTopology() {
  return readFile(new URL("../config/world-topology.json", import.meta.url), "utf8").then(JSON.parse);
}

test("declares canonical place contracts for the published world surface", async () => {
  const topology = await loadTopology();
  assert.equal(validateWorldTopology(topology), topology);
  assert.deepEqual(WORLD_TOPOLOGY_CLASSIFICATIONS, ["KEEP", "CONNECT", "COMPLETE", "NEW"]);

  const places = topologyById(topology);
  assert.equal(places.get("entry-hub").route, "/index.html");
  assert.equal(places.get("world-holding").route, "/hub.html");
  assert.equal(places.get("world-holding").returnsTo, "entry-hub");
  assert.equal(places.get("world-map").classification, "CONNECT");
  assert.equal(places.get("lanternroot-conservatory").classification, "NEW");

  for (const place of topology.places.filter((place) => !place.route.startsWith("/portal/"))) {
    await access(new URL(`..${place.route}`, import.meta.url));
  }
});

test("normalizes spoke and access-flow destinations against canonical topology", async () => {
  const [topology, flow] = await Promise.all([
    loadTopology(),
    readFile(new URL("../config/access-flow.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  const places = topologyById(topology);

  for (const spoke of spokes.spokes) {
    const place = [...places.values()].find((candidate) => candidate.route === `/${spoke.entry}`);
    assert.ok(place, `${spoke.id} must have a canonical topology destination`);
    assert.equal(place.classification, "KEEP");
  }

  for (const stage of flow.stages) {
    const place = places.get(stage.topologyId);
    assert.ok(place, `${stage.id} must reference a declared topology place`);
    assert.equal(place.route, stage.route, `${stage.id} must use its canonical destination`);
    assert.equal(place.passage.mode, "access-stage");
    assert.equal(place.passage.stage, stage.id);
  }
});
