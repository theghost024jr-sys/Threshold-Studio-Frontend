import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  completeStage,
  createAccessState,
  lockedRequirements,
  nextAvailableStage,
  prerequisitesMet
} from "../scripts/access-flow-model.js";

const stages = [
  { id: "discovery", requires: [] },
  { id: "dialogue", requires: [] },
  { id: "hub", requires: [] },
  { id: "invitation", requires: ["discovery", "dialogue", "hub"] },
  { id: "accept", requires: ["invitation"] },
  { id: "engine", requires: ["accept"] },
  { id: "trunk", requires: ["engine"] },
  { id: "contact", requires: ["trunk"] }
];

test("advances the graft only when stage prerequisites are complete", () => {
  let state = createAccessState();
  assert.equal(nextAvailableStage(stages, state).id, "discovery");
  assert.equal(prerequisitesMet(stages[3], state), false);
  assert.deepEqual(completeStage(stages[3], state).completed, []);

  for (const stage of stages.slice(0, 3)) state = completeStage(stage, state);
  for (const stage of stages.slice(3)) state = completeStage(stage, state);

  assert.deepEqual(state.completed, stages.map((stage) => stage.id));
  assert.equal(nextAvailableStage(stages, state), null);
});

test("reports only unmet route requirements and normalizes persisted state", () => {
  const state = createAccessState({ completed: ["discovery", "discovery", null] });
  assert.deepEqual(state.completed, ["discovery"]);
  assert.deepEqual(lockedRequirements(stages[3], state), ["dialogue", "hub"]);
});

test("declares every registered project as a chamber participant", async () => {
  const spokes = JSON.parse(await readFile(new URL("../config/spokes.json", import.meta.url), "utf8"));
  const flow = JSON.parse(await readFile(new URL("../config/access-flow.json", import.meta.url), "utf8"));
  assert.deepEqual(
    flow.projects.map((project) => project.id).sort(),
    spokes.spokes.map((spoke) => spoke.id).sort()
  );
});