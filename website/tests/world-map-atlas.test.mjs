import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Law: if there is a declared place, it is on the World Map.
// For now the map is the maker's atlas; it may be hidden later, but while it
// exists it must agree with the canonical node registry.
test("the World Map atlas lists every declared topology place", async () => {
  const [topology, map] = await Promise.all([
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../world-map.html", import.meta.url), "utf8"),
  ]);

  const hrefs = new Set(
    [...map.matchAll(/class="world-map-node[^"]*" href="([^"]+)"/g)].map(([, href]) => {
      const normalized = href.startsWith("/") ? href : `/${href}`;
      return normalized.split(/[?#]/)[0];
    })
  );

  const missing = topology.places
    .filter((place) => place.id !== "world-map")
    .filter((place) => !hrefs.has(place.route));

  assert.deepEqual(
    missing.map((place) => `${place.id} -> ${place.route}`),
    [],
    "every declared place must appear on the World Map atlas"
  );
});
