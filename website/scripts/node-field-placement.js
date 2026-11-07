const DEFAULT_BOUNDS = Object.freeze({
  x: 0.88,
  y: 0.78,
  zMin: 0.12,
  zMax: 0.92
});

export function hashNodeId(value) {
  const input = String(value ?? "");
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function seededRandom(seed) {
  let state = seed >>> 0;

  return function next() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function remap(value, minimum, maximum) {
  return minimum + value * (maximum - minimum);
}

export function createDeterministicPlacement(nodeId, bounds = DEFAULT_BOUNDS) {
  if (!nodeId) throw new TypeError("nodeId is required for deterministic placement");

  const random = seededRandom(hashNodeId(nodeId));
  const radius = Math.sqrt(random());
  const angle = random() * Math.PI * 2;

  return Object.freeze({
    x: Math.cos(angle) * radius * bounds.x,
    y: Math.sin(angle) * radius * bounds.y,
    z: remap(random(), bounds.zMin, bounds.zMax)
  });
}

export function projectDepth(z) {
  const depth = Math.min(1, Math.max(0, Number(z)));
  return Object.freeze({
    scale: 1.08 - depth * 0.38,
    opacity: 0.92 - depth * 0.48,
    parallax: 1 - depth * 0.78
  });
}

export function placeRegistryNode(node) {
  if (!node?.id) throw new TypeError("registry node must contain an id");

  const position = createDeterministicPlacement(node.id);
  return Object.freeze({
    nodeId: node.id,
    ...position,
    ...projectDepth(position.z)
  });
}

export function createNodeFieldLayout(nodes) {
  return [...nodes]
    .filter((node) => node?.id)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)))
    .map(placeRegistryNode);
}
