export const GLYPH_IDS = Object.freeze([
  "glyph_collapse",
  "glyph_expand",
  "glyph_fog",
  "glyph_soil"
]);

function pageTargetMatches(node) {
  return typeof node.html === "string" && /^\/glyphs\.html#glyph-(collapse|expand|fog|soil)$/.test(node.html);
}

export function validateGlyphRecords(nodes, graph) {
  const checks = GLYPH_IDS.map((id) => {
    const node = nodes.get(id) || null;
    const connections = graph.get(id) || [];
    return {
      id,
      loaded: Boolean(node),
      chamber: node?.type === "chamber",
      archiveConnection: Boolean(node?.connections.includes("glyph_archive")),
      graphConnection: connections.includes("glyph_archive"),
      pageTarget: pageTargetMatches(node || {})
    };
  });
  return {
    checks,
    valid: checks.every((check) => Object.values(check).every((value) => value !== false))
  };
}

function reportToConsole(report, engine) {
  console.group("Threshold Glyph Validator");
  report.checks.forEach((check) => {
    const failed = Object.entries(check).filter(([key, value]) => key !== "id" && value === false).map(([key]) => key);
    if (failed.length) {
      console.error(`${check.id}: failed ${failed.join(", ")}`);
    } else {
      console.log(`${check.id}: loaded, connected, and activatable`);
    }
  });
  console.log(`Season: ${engine.getSeason ? engine.getSeason() : "unavailable"}`);
  console.log("Glyph chambers are outside the House & Garden persisted seasonal runtime set.");
  console.groupEnd();
}

export async function validateGlyphs(engine = window.threshold) {
  if (!engine) {
    throw new Error("Threshold engine is unavailable");
  }
  await engine.boot();
  const nodes = new Map(engine.nodeRegistry.list().map((node) => [node.id, node]));
  const report = validateGlyphRecords(nodes, engine.nodeGraph);
  reportToConsole(report, engine);
  return report;
}

if (typeof window !== "undefined") {
  window.validateGlyphs = validateGlyphs;
}