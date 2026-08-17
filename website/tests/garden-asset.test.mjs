import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const websiteDirectory = new URL("../", import.meta.url);

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