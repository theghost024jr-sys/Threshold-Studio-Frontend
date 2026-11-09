import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  caveCorridorDefinition,
  deriveCaveCorridorState,
} from "../portal/src/pages/CaveCorridorState.js";

const expectedZones = [
  "mouth",
  "narrowing",
  "bend",
  "deep",
  "contamination",
  "reemergence",
];

async function loadChamberSources() {
  const [componentSource, topologySource] = await Promise.all([
    readFile(new URL("../portal/src/pages/CaveCorridor.jsx", import.meta.url), "utf8"),
    readFile(new URL("../config/world-topology.json", import.meta.url), "utf8"),
  ]);
  const topology = JSON.parse(topologySource);
  return {
    componentSource,
    cave: topology.places.find((place) => place.id === "cave-corridor"),
  };
}

describe("Cave Corridor chamber contract", () => {
  describe("topology", () => {
    it("begins at House & Garden and terminates at the Canyon boundary", async () => {
      const { cave } = await loadChamberSources();

      expect(cave.containedBy).toBe("house-garden");
      expect(cave.returnsTo).toBe("house-garden");
      expect(cave.connectsTo).toContain("house-garden");
      expect(cave.connectsTo).toContain("canyon");
    });

    it("does not route through Herb Room", async () => {
      const { componentSource, cave } = await loadChamberSources();

      expect(cave.connectsTo).not.toContain("herb-room");
      expect(componentSource).not.toContain("herb-room");
      expect(componentSource).not.toContain("herbroom");
    });

    it("does not expose Wildflower Drift in topology", async () => {
      const { cave } = await loadChamberSources();

      expect(cave.connectsTo).not.toContain("wildflower-drift");
    });

    it("does not expose a Wildflower or Meadow branch in the chamber", async () => {
      const { componentSource } = await loadChamberSources();

      expect(componentSource).not.toMatch(/wildflower|meadow/i);
    });
  });

  describe("internal progression", () => {
    it("contains exactly six established internal conditions", () => {
      expect(caveCorridorDefinition.zones.map((zone) => zone.id)).toEqual(expectedZones);
    });

    it("keeps all six conditions inside one continuous chamber", () => {
      const samples = Array.from({ length: 101 }, (_, index) => (
        deriveCaveCorridorState(index / 100)
      ));

      expect(samples.map((state) => state.progress)).toEqual(
        Array.from({ length: 101 }, (_, index) => index / 100)
      );
      expect(new Set(samples.map((state) => state.zone))).toEqual(new Set(expectedZones));
      expect(samples.some((state) => state.activeZones.length > 1)).toBe(true);
    });

    it("does not model stages as route transitions", () => {
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        const state = deriveCaveCorridorState(progress);

        expect(state).not.toHaveProperty("route");
        expect(state).not.toHaveProperty("destination");
        expect(state).not.toHaveProperty("branch");
      }
    });
  });

  describe("boundary activation", () => {
    it("does not reveal Canyon at the House & Garden side", () => {
      expect(deriveCaveCorridorState(0).canyonVisible).toBe(false);
    });

    it("reveals Canyon at the released forward condition", () => {
      const release = deriveCaveCorridorState(1);

      expect(release.zone).toBe("reemergence");
      expect(release.canyonVisible).toBe(true);
    });
  });
});
