const wheelMap = {
  sprout: ["sprout", "seed", "seedling", "bloom"],
  math: ["math", "equation", "formula", "calculus", "algebra"],
  graphs: ["graph", "chart", "plot", "visualization"],
  weather: ["weather", "storm", "wind", "pressure", "front"],
  theory: ["theory", "model", "system", "principle"],
  glyphs: ["glyph", "symbol", "sigil"],
  drift: ["drift"],
  pressure: ["pressure"],
  anchor: ["anchor"],
  collapse: ["collapse"],
  navigation: ["navigation", "path", "route"],
  garden: ["garden", "sprout", "seed", "bloom", "growth"],
  fibflower: ["fib", "flower", "orbit", "node"],
  cindervox: ["cindervox"],
  porpoise: ["porpoise"],
  bluebox: ["bluebox"],
  chambers: ["chamber"],
  nodes: ["node"],
  everything: []
};

function contains(record, keywords) {
  const haystack = JSON.stringify(record).toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function buildWheelRouter(bundle) {
  if (!bundle || !Array.isArray(bundle.records)) {
    throw new Error("Wheel router requires a bundle with records");
  }

  const router = {};

  for (const [tab, keywords] of Object.entries(wheelMap)) {
    router[tab] = tab === "everything"
      ? bundle.records
      : bundle.records.filter((record) => contains(record, keywords));
  }

  return router;
}
