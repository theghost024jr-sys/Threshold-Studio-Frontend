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
    places: topology.places,
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

    it("keeps Cave and Wildflower as independent nodes without ownership semantics", async () => {
      const { cave, places } = await loadChamberSources();
      const wildflower = places.find((place) => place.id === "wildflower-drift");

      expect(cave.id).not.toBe(wildflower.id);
      expect(cave.route).not.toBe(wildflower.route);
      for (const place of places) {
        expect(place).not.toHaveProperty("owner");
        expect(place).not.toHaveProperty("owns");
        expect(place).not.toHaveProperty("ownedNodes");
      }
    });

  });

  describe("internal progression", () => {
    it("contains exactly six established internal conditions", () => {
      expect(caveCorridorDefinition.zones.map((zone) => zone.id)).toEqual(expectedZones);
    });

    it("keeps all six conditions inside one continuous chamber", () => {
      const samples = Array.from({ length: 1001 }, (_, index) => (
        deriveCaveCorridorState(index / 1000)
      ));

      expect(samples.map((state) => state.progress)).toEqual(
        Array.from({ length: 1001 }, (_, index) => index / 1000)
      );
      expect(new Set(samples.map((state) => state.zone))).toEqual(new Set(expectedZones));
      expect(samples.some((state) => state.activeZones.length > 1)).toBe(true);
      for (const state of samples) {
        expect(state.activeZones.reduce((total, zone) => total + zone.weight, 0)).toBeCloseTo(1);
      }
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
    it("crosses into Canyon through forward movement rather than entry UI", async () => {
      const { componentSource } = await loadChamberSources();

      expect(componentSource).toMatch(/if \(progress === 1\) navigate\('\/canyon'\)/);
      expect(componentSource).not.toMatch(/Cross into Canyon|cave-nav__forward/);
    });

    it("does not reveal Canyon at the House & Garden side", () => {
      expect(deriveCaveCorridorState(0)).not.toHaveProperty("canyonVisible");
    });

    it("reveals Canyon at the released forward condition", () => {
      const release = deriveCaveCorridorState(1);

      expect(release.zone).toBe("reemergence");
      expect(release.environment.exteriorVisibility).toBe(1);
      expect(release).not.toHaveProperty("canyonVisible");
    });
  });
});
