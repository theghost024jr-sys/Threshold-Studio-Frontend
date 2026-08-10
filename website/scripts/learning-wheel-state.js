export const seasonProfiles = {
  spring: { label: "Spring", direction: "drift", pulseDepth: "soft", weather: "fog", turn: 0, rationale: "Learning begins in mist. The pulse is soft and diffused." },
  summer: { label: "Summer", direction: "resonance", pulseDepth: "normal", weather: "shimmer", turn: 90, rationale: "Growth arrives like tide. The pulse is bright and shimmering." },
  autumn: { label: "Autumn", direction: "collapse", pulseDepth: "deep", weather: "storm", turn: 180, rationale: "Collapse is weather. The pulse is sharp and cutting." },
  winter: { label: "Winter", direction: "anchor", pulseDepth: "deep", weather: "soil", turn: 270, rationale: "Integration is compost. The pulse is deep and grounding." }
};

export function getSeasonProfile(season = "spring") {
  return seasonProfiles[season] || seasonProfiles.spring;
}

export function getCalendarSeason(date = new Date()) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}