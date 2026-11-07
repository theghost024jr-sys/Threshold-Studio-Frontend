import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  completeStage,
  contribute,
  createAccessState,
  returnSeedToHub,
  validateAccessFlow,
  validateAuthoritativeState
} from "../scripts/access-flow-model.js";
import { INVARIANT_FAILURE } from "../scripts/invariant-kernel.js";

const root = new URL("../", import.meta.url);

async function loadFlow() {
  return readFile(new URL("config/access-flow.json", root), "utf8").then(JSON.parse);
}

function stage(flow, id) {
  const found = flow.stages.find((candidate) => candidate.id === id);
  assert.ok(found, `expected declared stage ${id}`);
  return found;
}

test("[TST-093] rejects corrupted authoritative-state and route fixtures", async () => {
  const flow = await loadFlow();

  assert.throws(
    () => validateAuthoritativeState(flow, {
      completed: ["hub", "house-garden", "herb-room", "basin", "dialogue"],
      shimmer: true,
      seed: { chamber: "dialogue" },
      returnedSeeds: ["dialogue"]
    }),
    (error) => error.code === INVARIANT_FAILURE.TRUTH_CONTRADICTION
  );
  assert.throws(
    () => validateAccessFlow({
      ...flow,
      stages: [...flow.stages, { ...stage(flow, "hub") }]
    }),
    (error) => error.code === INVARIANT_FAILURE.UNSUPPORTED_CLAIM
  );
  assert.throws(
    () => validateAccessFlow({
      ...flow,
      stages: flow.stages.map((candidate) => candidate.id === "basin"
        ? { ...candidate, route: "/environment/unresolved.html" }
        : candidate)
    }),
    (error) => error.code === INVARIANT_FAILURE.INVALID_EDGE
  );
});

test("[TST-080] enforces the contribution and Seed transition matrix without mutating prior state", async () => {
  const flow = await loadFlow();
  const dialogue = stage(flow, "dialogue");
  const hub = stage(flow, "hub");
  const locked = createAccessState();
  const lockedSnapshot = structuredClone(locked);

  assert.throws(
    () => contribute(dialogue, locked),
    (error) => error.code === INVARIANT_FAILURE.UNEARNED_EFFECT
  );
  assert.deepEqual(locked, lockedSnapshot);

  let unlocked = locked;
  for (const id of ["hub", "house-garden", "herb-room", "basin"]) {
    unlocked = completeStage(stage(flow, id), unlocked);
  }
  const unlockedSnapshot = structuredClone(unlocked);
  const acquired = contribute(dialogue, unlocked);
  assert.deepEqual(unlocked, unlockedSnapshot);
  assert.deepEqual(acquired.seed, { chamber: "dialogue" });
  assert.deepEqual(contribute(dialogue, acquired), acquired);

  const returned = returnSeedToHub(hub, acquired);
  assert.equal(returned.seed, null);
  assert.deepEqual(returned.returnedSeeds, ["dialogue"]);
  assert.deepEqual(returnSeedToHub(hub, returned), returned);
});

test("[TST-079] completes the declared Hub-to-Basin-to-contribution return loop", async () => {
  const flow = await loadFlow();
  validateAccessFlow(flow);
  await Promise.all(flow.registeredRoutes.map((route) => access(new URL(route.slice(1), root))));

  const [basin, dialogues, hub] = await Promise.all([
    readFile(new URL("environment/basin.html", root), "utf8"),
    readFile(new URL("dialogues.html", root), "utf8"),
    readFile(new URL("index.html", root), "utf8")
  ]);
  assert.match(basin, /data-threshold-environment="basin"/);
  assert.match(basin, /data-threshold-sandbox="basin"/);
  assert.match(basin, /aria-pressed="false"/);
  assert.match(basin, /soundToggle\.addEventListener\('click'/);
  assert.doesNotMatch(basin, /<audio|\.mp3|\.wav|autoplay/i);
  assert.match(dialogues, /data-threshold-contribution/);
  assert.match(hub, /scripts\/access-flow\.js/);

  let state = createAccessState();
  const snapshots = [structuredClone(state)];
  for (const id of ["hub", "house-garden", "herb-room", "basin"]) {
    state = completeStage(stage(flow, id), state);
    snapshots.push(structuredClone(state));
  }
  assert.equal(state.shimmer, true);

  state = contribute(stage(flow, "dialogue"), state);
  assert.deepEqual(state.seed, { chamber: "dialogue" });
  state = returnSeedToHub(stage(flow, "hub"), state);

  assert.deepEqual(state.returnedSeeds, ["dialogue"]);
  assert.deepEqual(
    state.history.map((event) => event.type),
    [
      "stage-completed",
      "stage-completed",
      "stage-completed",
      "stage-completed",
      "seed-acquired",
      "seed-returned"
    ]
  );
  assert.deepEqual(snapshots[0], createAccessState());
  assert.deepEqual(validateAuthoritativeState(flow, state), state);
});
