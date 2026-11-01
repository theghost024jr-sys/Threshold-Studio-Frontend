import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  completeStage,
  contribute,
  createAccessState,
  returnSeedToHub
} from "../scripts/access-flow-model.js";

test("presents the existing Seed journey without inventing authority", async () => {
  const [flow, accessFlow, hub, entry] = await Promise.all([
    readFile(new URL("../config/access-flow.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../scripts/access-flow.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../scripts/fibonacci-entry.js", import.meta.url), "utf8")
  ]);
  const stage = (id) => flow.stages.find((candidate) => candidate.id === id);

  let state = createAccessState();
  assert.equal(state.seed, null);
  assert.equal(state.shimmer, false);
  assert.throws(() => contribute(stage("dialogue"), state));

  for (const id of ["hub", "house-garden", "herb-room", "basin"]) {
    state = completeStage(stage(id), state);
  }
  assert.equal(state.shimmer, true);

  state = contribute(stage("dialogue"), state);
  assert.deepEqual(state.seed, { chamber: "dialogue" });
  state = returnSeedToHub(stage("hub"), state);
  assert.equal(state.seed, null);
  assert.deepEqual(state.returnedSeeds, ["dialogue"]);

  assert.match(accessFlow, /A Seed is carried toward the Hub/);
  assert.match(accessFlow, /awaiting validation/);
  assert.match(accessFlow, /dataset\.seedState = "carried"/);
  assert.doesNotMatch(accessFlow, /Seed received|Return Seed to Hub/);
  assert.match(hub, /Returns remain awaiting validation\./);
  assert.match(entry, /threshold:access-flow-ready/);
  assert.match(entry, /Returned to the Hub · awaiting validation/);
  assert.doesNotMatch(entry, /Returned to the Hub.*(?:accepted|canonical)/i);
});
