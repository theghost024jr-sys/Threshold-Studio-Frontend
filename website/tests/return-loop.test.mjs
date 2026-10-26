import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("House and Garden restores the Herb Room paths and its archived exits", async () => {
  const [houseGarden, herbRoom, basin, waterfall] = await Promise.all([
    readFile(new URL("housegarden.html", root), "utf8"),
    readFile(new URL("environment/herbroom.html", root), "utf8"),
    readFile(new URL("environment/basin.html", root), "utf8"),
    readFile(new URL("environment/waterfall.html", root), "utf8")
  ]);
  assert.match(houseGarden, /href="environment\/herbroom\.html">Herb Room/);
  assert.match(houseGarden, /href="environment\/herbroom\.html">Enter Herb Room/);
  assert.match(houseGarden, /scripts\/access-flow\.js/);
  assert.match(herbRoom, /href="\/environment\/basin\.html"/);
  assert.match(herbRoom, /href="\/environment\/waterfall\.html" class="exit-south">Look South/);
  assert.match(herbRoom, /src="\/scripts\/access-flow\.js"/);
  assert.match(basin, /src="\/scripts\/access-flow\.js"/);
  assert.match(waterfall, /<title>The Drift Falls — Threshold Studio<\/title>/);
  assert.match(waterfall, /src="\/assets\/images\/Waterfall\.jpg"/);
  assert.match(waterfall, /Where the House &amp; Garden band yields to the deep Forest biome/);
  assert.match(waterfall, /href="\/environment\/herbroom\.html"/);
});

test("all contribution chambers expose a Shimmer-gated contribution control", async () => {
  for (const page of ["dialogues.html", "contact.html", "invitation.html"]) {
    const source = await readFile(new URL(page, root), "utf8");
    assert.match(source, /data-threshold-contribution/);
    assert.match(source, /scripts\/access-flow\.js/);
  }
});
