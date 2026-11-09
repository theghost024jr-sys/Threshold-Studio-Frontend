export const caveCorridorManifest = Object.freeze({
  id: "cave-corridor",
  kind: "chamber",
  flower: "house-garden",
  boundaries: Object.freeze({
    origin: Object.freeze({
      id: "house-garden",
      route: "/housegarden.html",
    }),
    destination: Object.freeze({
      id: "canyon",
      route: "/canyon",
    }),
  }),
  progression: Object.freeze({
    mode: "continuous",
    stageCount: 6,
    stages: Object.freeze([
      Object.freeze({ id: "stage-1", order: 1 }),
      Object.freeze({ id: "stage-2", order: 2 }),
      Object.freeze({ id: "stage-3", order: 3 }),
      Object.freeze({ id: "stage-4", order: 4 }),
      Object.freeze({ id: "stage-5", order: 5 }),
      Object.freeze({ id: "stage-6", order: 6 }),
    ]),
  }),
  topology: Object.freeze({
    stagesAreInternal: true,
    branches: Object.freeze([]),
    excludedBranches: Object.freeze([
      "herb-room",
      "wildflower-drift",
      "meadow",
    ]),
  }),
  deferred: Object.freeze({
    evidenceDerivedBranches: true,
    secondLayerChambers: true,
    diamondFibRelationships: true,
    chamberShift: true,
    return: true,
  }),
});
