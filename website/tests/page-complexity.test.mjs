import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("layers every Hub and first-circle page by declared complexity", async () => {
  const manifest = JSON.parse(await readFile(new URL("config/spokes.json", root), "utf8"));
  const pages = ["index.html", ...manifest.spokes.map((spoke) => spoke.entry), "dialogues.html"];

  for (const page of pages) {
    const html = await readFile(new URL(page, root), "utf8");
    assert.match(html, /styles\/complexity-layers\.css/, `${page} loads the shared layer contract`);
    assert.match(html, /data-complexity="[^"]*foundation[^"]*"/, `${page} declares a foundation layer`);
    assert.match(html, /data-motion="bounded"/, `${page} bounds circular motion`);
  }
});

test("restraint layer prevents circular pulse expansion", async () => {
  const css = await readFile(new URL("styles/complexity-layers.css", root), "utf8");
  assert.match(css, /data-motion="bounded"/);
  assert.match(css, /scale:\s*1\s*!important/);
  assert.doesNotMatch(css, /background:\s*(?:red|#f00|#ff0000)/i);
});

test("keeps the richest Learning Wheel above preserved versions", async () => {
  const html = await readFile(new URL("learningwheel.html", root), "utf8");
  assert.match(html, /data-season-choice="spring"/);
  assert.match(html, /data-season-choice="summer"/);
  assert.match(html, /data-season-choice="autumn"/);
  assert.match(html, /data-season-choice="winter"/);
  assert.match(html, /scripts\/learning-wheel\.js/);
  assert.doesNotMatch(html, /@keyframes\s+pulse/i);
});

test("binds the Prime Atom to the logo, Engine, reveal, and hidden door contracts", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const script = await readFile(new URL("scripts/fibonacci-entry.js", root), "utf8");

  assert.match(html, /data-prime-atom/);
  assert.match(html, /data-prime-logo/);
  assert.match(html, /data-prime-door data-door-state="sealed"/);
  assert.match(html, /data-entry-chamber/);
  assert.match(html, /data-hub-reactor/);
  assert.match(html, /hub-heartbeat-spokes/);
  assert.match(html, /data-field-frame/);
  assert.match(html, /data-reveal-box/);
  assert.equal((html.match(/entry-ring entry-ring-/g) || []).length, 2);
  assert.match(script, /threshold:hub-signal/);
  assert.match(script, /threshold:prime-atom-signal/);
  assert.match(script, /threshold:engine-response/);
  assert.match(script, /threshold:hub-response/);
  assert.match(script, /threshold:hub-activation/);
  assert.match(script, /threshold:hub-activation-command/);
  assert.match(script, /threshold:heartbeat-field/);
  assert.match(script, /threshold:engine-event/);
  assert.match(script, /advanceHubActivation/);
  assert.match(script, /dataset\.hubActivation/);
  assert.match(script, /advanceHeartbeatClock/);
  assert.match(script, /ring-descent/);
  assert.match(script, /setPrimeState\("descending"\)/);
  assert.doesNotMatch(html, /(?:engine-core-heartbeat|receptor-heartbeat|reactor-breathe|reactor-flicker)\s+\d+s/);
});

test("keeps the Hub Entry welcome human-facing", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");

  assert.match(html, /You’ve come to Threshold — where beginnings gather, paths take shape,/);
  assert.match(html, /Begin at the Hub\. Follow what draws you inward\./);
  assert.doesNotMatch(html, /tune matrix waves|hub energy|field mechanics/i);
});