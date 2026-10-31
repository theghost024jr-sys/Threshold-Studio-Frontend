const RETURN_STATE_KEY = 'threshold-return-state'

export function recordReturnState(origin, value, detail) {
  sessionStorage.setItem(RETURN_STATE_KEY, JSON.stringify({
    origin,
    value,
    detail,
    updatedAt: Date.now()
  }))
}

export function getReturnState() {
  try {
    const stored = sessionStorage.getItem(RETURN_STATE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
