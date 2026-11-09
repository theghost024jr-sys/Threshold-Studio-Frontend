import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  bendSeveranceGeometry,
  corridorSampleAtDistance,
  getHouseGardenBearing,
  lookDirectionAtAngle,
  observeBendSeverance,
  travelerPositionAtProgress,
} from "../portal/src/pages/CaveCorridorGeometry.js";

function observeFacingHouseGarden(progress) {
  const position = travelerPositionAtProgress(progress);
  return observeBendSeverance({
    position,
    lookDirection: lookDirectionAtAngle(getHouseGardenBearing(position)),
  });
}

describe("Cave Corridor Bend severance", () => {
  it("samples the specified continuous Mouth, Narrowing, and Bend profile", () => {
    const { segments, totalLength, eyeHeight } = bendSeveranceGeometry;

    expect(totalLength).toBeCloseTo(30.712);
    expect(segments.mouth).toMatchObject({ start: 0, end: 6, width: 2.4, height: 3 });
    expect(segments.bend).toMatchObject({ start: 14, end: 18.712, radius: 3, widthStart: 1.5, widthEnd: 1.6, height: 2.2 });
    expect(corridorSampleAtDistance(14).heading).toEqual({ x: 0, z: 1 });
    expect(corridorSampleAtDistance(18.712).heading.x).toBeCloseTo(1);
    expect(eyeHeight).toBeLessThan(segments.bend.height);
  });

  it("uses physical Bend wall intersections and renders their aperture without opacity", async () => {
    const [componentSource, stylesheet, viewportSource] = await Promise.all([
      readFile(new URL("../portal/src/pages/CaveCorridor.jsx", import.meta.url), "utf8"),
      readFile(new URL("../portal/src/pages/CaveCorridor.css", import.meta.url), "utf8"),
      readFile(new URL("../portal/src/pages/CaveCorridorViewport.jsx", import.meta.url), "utf8"),
    ]);
    const source = observeBendSeverance.toString();

    expect(source).toContain("segmentsIntersect");
    expect(componentSource).toContain("observeBendSeverance");
    expect(componentSource).not.toContain("--origin-visibility");
    expect(componentSource).toContain("CaveCorridorViewport");
    expect(viewportSource).toContain("bendSeveranceGeometry");
    expect(viewportSource).toContain("corridorSamples");
    expect(viewportSource).toContain("new THREE.BufferGeometry");
    expect(viewportSource).not.toContain("scene.fog");
    expect(stylesheet).toContain(".cave-viewport");
    expect(stylesheet).not.toContain("opacity: var(--origin-visibility)");
  });

  it("makes House & Garden disappear continuously along the outbound sightline", () => {
    expect(observeFacingHouseGarden(0.1).visibility).toBe("visible");
    expect(observeFacingHouseGarden(0.53).visibility).toBe("partial");
    expect(observeFacingHouseGarden(0.537).visibility).toBe("sliver");
    expect(observeFacingHouseGarden(0.54).visibility).toBe("gone");
  });

  it("restores the same sightline in reverse without teleporting the traveler", () => {
    const outbound = [0.1, 0.53, 0.537, 0.54].map(observeFacingHouseGarden);
    const returning = [0.54, 0.537, 0.53, 0.1].map(observeFacingHouseGarden);

    expect(outbound.map((observation) => observation.visibility)).toEqual([
      "visible",
      "partial",
      "sliver",
      "gone",
    ]);
    expect(returning.map((observation) => observation.visibility)).toEqual([
      "gone",
      "sliver",
      "partial",
      "visible",
    ]);
    const severancePosition = travelerPositionAtProgress(0.54);
    expect(severancePosition.x).toBeCloseTo(travelerPositionAtProgress(0.54).x);
    expect(severancePosition.z).toBeCloseTo(travelerPositionAtProgress(0.54).z);
  });

  it("does not grant atmospheric state, camera guidance, or progress metadata severance authority", () => {
    const position = travelerPositionAtProgress(0.45);
    const lookDirection = lookDirectionAtAngle(getHouseGardenBearing(position));
    const base = observeBendSeverance({ position, lookDirection });
    const unrelatedMetadata = observeBendSeverance({
      position,
      lookDirection,
      originVisibility: 0,
      cameraConstraint: 1,
      progress: 1,
    });

    expect(base.entranceCenterVisible).toBe(true);
    expect(base).toEqual(unrelatedMetadata);
  });

  it("uses a floor-to-ceiling Bend wall that spans the entrance opening", () => {
    const { entrance, segments: { bend } } = bendSeveranceGeometry;

    expect(bend.base).toBeLessThanOrEqual(entrance.base);
    expect(bend.base + bend.height).toBeGreaterThanOrEqual(bendSeveranceGeometry.eyeHeight);
  });
});
