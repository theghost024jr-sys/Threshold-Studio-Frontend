const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export const caveCorridorDefinition = {
  zones: [
    {
      id: 'mouth',
      meaning: 'invitation',
      range: { start: 0, peak: 0, end: 0.28 },
      environment: { compression: 0.08, crystalPresence: 0.18, crystalLegibility: 0.08, originVisibility: 1, canyonPull: 0, warmth: 0, sandPresence: 0, canyonLight: 0, exteriorVisibility: 0 },
      camera: { mode: 'free', constraint: 0.08, forwardBias: 0.05, horizontalFreedom: 1, verticalFreedom: 0.8, fov: 70 },
    },
    {
      id: 'narrowing',
      meaning: 'commitment',
      range: { start: 0.15, peak: 0.32, end: 0.48 },
      environment: { compression: 0.72, crystalPresence: 0.52, crystalLegibility: 0.3, originVisibility: 0.35, canyonPull: 0, warmth: 0, sandPresence: 0, canyonLight: 0, exteriorVisibility: 0 },
      camera: { mode: 'framed', constraint: 0.7, forwardBias: 0.42, horizontalFreedom: 0.45, verticalFreedom: 0.35, fov: 58 },
    },
    {
      id: 'bend',
      meaning: 'severance',
      range: { start: 0.38, peak: 0.5, end: 0.62 },
      environment: { compression: 0.9, crystalPresence: 0.58, crystalLegibility: 0.42, originVisibility: 0, canyonPull: 0, warmth: 0, sandPresence: 0, canyonLight: 0, exteriorVisibility: 0 },
      camera: { mode: 'guided-turn', constraint: 0.88, forwardBias: 0.56, horizontalFreedom: 0.24, verticalFreedom: 0.26, fov: 57 },
    },
    {
      id: 'deep',
      meaning: 'orientation',
      range: { start: 0.54, peak: 0.68, end: 0.79 },
      environment: { compression: 0.58, crystalPresence: 0.92, crystalLegibility: 1, originVisibility: 0, canyonPull: 0.08, warmth: 0.06, sandPresence: 0, canyonLight: 0, exteriorVisibility: 0 },
      camera: { mode: 'orientation', constraint: 0.28, forwardBias: 0.1, horizontalFreedom: 0.95, verticalFreedom: 0.95, fov: 64 },
    },
    {
      id: 'contamination',
      meaning: 'pull',
      range: { start: 0.71, peak: 0.84, end: 0.97 },
      environment: { compression: 0.28, crystalPresence: 0.72, crystalLegibility: 0.68, originVisibility: 0, canyonPull: 0.82, warmth: 0.82, sandPresence: 0.65, canyonLight: 0.82, exteriorVisibility: 0.45 },
      camera: { mode: 'pulled', constraint: 0.2, forwardBias: 0.7, horizontalFreedom: 0.82, verticalFreedom: 0.8, fov: 69 },
    },
    {
      id: 'reemergence',
      meaning: 'release',
      range: { start: 0.9, peak: 1, end: 1 },
      environment: { compression: 0, crystalPresence: 0.18, crystalLegibility: 0.18, originVisibility: 0, canyonPull: 1, warmth: 1, sandPresence: 1, canyonLight: 1, exteriorVisibility: 1 },
      camera: { mode: 'released', constraint: 0, forwardBias: 0, horizontalFreedom: 1, verticalFreedom: 1, fov: 75 },
    },
  ],
}

function zoneWeight(progress, { start, peak, end }) {
  if (progress < start || progress > end) return 0
  if (progress === peak || start === end || (peak === start && progress <= peak) || (peak === end && progress >= peak)) return 1
  if (progress < peak) return clamp01((progress - start) / (peak - start))
  return clamp01((end - progress) / (end - peak))
}

function weightedValue(zones, group, field, fallback = 0) {
  const total = zones.reduce((sum, { weight }) => sum + weight, 0)
  if (total === 0) return fallback
  return zones.reduce((sum, { zone, weight }) => sum + zone[group][field] * weight, 0) / total
}

export function deriveCaveCorridorState(progress) {
  const currentProgress = clamp01(progress)
  const activeZones = caveCorridorDefinition.zones
    .map((zone) => ({ zone, weight: zoneWeight(currentProgress, zone.range) }))
    .filter(({ weight }) => weight > 0)
  const zones = activeZones.length > 0
    ? activeZones
    : [{ zone: caveCorridorDefinition.zones[0], weight: 1 }]
  const dominantZone = zones.reduce((current, candidate) => candidate.weight > current.weight ? candidate : current).zone

  const environment = {}
  for (const field of Object.keys(dominantZone.environment)) {
    environment[field] = weightedValue(zones, 'environment', field)
  }

  const camera = {}
  for (const field of ['constraint', 'forwardBias', 'horizontalFreedom', 'verticalFreedom', 'fov']) {
    camera[field] = weightedValue(zones, 'camera', field)
  }

  return {
    progress: currentProgress,
    zone: dominantZone.id,
    meaning: dominantZone.meaning,
    activeZones: zones.map(({ zone, weight }) => ({ id: zone.id, weight })),
    environment,
    camera: { ...camera, mode: dominantZone.camera.mode },
    originVisible: environment.originVisibility > 0,
    canyonVisible: environment.canyonLight > 0 || environment.exteriorVisibility > 0,
  }
}
