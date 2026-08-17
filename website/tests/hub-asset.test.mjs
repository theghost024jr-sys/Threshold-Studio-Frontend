import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const websiteDirectory = new URL("../", import.meta.url);
const animatedHash = "24586e26a1c9bd5bc436b6e77c07b24fa2ea8cb3584ba751710d5bcd547108dd";
const rasterHashes = new Map([
  [128, "4c8a308f3c939825f3d4a559a73752f5d6126c9eb17b53d8bb126ffdc00b9cfc"],
  [240, "24d5055aa4303767fc805479344a24196fceb87e4127def12a409cf85279da49"],
  [512, "faf9405be4fe2767c0dbac6e63c418bccbf034a2b5979f935f10494dc5714d66"]
]);

test("ships and activates the five-layer Hub vector blueprint", async () => {
  const [svg, animatedSvg, stateText, themeCss] = await Promise.all([
    readFile(new URL("assets/hub/hub.svg", websiteDirectory), "utf8"),
    readFile(new URL("assets/hub/animated-hub.svg", websiteDirectory), "utf8"),
    readFile(new URL("runtime/hub/hub-runtime-state.json", websiteDirectory), "utf8"),
    readFile(new URL("hub-theme.css", websiteDirectory), "utf8")
  ]);
  const state = JSON.parse(stateText);

  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.match(svg, /cx="256" cy="256" r="60"/);
  assert.equal((svg.match(/A140 140/g) || []).length, 3);
  assert.equal((svg.match(/A160 160/g) || []).length, 7);
  assert.match(svg, /r="200"[\s\S]*stroke-width="24"/);
  assert.match(svg, /r="240"[\s\S]*opacity="0\.10"/);

  for (const color of Object.values(state.biome.palette)) {
    assert.ok(svg.includes(`stroke="${color}"`), `missing biome stroke ${color}`);
  }

  for (const id of ["hub-core", "hub-cycle-ring", "hub-biome-ring", "hub-chamber-ring", "hub-halo"]) {
    assert.ok(animatedSvg.includes(`id="${id}"`), `missing animated layer ${id}`);
  }
  assert.match(animatedSvg, /animation: hub-cycle-rotate 6s linear infinite/);
  assert.match(animatedSvg, /animation: hub-halo-flicker 2\.4s ease-in-out infinite/);
  assert.match(animatedSvg, /prefers-reduced-motion: reduce/);
  assert.equal(createHash("sha256").update(animatedSvg).digest("hex"), animatedHash);

  assert.match(themeCss, /cycle-early[\s\S]*animation-duration: 6s/);
  assert.match(themeCss, /cycle-mid[\s\S]*animation-duration: 4s/);
  assert.match(themeCss, /cycle-late[\s\S]*animation-duration: 2s/);

  assert.equal(state.visual.asset, "hub/animated-hub.svg");
  assert.equal(state.visual.assetExists, true);
  assert.deepEqual(state.diagnostics.assetMissing, []);
});

test("ships byte-stable Hub raster exports at every declared size", async () => {
  for (const [size, expectedHash] of rasterHashes) {
    const png = await readFile(new URL(`assets/hub/hub-${size}.png`, websiteDirectory));

    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.equal(createHash("sha256").update(png).digest("hex"), expectedHash);
  }
});