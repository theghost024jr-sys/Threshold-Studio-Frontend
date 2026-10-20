export const DIAMOND_SPIRAL_CORNERS = Object.freeze([
  Object.freeze({
    position: "nw",
    direction: "NW",
    spiral: "Circulation Spiral",
    pulse: "inner",
    gain: 1,
    channel: "wake",
    phaseOffset: 0.35,
    baseEmphasis: 1,
    selectedEmphasis: 1.18
  }),
  Object.freeze({
    position: "ne",
    direction: "NE",
    spiral: "Effort Spiral",
    pulse: "blend",
    gain: 1,
    channel: "fold",
    phaseOffset: 1.1,
    baseEmphasis: 1,
    selectedEmphasis: 1.18
  }),
  Object.freeze({
    position: "se",
    direction: "SE",
    spiral: "Receptive Spiral",
    pulse: "blend",
    gain: 0.82,
    channel: null,
    phaseOffset: 2.3,
    baseEmphasis: 0.88,
    selectedEmphasis: 0.88
  }),
  Object.freeze({
    position: "sw",
    direction: "SW",
    spiral: "Metabolic Spiral",
    pulse: "outer",
    gain: 1,
    channel: "spire",
    phaseOffset: 1.85,
    baseEmphasis: 1,
    selectedEmphasis: 1.18
  })
]);

export function diamondCornerPulse(corner, pulse) {
  if (!corner || !pulse || !Number.isFinite(pulse[corner.pulse])) {
    throw new TypeError("Diamond corner requires a finite configured pulse");
  }
  return pulse[corner.pulse] * corner.gain;
}

export function diamondCornerEmphasis(corner, selectedChannel) {
  if (!corner) {
    throw new TypeError("Diamond corner configuration is required");
  }
  return corner.channel && corner.channel === selectedChannel
    ? corner.selectedEmphasis
    : corner.baseEmphasis;
}
