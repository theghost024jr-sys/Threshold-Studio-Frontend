const FIBONACCI_SEQUENCE = Object.freeze([13, 8, 5, 3, 2, 1]);

function assertSequence(config) {
  const sequence = config && config.sequence;
  if (!Array.isArray(sequence) || sequence.length !== FIBONACCI_SEQUENCE.length
    || sequence.some((fib, index) => fib !== FIBONACCI_SEQUENCE[index])) {
    throw new Error("Fibonacci route sequence must be 13, 8, 5, 3, 2, 1");
  }
}

export function resolveFibonacciRoute(config, spokeId, pathId) {
  assertSequence(config);
  const spoke = config.spokes && config.spokes[spokeId];
  if (!spoke) {
    throw new Error("Unknown Fibonacci spoke: " + spokeId);
  }
  const route = (spoke.routes || []).find((candidate) => candidate.id === pathId);
  if (!route) {
    throw new Error("Unknown path for " + spokeId + ": " + pathId);
  }
  if (route.targetFib >= spoke.entryFib) {
    throw new Error("Fibonacci routes must move inward");
  }
  return Object.freeze({
    spoke: spokeId,
    path: route.id,
    label: route.label,
    version: route.version,
    fromFib: spoke.entryFib,
    fib: route.targetFib
  });
}

export function buildFibonacciUrl(lineage, baseUrl = "spoke.html") {
  const params = new URLSearchParams({
    id: lineage.spoke,
    path: lineage.path,
    version: lineage.version,
    fib: String(lineage.fib)
  });
  return baseUrl + "?" + params.toString();
}

export function readFibonacciLineage(search) {
  const params = new URLSearchParams(search);
  const fib = Number(params.get("fib"));
  if (!params.get("id") || !params.get("path") || !params.get("version")
    || !FIBONACCI_SEQUENCE.includes(fib)) {
    return null;
  }
  return Object.freeze({
    spoke: params.get("id"),
    path: params.get("path"),
    version: params.get("version"),
    fib
  });
}

export { FIBONACCI_SEQUENCE };