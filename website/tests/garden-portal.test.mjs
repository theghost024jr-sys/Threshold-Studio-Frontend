import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("reveals the Garden organ after five unique pollen activations", async () => {
  const [html, css, script] = await Promise.all([
    readFile(new URL("housegarden.html", root), "utf8"),
    readFile(new URL("styles/housegarden.css", root), "utf8"),
    readFile(new URL("scripts/housegarden.js", root), "utf8")
  ]);

  const pollenButtons = html.match(/<button[^>]*class="[^"]*\bpollen\b[^"]*\bclickable\b[^"]*"[^>]*>/g) || [];
  assert.equal(pollenButtons.length, 5);
  assert.match(html, /data-garden-portal[^>]*data-revealed="false"[^>]*aria-hidden="true"/);
  assert.match(html, /href="\/garden" tabindex="-1">Enter Garden Organ/);
  assert.match(css, /\.garden-portal\[data-revealed="true"\]/);
  assert.match(css, /@keyframes pollen-drift/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(script, /const activatedPollen = new Set\(\)/);
  assert.match(script, /activatedPollen\.has\(mote\)/);
  assert.match(script, /activatedPollen\.size === pollen\.length/);
  assert.match(script, /removeAttribute\("tabindex"\)/);
});