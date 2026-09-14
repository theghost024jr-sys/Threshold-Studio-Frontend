import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const basinUrl = new URL("../environment/basin.html", import.meta.url);

test("Basin uses a user-initiated procedural bamboo fountain", async () => {
  const source = await readFile(basinUrl, "utf8");
  assert.match(source, /data-threshold-environment="basin"/);
  assert.match(source, /data-origin-chamber="herbroom"/);
  assert.match(source, /class="basin-world" src="\/assets\/basin\.png"/);
  assert.match(source, /Continue into Threshold/);
  assert.doesNotMatch(source, /class="(?:canopy|banks|ford)"/);
  assert.match(source, /@keyframes basin-breathe/);
  assert.match(source, /@keyframes basin-light/);
  assert.match(source, /@keyframes basin-water/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /class="sound-toggle"/);
  assert.match(source, /aria-pressed="false"/);
  assert.match(source, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(source, /createWaterSource/);
  assert.match(source, /strikeBamboo/);
  assert.match(source, /scheduleBamboo/);
  assert.match(source, /soundToggle\.addEventListener\('click'/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /pagehide/);
  assert.doesNotMatch(source, /connectWind|<audio|\.mp3|\.wav|autoplay/i);
});