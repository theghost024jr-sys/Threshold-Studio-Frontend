import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import vault from "../data/threshold-vault.json" with { type: "json" };
import {
  createDeterministicPlacement,
  createNodeFieldLayout,
  projectDepth
} from "../scripts/node-field-placement.js";

test("keeps the isolated node placement baseline deterministic and neutral", () => {
  const herb = createDeterministicPlacement("herb_room");
  const basin = createDeterministicPlacement("basin");
  const nodes = [{ id: "basin" }, { id: "housegarden" }, { id: "herb_room" }];

  assert.deepEqual(herb, createDeterministicPlacement("herb_room"));
  assert.notDeepEqual(herb, basin);
  assert.ok(herb.x >= -0.88 && herb.x <= 0.88);
  assert.ok(herb.y >= -0.78 && herb.y <= 0.78);
  assert.ok(herb.z >= 0.12 && herb.z <= 0.92);
  assert.deepEqual(createNodeFieldLayout(nodes), createNodeFieldLayout([...nodes].reverse()));
  assert.throws(() => createDeterministicPlacement(""), /nodeId is required/);
});

test("projects placement depth into visual values only", () => {
  const near = projectDepth(0.15);
  const far = projectDepth(0.85);

  assert.ok(near.scale > far.scale);
  assert.ok(near.opacity > far.opacity);
  assert.ok(near.parallax > far.parallax);
});

test("projects every registry node into stable presentation-only coordinates", () => {
  const before = JSON.stringify(vault.nodes);
  const first = createNodeFieldLayout(vault.nodes);
  const second = createNodeFieldLayout(vault.nodes);

  assert.equal(first.length, vault.nodes.length);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(vault.nodes), before);
  assert.ok(first.every(({ x, y, z }) => Number.isFinite(x) && Number.isFinite(y) && z >= 0.12 && z <= 0.92));
});

test("ships a first-level node field without inventing interaction authority", async () => {
  const [page, script, topology] = await Promise.all([
    readFile(new URL("../node-field.html", import.meta.url), "utf8"),
    readFile(new URL("../scripts/node-field.js", import.meta.url), "utf8"),
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  await access(new URL("../styles/node-field.css", import.meta.url));

  assert.match(page, /data-node-field-nodes/);
  assert.match(page, /data-node-field-contact/);
  assert.match(page, /scripts\/node-field\.js/);
  assert.match(script, /createNodeFieldLayout/);
  assert.match(script, /applyInput\(approachedNode\.id, \{ action: "select" \}\)/);
  assert.match(script, /await engineInterface\.tick\(\)/);
  assert.match(script, /settleField/);
  assert.doesNotMatch(script, /pointermove|drawTraces|disturbField/);
  assert.doesNotMatch(script, /activateNode|localStorage|sessionStorage|updateNode|relationship|strand|braid/i);

  const nodeField = topology.places.find((place) => place.id === "node-field");
  const holding = topology.places.find((place) => place.id === "world-holding");
  assert.equal(nodeField.route, "/node-field.html");
  assert.equal(nodeField.returnsTo, "world-holding");
  assert.ok(holding.connectsTo.includes("node-field"));
});
