import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtimeDirectory = new URL("../runtime/hub/", import.meta.url);

async function readJson(name) {
  return JSON.parse(await readFile(new URL(name, runtimeDirectory), "utf8"));
}

function validateNoOpChanges(changes, source, path = []) {
  for (const [key, value] of Object.entries(changes)) {
    const nextPath = [...path, key];
    if (value && Object.hasOwn(value, "old") && Object.hasOwn(value, "new")) {
      assert.deepEqual(value.old, value.new, `${nextPath.join(".")} is not a no-op`);
      assert.deepEqual(value.new, source?.[key], `${nextPath.join(".")} differs from runtime state`);
      continue;
    }
    validateNoOpChanges(value, source?.[key], nextPath);
  }
}

test("declares a source-aligned no-op Hub runtime delta", async () => {
  const [delta, state] = await Promise.all([
    readJson("hub-runtime-delta.json"),
    readJson("hub-runtime-state.json")
  ]);

  assert.equal(delta.source, "hub-runtime-state.json");
  assert.equal(delta.mode, "engine-tick");
  assert.equal(delta.diagnostics.deltaApplied, true);
  assert.equal(delta.diagnostics.noChangesDetected, true);
  validateNoOpChanges(delta.changes, state);
});