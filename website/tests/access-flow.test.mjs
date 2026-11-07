import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  completeStage,
  contribute,
  createAccessState,
  classifyBranchTarget,
  lockedRequirements,
  nextAvailableStage,
  prerequisitesMet,
  returnSeedToHub,
  validateAccessFlow,
  validateAuthoritativeState
} from "../scripts/access-flow-model.js";
import { INVARIANT_FAILURE } from "../scripts/invariant-kernel.js";

const stages = [
  { id: "hub", requires: [] },
  { id: "house-garden", requires: ["hub"] },
  { id: "herb-room", requires: ["house-garden"] },
  { id: "basin", requires: ["herb-room"], awardsShimmer: true },
  { id: "dialogue", requires: [], requiresShimmer: true, kind: "contribution", completion: "action" }
];

test("advances the graft only when stage prerequisites are complete", () => {
  let state = createAccessState();
  assert.equal(nextAvailableStage(stages, state).id, "hub");
  assert.equal(prerequisitesMet(stages[4], state), false);
  assert.deepEqual(completeStage(stages[4], state).completed, []);

  for (const stage of stages.slice(0, 4)) state = completeStage(stage, state);

  assert.deepEqual(state.completed, stages.slice(0, 4).map((stage) => stage.id));
  assert.equal(state.shimmer, true);
  assert.equal(prerequisitesMet(stages[4], state), true);
});

test("reports only unmet route requirements and normalizes persisted state", () => {
  const state = createAccessState({ completed: ["hub", "hub", null] });
  assert.deepEqual(state.completed, ["hub"]);
  assert.deepEqual(lockedRequirements(stages[4], state), ["Shimmer"]);
});

test("requires Shimmer for contributions and returns a Seed only to the Hub", () => {
  let state = createAccessState();
  assert.throws(
    () => contribute(stages[4], state),
    (error) => error.code === INVARIANT_FAILURE.UNEARNED_EFFECT && /locked/.test(error.message)
  );
  for (const stage of stages.slice(0, 4)) state = completeStage(stage, state);
  state = contribute(stages[4], state);
  assert.deepEqual(state.seed, { chamber: "dialogue" });
  assert.throws(
    () => returnSeedToHub(stages[1], state),
    (error) => error.code === INVARIANT_FAILURE.UNEARNED_EFFECT && /only to the Hub/.test(error.message)
  );
  state = returnSeedToHub(stages[0], state);
  assert.equal(state.seed, null);
  assert.deepEqual(state.returnedSeeds, ["dialogue"]);
});

test("rejects contradictory state and distinguishes endpoints from broken branches", () => {
  assert.throws(() => createAccessState({ seed: { chamber: "dialogue" }, returnedSeeds: ["dialogue"] }),
    (error) => error.code === INVARIANT_FAILURE.TRUTH_CONTRADICTION);
  assert.equal(classifyBranchTarget({ id: "basin", endpoint: true }, false), "endpoint");
  assert.throws(
    () => classifyBranchTarget({ id: "missing" }, false),
    (error) => error.code === INVARIANT_FAILURE.INVALID_EDGE && /no viable next branch/.test(error.message)
  );
});

test("declares only registered, resolvable flow routes", async () => {
  const flow = JSON.parse(await readFile(new URL("../config/access-flow.json", import.meta.url), "utf8"));
  assert.equal(validateAccessFlow(flow), flow);
  assert.deepEqual(flow.legacyStorageKeys, ["threshold.access.flow.v2"]);
  for (const route of flow.registeredRoutes) {
    const target = new URL(`..${route}`, import.meta.url);
    await import("node:fs/promises").then(({ access }) => access(target));
  }
});

test("validates authoritative state against declared causality and lineage", async () => {
  const flow = JSON.parse(await readFile(new URL("../config/access-flow.json", import.meta.url), "utf8"));
  let state = createAccessState();
  for (const stageId of ["hub", "house-garden", "herb-room", "basin"]) {
    state = completeStage(flow.stages.find((stage) => stage.id === stageId), state);
  }
  state = contribute(flow.stages.find((stage) => stage.id === "dialogue"), state);
  state = returnSeedToHub(flow.stages.find((stage) => stage.id === "hub"), state);
  assert.deepEqual(validateAuthoritativeState(flow, state), state);
  assert.throws(
    () => validateAuthoritativeState(flow, { shimmer: true }),
    (error) => error.code === INVARIANT_FAILURE.UNSUPPORTED_CLAIM
  );
  assert.throws(
    () => validateAuthoritativeState(flow, {
      completed: ["dialogue"],
      returnedSeeds: ["dialogue"],
      history: [{ type: "seed-returned", stage: "dialogue" }]
    }),
    (error) => error.code === INVARIANT_FAILURE.HISTORY_ERASURE
  );
});