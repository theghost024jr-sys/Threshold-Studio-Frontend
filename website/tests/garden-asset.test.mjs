import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const websiteDirectory = new URL("../", import.meta.url);
const rasterHashes = new Map([
  [128, "a0ebef012607a8e188f4b0bd04eb23e433e57e626fafd5f984d0f57ba38ea7ab"],
  [240, "1294e4fd3a67d131e89e138b356da0f30b368785d965dd81703c37c32bbf6a1f"],
  [512, "23ba0d36a03a9f589284763c63372a41e84f6c8c6cedf5b70bb9d15037c5abfd"]
]);

test("ships the static and animated 13-petal Garden glyph", async () => {
  const [staticSvg, animatedSvg, stateText] = await Promise.all([
    readFile(new URL("assets/garden/garden.svg", websiteDirectory), "utf8"),
    readFile(new URL("assets/garden/animated-garden.svg", websiteDirectory), "utf8"),
    readFile(new URL("runtime/garden/garden-runtime-state.json", websiteDirectory), "utf8")
  ]);
  const state = JSON.parse(stateText);
  assert.match(staticSvg, /viewBox="0 0 512 512"/);
  assert.equal((animatedSvg.match(/<ellipse /g) || []).length, 13);
  for (const id of [
    "garden-growth-core", "garden-adjacency-ring", "garden-drift-arcs", "garden-pressure-ring",
    "garden-biome-petals", "garden-signal-halo"
  ]) {
    assert.ok(animatedSvg.includes(`id="${id}"`), `missing animated layer ${id}`);
  }
  assert.match(animatedSvg, /prefers-reduced-motion: reduce/);
  assert.equal(createHash("sha256").update(staticSvg).digest("hex"), "4cd94217394dd6ec09b1f644091823e5664cbc1d5e666b7b15533bfb5185698e");
  assert.equal(createHash("sha256").update(animatedSvg).digest("hex"), "5b5f074fe1e5e5d4773c5cc634d2cb20640e72e9e7df09ac46a32914ac863a63");
  assert.equal(state.visual.asset, "garden/animated-garden.svg");
  assert.equal(state.visual.assetExists, true);
  assert.equal(state.diagnostics.outerRingPetals, 13);
});

test("ships byte-stable Garden raster exports at every declared size", async () => {
  for (const [size, expectedHash] of rasterHashes) {
    const png = await readFile(new URL(`assets/garden/garden-${size}.png`, websiteDirectory));
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.equal(createHash("sha256").update(png).digest("hex"), expectedHash);
  }
});