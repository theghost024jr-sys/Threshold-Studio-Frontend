import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { caveCorridorDefinition, deriveCaveCorridorState } from "../portal/src/pages/CaveCorridorState.js";

test("keeps Cave Corridor as its own House and Garden chamber with Meadow branch", async () => {
  const [component, stylesheet, topology, app] = await Promise.all([
    readFile(new URL("../portal/src/pages/CaveCorridor.jsx", import.meta.url), "utf8"),
    readFile(new URL("../portal/src/pages/CaveCorridor.css", import.meta.url), "utf8"),
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8"),
    readFile(new URL("../portal/src/App.jsx", import.meta.url), "utf8"),
  ]);
  const cave = JSON.parse(topology).places.find((place) => place.id === "cave-corridor");

  assert.match(component, /href="\/housegarden\.html">Back to House &amp; Garden/);
  assert.match(component, /<Link className="cave-nav__forward" to="\/canyon">Cross into Canyon<\/Link>/);
  assert.match(component, /<Link className="cave-nav__prototype" to="\/cave-corridor-prototype">Follow the older seam<\/Link>/);
  assert.match(component, /MEADOW_ALIGNMENT|meadowResolve|meadowResolved|meadowPresence|wildflower-drift/);
  assert.match(stylesheet, /cave-opening--meadow|cave-nav__meadow/);
  assert.match(app, /<Route path="\/cave-corridor-prototype" element={<CaveCorridorPrototype \/>} \/>/);
  assert.deepEqual(cave.connectsTo, ["house-garden", "canyon", "wildflower-drift", "cave-corridor-prototype"]);
  assert.equal(cave.returnsTo, "house-garden");
});

test("derives continuous Cave Corridor conditions from traveler progress", () => {
  assert.deepEqual(caveCorridorDefinition.zones.map((zone) => zone.id), [
    "mouth",
    "narrowing",
    "bend",
    "deep",
    "contamination",
    "reemergence",
  ]);

  const mouth = deriveCaveCorridorState(0);
  const overlap = deriveCaveCorridorState(0.22);
  const bend = deriveCaveCorridorState(0.5);
  const release = deriveCaveCorridorState(1);

  assert.equal(mouth.zone, "mouth");
  assert.equal(mouth.originVisible, true);
  assert.ok(overlap.activeZones.length > 1);
  assert.equal(bend.zone, "bend");
  assert.equal(bend.originVisible, false);
  assert.equal(release.zone, "reemergence");
  assert.equal(release.canyonVisible, true);
  assert.equal(release.camera.mode, "released");
});

test("preserves the former alignment prototype as a connected branch", async () => {
  const [prototype, stylesheet, topology, shell] = await Promise.all([
    readFile(new URL("../portal/src/pages/CaveCorridorPrototype.jsx", import.meta.url), "utf8"),
    readFile(new URL("../portal/src/pages/CaveCorridorPrototype.css", import.meta.url), "utf8"),
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8"),
    readFile(new URL("../portal/cave-corridor-prototype", import.meta.url), "utf8"),
  ]);
  const prototypeNode = JSON.parse(topology).places.find((place) => place.id === "cave-corridor-prototype");

  assert.match(prototype, /MEADOW_ALIGNMENT/);
  assert.match(prototype, /<Link className="cave-nav__forward" to="\/canyon">Enter the Canyon<\/Link>/);
  assert.match(prototype, /<Link className="cave-nav__return" to="\/cave-corridor">Return to Cave Corridor<\/Link>/);
  assert.match(stylesheet, /cave-opening--meadow/);
  assert.deepEqual(prototypeNode.connectsTo, ["cave-corridor", "house-garden", "canyon", "wildflower-drift"]);
  assert.equal(shell.trim(), "Portal route fallback.");
});
