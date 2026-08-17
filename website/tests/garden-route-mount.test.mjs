import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const gardenPage = await readFile(new URL("../garden.html", import.meta.url), "utf8");

test("mounts Garden as the route's environmental organ", () => {
  assert.match(gardenPage, /<main class="garden-shell">\s*<threshold-garden[^>]*><\/threshold-garden>\s*<\/main>/);
  assert.match(gardenPage, /<script type="module" src="scripts\/garden-component\.js"><\/script>/);
  assert.match(gardenPage, /<link rel="stylesheet" href="garden\.css">/);
  assert.match(gardenPage, /<link rel="stylesheet" href="garden-theme\.css">/);
  assert.doesNotMatch(gardenPage, /What roots may branch\.|Garden field|Deeper circles remain cold/);
});