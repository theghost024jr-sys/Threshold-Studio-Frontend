import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { topologyById } from "../scripts/world-topology-contract.js";

test("connects Spiral Reflection to the world without a Portal dependency", async () => {
  const [html, map, topology] = await Promise.all([
    readFile(new URL("../spiral-reflection.html", import.meta.url), "utf8"),
    readFile(new URL("../world-map.html", import.meta.url), "utf8"),
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  const places = topologyById(topology);
  const spiral = places.get("spiral-reflection");
  assert.equal(spiral.route, "/spiral-reflection.html");
  assert.equal(spiral.containedBy, "world-map");
  assert.equal(spiral.returnsTo, "world-map");
  assert.deepEqual(spiral.connectsTo, ["world-map"]);
  assert.ok(places.get("world-map").connectsTo.includes(spiral.id));
  assert.match(map, /href="spiral-reflection\.html"/);
  assert.match(html, /href="\/world-map\.html"/);
  assert.match(html, /<h1 id="spiral-title">Spiral Reflection<\/h1>/);
  assert.match(html, /We do not want to be gods\./);
  assert.doesNotMatch(html, /<script\b|\/portal\/assets\//);
});

test("presents the preserved image uncropped with accessible context and a full-size link", async () => {
  const html = await readFile(new URL("../spiral-reflection.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles/spiral-reflection.css", import.meta.url), "utf8");
  const image = await readFile(new URL("../assets/glyphs/symbolic-glyph-spiral.png", import.meta.url));
  assert.match(html, /href="\/styles\/spiral-reflection\.css"/);
  assert.match(html, /src="\/assets\/glyphs\/symbolic-glyph-spiral\.png"/);
  assert.match(html, /href="\/assets\/glyphs\/symbolic-glyph-spiral\.png"/);
  assert.match(html, /alt="Hand-lettered words[^"]+Some lettering is distorted\."/);
  assert.match(html, /aria-describedby="spiral-caption"/);
  assert.match(html, /width="1024"\s+height="1024"/);
  assert.match(css, /\.spiral-image img\s*\{[^}]*width: 100%;[^}]*height: auto;/);
  assert.doesNotMatch(css, /object-fit:\s*cover|animation:|@keyframes/);
  assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(image.readUInt32BE(16), 1024);
  assert.equal(image.readUInt32BE(20), 1024);
  assert.equal(createHash("sha256").update(image).digest("hex"), "bba18f65e5c93457d3839b2d8dc53d407f5b120cfc00ebbf3000961ec1b3b645");
});
