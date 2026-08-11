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