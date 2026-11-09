import { describe, expect, it } from "vitest";
import { caveCorridorManifest } from "../portal/src/pages/cave-corridor.manifest.js";

describe("Cave Corridor manifest contract", () => {
  it("declares one House & Garden chamber with a Canyon boundary", () => {
    expect(caveCorridorManifest.id).toBe("cave-corridor");
    expect(caveCorridorManifest.kind).toBe("chamber");
    expect(caveCorridorManifest.flower).toBe("house-garden");
    expect(caveCorridorManifest.boundaries).toEqual({
      origin: { id: "house-garden", route: "/housegarden.html" },
      destination: { id: "canyon", route: "/canyon" },
    });
  });

  it("keeps six ordered stages internal to continuous progression", () => {
    expect(caveCorridorManifest.progression.mode).toBe("continuous");
    expect(caveCorridorManifest.progression.stageCount).toBe(6);
    expect(caveCorridorManifest.progression.stages).toEqual([
      { id: "stage-1", order: 1 },
      { id: "stage-2", order: 2 },
      { id: "stage-3", order: 3 },
      { id: "stage-4", order: 4 },
      { id: "stage-5", order: 5 },
      { id: "stage-6", order: 6 },
    ]);
    expect(caveCorridorManifest.topology.stagesAreInternal).toBe(true);
  });

  it("declares no current branches and excludes Herb Room and Wildflower", () => {
    expect(caveCorridorManifest.topology.branches).toEqual([]);
    expect(caveCorridorManifest.topology.excludedBranches).toEqual([
      "herb-room",
      "wildflower-drift",
      "meadow",
    ]);
  });

  it("defers future branch and chamber systems", () => {
    expect(caveCorridorManifest.deferred).toEqual({
      evidenceDerivedBranches: true,
      secondLayerChambers: true,
      diamondFibRelationships: true,
      chamberShift: true,
      return: true,
    });
  });
});
