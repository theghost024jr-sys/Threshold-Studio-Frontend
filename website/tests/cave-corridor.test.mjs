import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { caveCorridorDefinition, deriveCaveCorridorState } from "../portal/src/pages/CaveCorridorState.js";

test("keeps Cave Corridor as its own House and Garden chamber with a Crystal Verge exit", async () => {
  const [component, stylesheet, app] = await Promise.all([
    readFile(new URL("../portal/src/pages/CaveCorridor.jsx", import.meta.url), "utf8"),
    readFile(new URL("../portal/src/pages/CaveCorridor.css", import.meta.url), "utf8"),
    readFile(new URL("../portal/src/App.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(component, /href="\/housegarden\.html">Back to House &amp; Garden/);
  assert.doesNotMatch(component, /navigate\('\/canyon'\)|to="\/canyon"/);
  assert.match(component, /<Link className="cave-nav__prototype" to="\/cave-corridor-prototype">Enter Crystal Verge<\/Link>/);
  assert.match(app, /<Route path="\/cave-corridor-prototype" element={<CrystalVerge \/>} \/>/);
  assert.doesNotMatch(stylesheet, /cave-nav__forward/);
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
  assert.equal(Object.hasOwn(release, "canyonVisible"), false);
  assert.equal(release.camera.mode, "released");
  assert.equal(release.camera.fov, 75);
  assert.equal(release.attraction, "canyon-opening");
  assert.equal(mouth.camera.fov, 68);
  assert.equal(mouth.attraction, "none");
});

test("preserves the former alignment prototype as a connected branch", async () => {
  const [prototype, stylesheet] = await Promise.all([
    readFile(new URL("../portal/src/pages/CaveCorridorPrototype.jsx", import.meta.url), "utf8"),
    readFile(new URL("../portal/src/pages/CaveCorridorPrototype.css", import.meta.url), "utf8"),
  ]);

  assert.match(prototype, /MEADOW_ALIGNMENT/);
  assert.match(prototype, /<Link className="cave-nav__forward" to="\/canyon">Enter the Canyon<\/Link>/);
  assert.match(prototype, /<Link className="cave-nav__return" to="\/cave-corridor">Return to Cave Corridor<\/Link>/);
  assert.match(stylesheet, /cave-opening--meadow/);
});
