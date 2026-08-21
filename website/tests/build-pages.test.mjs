import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGalleryHtml,
  extractReferencedEntities,
  getEngineImageClass,
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
    { name: 'Owl & "Moon"', url: "/assets/Owl.png", imageClass: "engine-map" }
  ]);

  assert.match(html, /^<div class="gallery">/);
  assert.equal((html.match(/class="gallery-image(?: [^"]+)?"/g) || []).length, 2);
  assert.match(html, /alt="Owl &amp; &quot;Moon&quot;"/);
  assert.match(html, /class="gallery-image engine-map"/);
});

test("classifies Engine blueprint and map images", () => {
  assert.equal(
    getEngineImageClass("11 - Engine/05 - Blueprints/Drift Blueprint.md", "Drift Blueprint.png"),
    "engine-blueprint"
  );
  assert.equal(
    getEngineImageClass("11 - Engine/06 - Maps/Pressure Map.md", "Pressure Map.png"),
    "engine-map"
  );
  assert.equal(
    getEngineImageClass("04 - Organism/Map.md", "Pressure Map.png"),
    ""
  );
});