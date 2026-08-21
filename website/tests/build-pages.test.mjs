import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGalleryHtml,
  extractReferencedEntities,
  normalizeEntityName
} from "../../scripts/build-pages.mjs";

test("extracts configured entity references once in keyword order", () => {
  const entities = extractReferencedEntities(
    "A hermit snail drifts past another Hermit Snail and a Spiral Snail."
  );

  assert.deepEqual(entities, ["Snail", "Hermit Snail", "Spiral Snail"]);
});

test("normalizes entity names to PNG basenames", () => {
  assert.equal(normalizeEntityName("Treeform Species"), "TreeformSpecies");
});

test("renders an accessible gallery only for multiple images", () => {
  assert.equal(buildGalleryHtml([{ name: "Deer", url: "/assets/Deer.png" }]), "");

  const html = buildGalleryHtml([
    { name: "Deer", url: "/assets/Deer.png" },
    { name: 'Owl & "Moon"', url: "/assets/Owl.png" }
  ]);

  assert.match(html, /^<div class="gallery">/);
  assert.equal((html.match(/class="gallery-image"/g) || []).length, 2);
  assert.match(html, /alt="Owl &amp; &quot;Moon&quot;"/);
});