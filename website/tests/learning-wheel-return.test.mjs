import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("routes each Learning Wheel season to one published note and returns to the selected wheel state", async () => {
  const [wheel, state, configuration, vault] = await Promise.all([
    readFile(new URL("../learningwheel.html", import.meta.url), "utf8"),
    readFile(new URL("../scripts/learning-wheel.js", import.meta.url), "utf8"),
    readFile(new URL("../config/living-pages.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/threshold-vault.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  const portals = [
    ["spring", "Sprout Gallery", "/pages/learning-spring.html", "glyph_fog"],
    ["summer", "Shimmer Chamber", "/pages/learning-summer.html", "glyph_expand"],
    ["autumn", "Collapse Lore", "/pages/learning-autumn.html", "glyph_collapse"],
    ["winter", "Soil Archive", "/pages/learning-winter.html", "glyph_soil"]
  ];

  for (const [season, label, route, noteId] of portals) {
    assert.match(wheel, new RegExp(`<a href="${route}" data-season-portal="${season}">${label}</a>`));
    const page = configuration.pages.find((candidate) => candidate.noteId === noteId);
    assert.equal(page?.route, route);
    assert.deepEqual(page?.branches, [{ label: "Return to Learning Wheel", route: "/learningwheel.html" }]);
    assert.equal(vault.documents.find((document) => document.id === noteId)?.publish, true);
  }

  assert.match(state, /localStorage\.setItem\("threshold\.learningWheel\.state\.v1"/);
  assert.match(state, /Object\.hasOwn\(seasonProfiles, stored\?\.state\?\.season\)/);
});
