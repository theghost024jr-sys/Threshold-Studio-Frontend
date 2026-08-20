import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hubPage = await readFile(new URL("../hub.html", import.meta.url), "utf8");

test("mounts the Hub organ as the route's primary content", () => {
  assert.match(hubPage, /<main class="shell hub-shell">\s*<threshold-hub[^>]*><\/threshold-hub>\s*<\/main>/);
  assert.match(hubPage, /<script type="module" src="scripts\/hub-component\.js"><\/script>/);
  assert.match(hubPage, /<link rel="stylesheet" href="styles\/hub\.css">/);
  assert.match(hubPage, /<link rel="stylesheet" href="styles\/hub-theme\.css">/);
  assert.doesNotMatch(hubPage, /The hub holds\.|Hub field|Cross into the garden/);
});