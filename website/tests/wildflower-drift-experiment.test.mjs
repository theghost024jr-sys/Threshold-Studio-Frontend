import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile("website/wildflower-drift.html", "utf8");

test("keeps the star-to-card scaffold limited to one reversible Drift experiment", () => {
  assert.match(source, /const driftTarget = \{ x: 53, y: 58, radius: 12, dwellMs: 700 \}/);
  assert.match(source, /driftRelationship = Math\.max\(0, Math\.min\(1, 1 - distance \/ driftTarget\.radius\)\)/);
  assert.match(source, /driftRelationship < 0\.88/);
  assert.match(source, /window\.setTimeout\(\(\) => \{/);
  assert.match(source, /\}, driftTarget\.dwellMs\)/);
  assert.match(source, /window\.clearTimeout\(driftDwellTimer\)/);
  assert.match(source, /field\.dataset\.driftActive = "true"/);
  assert.match(source, /if \(driftActive && driftRelationship < 0\.2\)/);
  assert.match(source, /event\.key === "Escape" && driftActive/);
});

test("expands Drift from the existing card while preserving the original page underneath", () => {
  assert.match(source, /const bounds = driftCard\.getBoundingClientRect\(\)/);
  assert.match(source, /--drift-card-left/);
  assert.match(source, /\.field\[data-drift-active="true"\] \.drift-expansion/);
  assert.match(source, /width:100vw/);
  assert.match(source, /height:100svh/);
  assert.doesNotMatch(source, /window\.location\s*=/);
  assert.doesNotMatch(source, /localStorage\./);
});
