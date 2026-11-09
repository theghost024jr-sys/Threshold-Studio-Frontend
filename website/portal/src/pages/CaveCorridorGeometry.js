export const bendSeveranceGeometry = {
  totalLength: 30.712,
  renderedLength: 23.712,
  eyeHeight: 1.6,
  entrance: { center: { x: 0, z: -1 }, halfWidth: 1.2, base: 0, height: 3 },
  segments: {
    mouth: { start: 0, end: 6, width: 2.4, height: 3 },
    narrowing: { start: 6, end: 14, widthStart: 2.4, widthEnd: 1.5, heightStart: 3, heightEnd: 2.2 },
    bend: { start: 14, end: 18.712, radius: 3, widthStart: 1.5, widthEnd: 1.6, base: 0, height: 2.2 },
    proof: { start: 18.712, end: 23.712, width: 1.6, height: 2.2 },
  },
}

const SIGHTLINE_SAMPLES = 41
const FIELD_OF_VIEW = Math.PI * 0.9
const clamp01 = (value) => Math.min(1, Math.max(0, value))
const lerp = (start, end, amount) => start + (end - start) * amount

const normalizeAngle = (angle) => ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI

export function corridorSampleAtDistance(distance) {
  const { mouth, narrowing, bend, proof } = bendSeveranceGeometry.segments
  const current = Math.min(proof.end, Math.max(0, distance))

  if (current <= mouth.end) return { distance: current, position: { x: 0, z: current }, heading: { x: 0, z: 1 }, width: mouth.width, height: mouth.height }
  if (current <= narrowing.end) {
    const amount = (current - narrowing.start) / (narrowing.end - narrowing.start)
    return { distance: current, position: { x: 0, z: current }, heading: { x: 0, z: 1 }, width: lerp(narrowing.widthStart, narrowing.widthEnd, amount), height: lerp(narrowing.heightStart, narrowing.heightEnd, amount) }
  }
  if (current <= bend.end) {
    const angle = (current - bend.start) / bend.radius
    const amount = angle / (Math.PI / 2)
    return {
      distance: current,
      position: { x: bend.radius - bend.radius * Math.cos(angle), z: bend.start + bend.radius * Math.sin(angle) },
      heading: { x: Math.sin(angle), z: Math.cos(angle) },
      width: lerp(bend.widthStart, bend.widthEnd, amount),
      height: bend.height,
    }
  }
  return { distance: current, position: { x: current - bend.end + bend.radius, z: bend.start + bend.radius }, heading: { x: 1, z: 0 }, width: proof.width, height: proof.height }
}

export function corridorSamples(step = 0.25) {
  const samples = []
  for (let distance = 0; distance < bendSeveranceGeometry.renderedLength; distance += step) samples.push(corridorSampleAtDistance(distance))
  samples.push(corridorSampleAtDistance(bendSeveranceGeometry.renderedLength))
  return samples
}

export function travelerPositionAtProgress(progress) {
  return corridorSampleAtDistance(clamp01(progress) * bendSeveranceGeometry.totalLength).position
}

export function lookDirectionAtAngle(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

export function getHouseGardenBearing(position) {
  const { center } = bendSeveranceGeometry.entrance
  return Math.atan2(center.z - position.z, center.x - position.x)
}

function cross(first, second) {
  return first.x * second.z - first.z * second.x
}

function segmentsIntersect(start, end, wallStart, wallEnd) {
  const ray = { x: end.x - start.x, z: end.z - start.z }
  const wall = { x: wallEnd.x - wallStart.x, z: wallEnd.z - wallStart.z }
  const divisor = cross(ray, wall)
  if (Math.abs(divisor) < 0.000001) return false
  const offset = { x: wallStart.x - start.x, z: wallStart.z - start.z }
  const alongRay = cross(offset, wall) / divisor
  const alongWall = cross(offset, ray) / divisor
  return alongRay >= 0 && alongRay <= 1 && alongWall >= 0 && alongWall <= 1
}

function innerBendWalls() {
  const { bend } = bendSeveranceGeometry.segments
  return corridorSamples(0.1)
    .filter((sample) => sample.distance >= bend.start && sample.distance <= bend.end)
    .map((sample) => ({
      x: sample.position.x + sample.heading.z * sample.width / 2,
      z: sample.position.z - sample.heading.x * sample.width / 2,
    }))
}

function visibilityLabel(fraction) {
  if (fraction === 0) return 'gone'
  if (fraction < 0.2) return 'sliver'
  if (fraction < 1) return 'partial'
  return 'visible'
}

export function observeBendSeverance({ position, lookDirection, fieldOfView = FIELD_OF_VIEW }) {
  const walls = innerBendWalls()
  const orientation = Math.atan2(lookDirection.y, lookDirection.x)
  const { entrance } = bendSeveranceGeometry
  const samples = Array.from({ length: SIGHTLINE_SAMPLES }, (_, index) => {
    const target = { x: entrance.center.x + ((index / 40) * 2 - 1) * entrance.halfWidth, z: entrance.center.z }
    const targetAngle = Math.atan2(target.z - position.z, target.x - position.x)
    const inView = Math.abs(normalizeAngle(targetAngle - orientation)) <= fieldOfView / 2
    const blocked = walls.some((wall, wallIndex) => wallIndex > 0 && segmentsIntersect(position, target, walls[wallIndex - 1], wall))
    return inView && !blocked
  })
  const entranceOpeningFraction = samples.filter(Boolean).length / SIGHTLINE_SAMPLES
  return {
    entranceCenterVisible: samples[20],
    entranceOpeningVisible: entranceOpeningFraction > 0,
    entranceOpeningFraction,
    visibleSamples: samples.filter(Boolean).length,
    visibility: visibilityLabel(entranceOpeningFraction),
  }
}
