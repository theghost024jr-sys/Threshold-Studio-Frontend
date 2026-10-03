import assert from "node:assert/strict";
import test from "node:test";

import { validateMazeDepth } from "../scripts/maze-depth-validator.js";

test("validates maze depth transitions and restores the prior value", async () => {
  let depth = 4;
  const engine = {
    async boot() {},
    getMazeDepth() { return depth; },
    incrementMazeDepth() { depth += 1; return depth; },
    resetMazeDepth() { depth = 0; return depth; },
    setMazeDepth(value) { depth = value; return depth; },
    navigateTo() {},
    getNode(id) { return { id }; }
  };

  const report = await validateMazeDepth(engine);

  assert.equal(report.valid, true);
  assert.equal(depth, 4);
});