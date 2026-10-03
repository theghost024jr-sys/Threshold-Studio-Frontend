const NODE_TYPES = new Set(["biome", "weather", "physics", "character", "entity", "chamber", "note"]);

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.freeze({ ...value }) : Object.freeze({});
}

function normalizeNode(record) {
  if (!record || typeof record !== "object" || !record.id) {
    return null;
  }

  const type = NODE_TYPES.has(record.type) ? record.type : "note";
  return Object.freeze({
    id: String(record.id),
    type,
    map: typeof record.map === "string" ? record.map : "",
    physics: objectValue(record.physics),
    weather: typeof record.weather === "string" ? record.weather : objectValue(record.weather),
    characters: Array.isArray(record.characters) ? Object.freeze(record.characters.slice()) : Object.freeze([]),
    connections: Array.isArray(record.connections) ? Object.freeze(record.connections.slice()) : Object.freeze([]),
    html: typeof record.html === "string" ? record.html : ""
  });
}

export function updateNodeRecord(node, changes = {}) {
  if (!node || typeof node !== "object") {
    return null;
  }

  return Object.freeze({
    ...node,
    weather: changes.weather ? objectValue({ ...node.weather, ...changes.weather }) : node.weather,
    physics: changes.physics ? objectValue({ ...node.physics, ...changes.physics }) : node.physics,
    connections: Array.isArray(changes.connections) ? Object.freeze(changes.connections.slice()) : node.connections,
    characters: Array.isArray(changes.characters) ? Object.freeze(changes.characters.slice()) : node.characters,
    html: typeof changes.html === "string" ? changes.html : node.html
  });
}

export function buildNodeGraph(records = []) {
  const nodes = (Array.isArray(records) ? records : []).map(normalizeNode).filter(Boolean);
  const graph = new Map(nodes.map((node) => [node.id, new Set()]));

  nodes.forEach((node) => {
    node.connections.forEach((connection) => {
      const targetId = String(connection);
      if (!graph.has(targetId)) {
        return;
      }
      graph.get(node.id).add(targetId);
      graph.get(targetId).add(node.id);
    });
  });

  return new Map(Array.from(graph, ([id, connections]) => [
    id,
    Object.freeze(Array.from(connections).sort())
  ]));
}

export function createNodeRegistry(records = []) {
  const nodes = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    const node = normalizeNode(record);
    if (node) {
      nodes.set(node.id, node);
    }
  });

  return Object.freeze({
    get(id) {
      return nodes.get(String(id || "")) || null;
    },
    list(type) {
      return Array.from(nodes.values()).filter((node) => !type || node.type === type);
    }
  });
}