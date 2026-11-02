import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  GARDEN_EVIDENCE_STORAGE_KEY,
  REMEMBERED_ATTENTION_SECONDS,
  gardenRepresentation,
  readGardenObservation,
  recordGardenAttention,
  recordGardenSeen
} from "../scripts/garden-evidence-state.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

test("keeps the Garden conceptual until Herb Room observation supplies evidence", () => {
  const storage = createStorage();

  assert.deepEqual(readGardenObservation(storage), { seen: false, attentionSeconds: 0 });
  assert.equal(gardenRepresentation(readGardenObservation(storage)), "idea");

  recordGardenSeen(storage);
  assert.equal(gardenRepresentation(readGardenObservation(storage)), "seen");

  recordGardenAttention(storage, REMEMBERED_ATTENTION_SECONDS);
  assert.equal(gardenRepresentation(readGardenObservation(storage)), "remembered");
  assert.ok(storage.getItem(GARDEN_EVIDENCE_STORAGE_KEY));
});

test("rejects malformed or fabricated attention evidence", () => {
  const storage = createStorage();

  assert.throws(() => recordGardenAttention(storage, -1), RangeError);
  storage.setItem(GARDEN_EVIDENCE_STORAGE_KEY, "not-json");
  assert.throws(() => readGardenObservation(storage), /unreadable/);
});

test("keeps the Garden representation evidence-bound and route-free", async () => {
  const [garden, herbRoom, presentation] = await Promise.all([
    readFile(new URL("../garden.html", import.meta.url), "utf8"),
    readFile(new URL("../environment/herbroom.html", import.meta.url), "utf8"),
    readFile(new URL("../scripts/garden-evidence.js", import.meta.url), "utf8")
  ]);

  assert.match(garden, /styles\/garden-evidence\.css/);
  assert.match(garden, /data-garden-evidence-status/);
  assert.match(garden, /garden-memory-projection/);
  assert.match(garden, /scripts\/garden-evidence\.js/);
  assert.match(herbRoom, /recordGardenSeen/);
  assert.match(herbRoom, /recordGardenAttention/);
  assert.match(herbRoom, /function beginGardenObservation/);
  assert.match(herbRoom, /function endGardenObservation/);
  assert.match(presentation, /gardenRepresentation/);
  assert.doesNotMatch(garden, /Enter Garden|Step through/i);
});
