import {
  requireResolvedEdge,
  requireSupportedClaim
} from "./invariant-kernel.js";

export const WORLD_TOPOLOGY_CLASSIFICATIONS = Object.freeze(["KEEP", "CONNECT", "COMPLETE", "NEW"]);

export function topologyById(topology) {
  return new Map(topology.places.map((place) => [place.id, place]));
}

export function validateWorldTopology(topology) {
  requireSupportedClaim(
    topology && Array.isArray(topology.places) && typeof topology.entry === "string",
    "World topology must declare an entry place and places."
  );

  const places = topologyById(topology);
  requireResolvedEdge(places.has(topology.entry), "World topology entry is not declared.", {
    entry: topology.entry
  });
  requireSupportedClaim(
    Array.isArray(topology.canonicalEntryPath)
      && topology.canonicalEntryPath[0] === topology.entry,
    "World topology must declare a canonical entry path beginning at its entry place."
  );
  requireSupportedClaim(
    places.size === topology.places.length,
    "World topology place identifiers must be unique."
  );

  const routes = new Set();
  for (const place of topology.places) {
    requireSupportedClaim(
      place
        && typeof place.id === "string"
        && typeof place.label === "string"
        && typeof place.route === "string"
        && place.route.startsWith("/")
        && WORLD_TOPOLOGY_CLASSIFICATIONS.includes(place.classification)
        && Array.isArray(place.connectsTo)
        && place.passage
        && typeof place.passage.mode === "string",
      "Each world place must declare identity, canonical route, classification, seams, and passage state.",
      { place }
    );
    requireSupportedClaim(!routes.has(place.route), "World topology routes must be canonical and unique.", {
      id: place.id,
      route: place.route
    });
    routes.add(place.route);

    for (const relatedId of [place.containedBy, place.returnsTo, ...place.connectsTo].filter(Boolean)) {
      requireResolvedEdge(places.has(relatedId), `${place.id} references an undeclared place ${relatedId}.`, {
        id: place.id,
        relatedId
      });
    }
    if (place.id === topology.entry) {
      requireSupportedClaim(place.returnsTo === null, "The entry place cannot return beyond itself.");
    } else {
      requireResolvedEdge(Boolean(place.returnsTo), `${place.id} must declare a return destination.`, {
        id: place.id
      });
    }
  }

  for (let index = 0; index < topology.canonicalEntryPath.length; index += 1) {
    const placeId = topology.canonicalEntryPath[index];
    const place = places.get(placeId);
    requireResolvedEdge(place, `Canonical entry path references undeclared place ${placeId}.`, { placeId });
    const nextId = topology.canonicalEntryPath[index + 1];
    if (nextId) {
      requireResolvedEdge(
        place.connectsTo.includes(nextId),
        `Canonical entry path seam from ${placeId} to ${nextId} is not declared.`,
        { placeId, nextId }
      );
    }
  }

  for (const place of topology.places) {
    for (const connectedId of place.connectsTo) {
      const connected = places.get(connectedId);
      requireResolvedEdge(
        connected.connectsTo.includes(place.id),
        `${place.id} has a one-way seam to ${connectedId}.`,
        { id: place.id, connectedId }
      );
    }
  }
  return topology;
}
