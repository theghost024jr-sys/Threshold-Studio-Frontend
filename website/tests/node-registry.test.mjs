import assert from "node:assert/strict";
import test from "node:test";

import { buildNodeGraph, createNodeRegistry, updateNodeRecord } from "../scripts/node-registry.js";

test("normalizes public Markdown node metadata for the website engine", () => {
  const registry = createNodeRegistry([{
    id: "forest",
    type: "biome",
    map: "forest.png",
    physics: { drift: 0.2 },
    weather: { channel: "fog" },
    characters: ["warden"],
    connections: [],
    html: "/environment/forest.html"
  }]);

  assert.deepEqual(registry.get("forest"), {
    id: "forest",
    type: "biome",
    map: "forest.png",
    physics: { drift: 0.2 },
    weather: { channel: "fog" },
    characters: ["warden"],
    connections: [],
    html: "/environment/forest.html"
  });
  assert.equal(registry.list("biome").length, 1);
});

test("keeps immutable node metadata while applying editor state changes", () => {
  const node = createNodeRegistry([{ id: "greenhouse", type: "biome", weather: {}, physics: {}, connections: [] }]).get("greenhouse");
  const updated = updateNodeRecord(node, {
    weather: { humidity: 0.8 },
    physics: { collapse: true },
    connections: ["lagoon"]
  });

  assert.deepEqual(updated.weather, { humidity: 0.8 });
  assert.deepEqual(updated.physics, { collapse: true });
  assert.deepEqual(updated.connections, ["lagoon"]);
  assert.deepEqual(node.connections, []);
});

test("builds a bidirectional graph from declared node connections", () => {
  const graph = buildNodeGraph([
    { id: "housegarden", type: "biome", connections: ["herb_room", "greenhouse", "lagoon", "camp"] },
    { id: "herb_room", type: "biome", connections: ["housegarden"] },
    { id: "greenhouse", type: "biome", connections: ["housegarden"] },
    { id: "lagoon", type: "biome", connections: ["housegarden"] },
    { id: "camp", type: "biome", connections: ["housegarden"] }
  ]);

  assert.deepEqual(graph.get("housegarden"), ["camp", "greenhouse", "herb_room", "lagoon"]);
  assert.deepEqual(graph.get("lagoon"), ["housegarden"]);
});