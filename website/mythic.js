const SPIRIT = {
  fog: "The Deer",
  expand: "The Whale",
  collapse: "The Wolf",
  soil: "The Bear",
  threshold: "The Witness"
};

const GUARDIAN = {
  fog: "The Whisperer",
  expand: "The Lumen Keeper",
  collapse: "The Architect of Ruin",
  soil: "The Archivist",
  threshold: "The Threshold Keeper"
};

export function createMythicModule() {
  return {
    apply(channel, selection) {
      const spiritNode = document.getElementById("spirit-animal");
      const guardianNode = document.getElementById("legacy-character");
      const spirit = selection && selection.speciesWrap && selection.speciesWrap.spirit
        ? selection.speciesWrap.spirit
        : SPIRIT[channel] || SPIRIT.threshold;
      const guardian = selection && selection.actorWrap && selection.actorWrap.guardian
        ? selection.actorWrap.guardian
        : GUARDIAN[channel] || GUARDIAN.threshold;

      if (spiritNode) {
        spiritNode.setAttribute("data-label", spirit);
        spiritNode.setAttribute("aria-label", spirit);
      }
      if (guardianNode) {
        guardianNode.setAttribute("data-label", guardian);
        guardianNode.setAttribute("aria-label", guardian);
      }
    }
  };
}