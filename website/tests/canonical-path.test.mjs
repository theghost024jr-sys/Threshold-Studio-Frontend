import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeFiles = [
  "../index.html",
  "../housegarden.html",
  "../environment/herbroom.html",
  "../environment/basin.html",
  "../environment/old-forest.html"
];

test("connects the canonical five-minute path through existing Threshold territory", async () => {
  const [pathLayer, topology, accessFlow, ...pages] = await Promise.all([
    readFile(new URL("../scripts/canonical-path.js", import.meta.url), "utf8"),
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../scripts/access-flow.js", import.meta.url), "utf8"),
    ...routeFiles.map((route) => readFile(new URL(route, import.meta.url), "utf8"))
  ]);

  assert.deepEqual(topology.canonicalEntryPath, [
    "entry-hub",
    "house-garden",
    "herb-room",
    "basin",
    "old-forest"
  ]);
  assert.match(pathLayer, /fetch\(TOPOLOGY_URL/);
  assert.match(pathLayer, /place\.connectsTo\.includes\(nextPlace\.id\)/);
  assert.match(pathLayer, /sessionStorage/);
  assert.match(pathLayer, /released: true/);
  assert.match(pathLayer, /guidanceDismissed: true/);
  assert.match(pathLayer, /bindAlternateRouteChoice\(nextPlace\.route\)/);
  assert.match(pathLayer, /Sound begins here\./);
  assert.doesNotMatch(pathLayer, /setTimeout\(|setInterval\(/);
  assert.doesNotMatch(pathLayer, /autoplay|\.play\(/);
  assert.doesNotMatch(accessFlow, /threshold-access-gate|renderGate/);

  for (const page of pages) {
    assert.match(page, /scripts\/canonical-path\.js/);
  }
  assert.match(pages[0], /href="housegarden\.html">House and Garden/);
  assert.match(pages[1], /href="environment\/herbroom\.html">Herb Room/);
  assert.match(pages[2], /href="\/environment\/basin\.html"/);
  assert.match(pages[2], /eastCue\.addEventListener\('focus'/);
  assert.match(pages[2], /\.east-threshold:focus-within/);
  assert.doesNotMatch(pages[2], /tabindex="-1"/);
  assert.match(pages[3], /href="\/environment\/old-forest\.html"/);
  assert.match(pages[3], /Basin environmental sound is unavailable\./);
  assert.match(pages[3], /Sound unavailable/);
  assert.match(pages[3], /the Basin remains open/);
  assert.match(pages[4], /href="\/environment\/basin\.html">Return to the Basin/);
});
