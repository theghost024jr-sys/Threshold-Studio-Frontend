const SEASONS = Object.freeze({
  spring: {
    atmosphere: "rain",
    mood: "emergent",
    weather: "drizzle",
    background: "#13251d",
    accent: "#8be4b2",
    ambient: "rgba(139, 228, 178, 0.18)"
  },
  summer: {
    atmosphere: "mist",
    mood: "quiet",
    weather: "fog",
    background: "#18251f",
    accent: "#d8c98d",
    ambient: "rgba(216, 201, 141, 0.16)"
  },
  autumn: {
    atmosphere: "wind",
    mood: "reflective",
    weather: "leaves",
    background: "#281b17",
    accent: "#d59a67",
    ambient: "rgba(213, 154, 103, 0.18)"
  },
  winter: {
    atmosphere: "stillness",
    mood: "dormant",
    weather: "frost",
    background: "#111b22",
    accent: "#a9cfda",
    ambient: "rgba(169, 207, 218, 0.16)"
  }
});

export function deriveHouseGardenProfile(detail = {}) {
  const season = Object.hasOwn(SEASONS, detail.season) ? detail.season : "summer";
  const base = SEASONS[season];
  return {
    ...base,
    season,
    pulseDepth: detail.pulseDepth || "soft",
    direction: detail.direction || "threshold",
    shimmer: Boolean(detail.shimmer),
    tension: Number(detail.tension || 0),
    anchorDepth: Number(detail.anchorDepth || 0),
    motion: Number(detail.motion || 0),
    spiritProximity: Number(detail.spiritProximity || 0)
  };
}