import assert from "node:assert/strict";
import test from "node:test";

import { validateGlyphRecords } from "../scripts/glyph-validator.js";

test("validates generated glyph chambers and their archive graph edges", () => {
  const ids = ["glyph_collapse", "glyph_expand", "glyph_fog", "glyph_soil"];
  const nodes = new Map(ids.map((id) => [id, {
    id,
    type: "chamber",
    connections: ["glyph_archive"],
    html: `/glyphs.html#${id.replace("glyph_", "glyph-")}`
  }]));
  const graph = new Map(ids.map((id) => [id, ["glyph_archive"]]));

  const report = validateGlyphRecords(nodes, graph);

  assert.equal(report.valid, true);
  assert.equal(report.checks.length, 4);
});