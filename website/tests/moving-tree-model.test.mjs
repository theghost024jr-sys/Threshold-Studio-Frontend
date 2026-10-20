import assert from "node:assert/strict";
import test from "node:test";
import { MovingTree } from "../moving-tree-model.js";

test("starts following and withdraws when directly asked if it is following", () => {
  const tree = new MovingTree("forest-tree");

  assert.equal(tree.snapshot().state, "Following");

  const response = tree.respondToPlayerAction({ type: "ask-if-following" });

  assert.equal(response.state, "Withdrawing");
  assert.equal(response.isFollowing, false);
  assert.equal(response.changed, true);
});

test("does not resume following without a reset", () => {
  const tree = new MovingTree("forest-tree");
  tree.respondToPlayerAction({ type: "ask-if-following" });

  const response = tree.respondToPlayerAction({ type: "ask-if-following" });

  assert.equal(response.state, "Withdrawing");
  assert.equal(response.changed, false);
});

test("rejects unsupported player actions", () => {
  const tree = new MovingTree("forest-tree");

  assert.throws(
    () => tree.respondToPlayerAction({ type: "touch-tree" }),
    /tree action.type must be "ask-if-following"/
  );
  assert.equal(tree.snapshot().state, "Following");
});

test("reset returns the moving tree to following", () => {
  const tree = new MovingTree("forest-tree");
  tree.respondToPlayerAction({ type: "ask-if-following" });

  const reset = tree.reset();

  assert.equal(reset.state, "Following");
  assert.equal(reset.isFollowing, true);
  assert.equal(reset.reset, true);
});
