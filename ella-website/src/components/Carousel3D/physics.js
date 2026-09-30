export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export function advanceRotation(rotation, velocity, elapsed) {
  const nextRotation = rotation + velocity * elapsed
  const nextVelocity = velocity * Math.pow(0.003, elapsed)
  return { rotation: nextRotation, velocity: Math.abs(nextVelocity) < 0.0005 ? 0 : nextVelocity }
}

export function snapRotation(rotation, itemCount) {
  const step = 360 / itemCount
  return Math.round(rotation / step) * step
}
